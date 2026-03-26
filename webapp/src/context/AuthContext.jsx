import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../services/config";

const AuthContext = createContext(null);

const AUTH_USER_KEY = "authUser";
const AUTH_META_KEY = "authMeta";
const AUTH_SYNC_KEY = "authSyncEvent";
const AUTH_UNAUTHORIZED_EVENT = "app:auth-unauthorized";
const AUTH_CHANNEL = "dm-auth-sync";
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME || "dm_csrf";
const BOOTSTRAP_MAX_RETRIES = 3;
const BOOTSTRAP_TIMEOUT_MS = 7000;

const safeParseUser = (value) => {
	if (!value) return null;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};

const readStoredSession = () => {
	const user = safeParseUser(localStorage.getItem(AUTH_USER_KEY));
	const meta = safeParseUser(localStorage.getItem(AUTH_META_KEY));
	return { user, meta };
};

const persistStoredSession = (user, meta = null) => {
	if (user) {
		localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
	} else {
		localStorage.removeItem(AUTH_USER_KEY);
	}

	if (meta) {
		localStorage.setItem(AUTH_META_KEY, JSON.stringify(meta));
	} else {
		localStorage.removeItem(AUTH_META_KEY);
	}
};

const parseDurationMs = (value) => {
	if (!value) return null;
	if (typeof value === "number") return value * 1000;

	const raw = String(value).trim().toLowerCase();
	const match = raw.match(/^(\d+)(s|m|h|d)?$/);
	if (!match) return null;

	const amount = Number(match[1]);
	const unit = match[2] || "s";
	const multiplier = {
		s: 1000,
		m: 60 * 1000,
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000,
	}[unit];

	return amount * multiplier;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createTimeoutSignal = (timeoutMs = BOOTSTRAP_TIMEOUT_MS) => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	return {
		signal: controller.signal,
		clear: () => clearTimeout(timer),
	};
};

const readCookie = (name) => {
	const source = `; ${document.cookie}`;
	const parts = source.split(`; ${name}=`);
	if (parts.length < 2) return "";
	return decodeURIComponent(parts.pop().split(";").shift() || "");
};

const isWriteMethod = (method) => {
	const normalized = String(method || "GET").toUpperCase();
	return !["GET", "HEAD", "OPTIONS"].includes(normalized);
};

const isTransientErrorResponse = (status) => status === 0 || status >= 500 || status === 429;

const isSessionHintExpired = (meta) => {
	if (!meta?.expiresAt) return false;
	return Date.now() >= Number(meta.expiresAt) - 15000;
};

const authRequest = async (path, options = {}) => {
	const method = options.method || "GET";
	const headers = {
		...(options.headers || {}),
	};

	if (options.body && !headers["Content-Type"]) {
		headers["Content-Type"] = "application/json";
	}

	if (isWriteMethod(method)) {
		const csrfToken = readCookie(CSRF_COOKIE_NAME);
		if (csrfToken) {
			headers["X-CSRF-Token"] = csrfToken;
		}
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers,
		credentials: "include",
	});

	const payload = await response.json().catch(() => ({}));

	if (response.status === 401 && !options.suppressUnauthorizedEvent) {
		window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
	}

	return { response, payload };
};

export function AuthProvider({ children }) {
	const [syncChannel] = useState(() => {
		if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
			return null;
		}
		return new BroadcastChannel(AUTH_CHANNEL);
	});

	const [state, setState] = useState(() => {
		const { user, meta } = readStoredSession();
		return {
			user,
			meta,
			status: "bootstrapping",
		};
	});

	const publishAuthEvent = (type) => {
		const event = { type, at: Date.now() };
		if (syncChannel) {
			syncChannel.postMessage(event);
		}
		localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify(event));
	};

	const setAuthenticated = (user, meta = null, status = "authenticated") => {
		persistStoredSession(user, meta);
		setState({ user, meta, status });
	};

	const clearSession = () => {
		persistStoredSession(null, null);
		setState({ user: null, meta: null, status: "unauthenticated" });
	};

	const fetchProfile = async (signal) => {
		const timeoutSignal = createTimeoutSignal();
		try {
			const { response, payload } = await authRequest("/api/auth/me", {
				method: "GET",
				signal: signal || timeoutSignal.signal,
			});

      if (!response.ok) {
				const error = new Error(payload?.error || "Failed to validate session");
				error.status = response.status;
				throw error;
			}

			return payload;
		} catch (error) {
			if (error?.name === "AbortError") {
				const timeoutError = new Error("Session validation timed out");
				timeoutError.status = 0;
				throw timeoutError;
			}
			throw error;
		} finally {
			timeoutSignal.clear();
		}
	};

	const runProfileBootstrap = async ({ retries = BOOTSTRAP_MAX_RETRIES, signal } = {}) => {
		let attempt = 0;
		let lastError = null;

		while (attempt < retries) {
			try {
				const profile = await fetchProfile(signal);
				return { profile, transientFailure: false };
			} catch (error) {
				if (error?.name === "AbortError") {
					throw error;
				}

				if (error?.status === 401 || error?.status === 403) {
					throw error;
				}

				lastError = error;
				attempt += 1;
				if (attempt >= retries) break;

				const backoff = 400 * 2 ** (attempt - 1);
				await sleep(backoff);
			}
		}

		return { profile: null, transientFailure: true, error: lastError };
	};

	const login = async ({ email, password }) => {
		const { response, payload } = await authRequest("/api/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
			suppressUnauthorizedEvent: true,
		});

		if (!response.ok) {
			throw new Error(payload?.error || "Login failed");
		}

		const expiresInMs = parseDurationMs(payload?.expiresIn);
		const nextMeta = expiresInMs ? { expiresAt: Date.now() + expiresInMs } : null;
		setAuthenticated(payload.user || null, nextMeta);
		publishAuthEvent("login");

		try {
			const profile = await fetchProfile();
			setAuthenticated(profile, nextMeta);
		} catch (error) {
			clearSession();
			throw new Error(error?.message || "Session validation failed. Please login again.");
		}

		return payload;
	};

	const signup = async ({ name, email, password }) => {
		const { response, payload } = await authRequest("/api/auth/signup", {
			method: "POST",
			body: JSON.stringify({ name, email, password }),
			suppressUnauthorizedEvent: true,
		});

		if (!response.ok) {
			throw new Error(payload?.error || "Signup failed");
		}

		const expiresInMs = parseDurationMs(payload?.expiresIn);
		const nextMeta = expiresInMs ? { expiresAt: Date.now() + expiresInMs } : null;
		setAuthenticated(payload.user || null, nextMeta);
		publishAuthEvent("login");

		try {
			const profile = await fetchProfile();
			setAuthenticated(profile, nextMeta);
		} catch (error) {
			clearSession();
			throw new Error(error?.message || "Session validation failed. Please login again.");
		}

		return payload;
	};

	const logout = async () => {
		clearSession();
		publishAuthEvent("logout");

		try {
			await authRequest("/api/auth/logout", {
				method: "POST",
				suppressUnauthorizedEvent: true,
			});
		} catch (error) {
			console.error("Logout request failed:", error);
		}
	};

	useEffect(() => {
		let isMounted = true;
		const controller = new AbortController();

		const bootstrap = async () => {
			const { user, meta } = readStoredSession();

			if (!user || isSessionHintExpired(meta)) {
				if (isMounted) {
					setState({ user: null, meta: null, status: "unauthenticated" });
				}
				clearSession();
				return;
			}

			if (isMounted) {
				setState({
					user: user || null,
					meta: meta || null,
					status: "bootstrapping",
				});
			}

			try {
				const result = await runProfileBootstrap({ signal: controller.signal });
				if (!isMounted) return;

				if (result.profile) {
					setAuthenticated(result.profile, meta || null);
					return;
				}

				if (result.transientFailure) {
					clearSession();
					return;
				}

				setState({ user: null, meta: null, status: "unauthenticated" });
			} catch (error) {
				if (!isMounted) return;

				if (error?.name === "AbortError") {
					return;
				}

				if (error?.status === 401 || error?.status === 403) {
					clearSession();
					return;
				}

				clearSession();
			}
		};

		bootstrap();

		return () => {
			isMounted = false;
			controller.abort();
		};
	}, []);

	useEffect(() => {
		const handleCrossTabEvent = (event) => {
			if (!event?.data?.type) return;
			if (event.data.type === "logout") {
				clearSession();
			}
			if (event.data.type === "login") {
				setState((prev) => ({ ...prev, status: "bootstrapping" }));
			}
		};

		const handleStorage = (event) => {
			if (event.key !== AUTH_USER_KEY && event.key !== AUTH_META_KEY && event.key !== AUTH_SYNC_KEY) {
				return;
			}

			if (event.key === AUTH_SYNC_KEY) {
				const syncEvent = safeParseUser(event.newValue);
				if (syncEvent?.type === "logout") {
					clearSession();
					return;
				}
				if (syncEvent?.type === "login") {
					setState((prev) => ({ ...prev, status: "bootstrapping" }));
					return;
				}
			}

			const { user, meta } = readStoredSession();
			if (!user) {
				setState({ user: null, meta: null, status: "unauthenticated" });
				return;
			}

			setState({
				user: user || null,
				meta: meta || null,
				status: "bootstrapping",
			});
		};

		const handleUnauthorized = () => {
			clearSession();
		};

		window.addEventListener("storage", handleStorage);
		window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
		if (syncChannel) {
			syncChannel.addEventListener("message", handleCrossTabEvent);
		}

		return () => {
			window.removeEventListener("storage", handleStorage);
			window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
			if (syncChannel) {
				syncChannel.removeEventListener("message", handleCrossTabEvent);
				syncChannel.close();
			}
		};
	}, [syncChannel]);

	const value = useMemo(
		() => ({
			token: null,
			user: state.user,
			loading: state.status === "bootstrapping",
			status: state.status,
			isAuthenticated: state.status === "authenticated" && Boolean(state.user),
			login,
			signup,
			logout,
			restoreProfile: async () => {
				const profile = await fetchProfile();
				setAuthenticated(profile, state.meta || null);
				return profile;
			},
		}),
		[state]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}

