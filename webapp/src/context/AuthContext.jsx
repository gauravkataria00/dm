import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../services/config";

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = "adminToken";
const AUTH_USER_KEY = "authUser";

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || "");
	const [user, setUser] = useState(() => {
		try {
			const raw = localStorage.getItem(AUTH_USER_KEY);
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	});
	const [loading, setLoading] = useState(true);

	const persistAuth = (nextToken, nextUser) => {
		setToken(nextToken);
		setUser(nextUser || null);

		if (nextToken) {
			localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
		} else {
			localStorage.removeItem(AUTH_TOKEN_KEY);
		}

		if (nextUser) {
			localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
		} else {
			localStorage.removeItem(AUTH_USER_KEY);
		}
	};

	const logout = async () => {
		try {
			if (token) {
				await fetch(`${API_BASE_URL}/api/auth/logout`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				});
			}
		} catch (error) {
			console.error("Logout request failed:", error);
		} finally {
			persistAuth("", null);
		}
	};

	const login = async ({ email, password }) => {
		const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});

		const payload = await response.json().catch(() => ({}));
		if (!response.ok || !payload?.token) {
			throw new Error(payload?.error || "Login failed");
		}

		persistAuth(payload.token, payload.user || null);
		return payload;
	};

	const signup = async ({ name, email, password }) => {
		const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, email, password }),
		});

		const payload = await response.json().catch(() => ({}));
		if (!response.ok || !payload?.token) {
			throw new Error(payload?.error || "Signup failed");
		}

		persistAuth(payload.token, payload.user || null);
		return payload;
	};

	useEffect(() => {
		const bootstrap = async () => {
			if (!token) {
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					persistAuth("", null);
					setLoading(false);
					return;
				}

				const profile = await response.json();
				setUser(profile);
				localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
			} catch (error) {
				console.error("Auth bootstrap failed:", error);
				persistAuth("", null);
			} finally {
				setLoading(false);
			}
		};

		bootstrap();
	}, [token]);

	const value = useMemo(
		() => ({
			token,
			user,
			loading,
			isAuthenticated: Boolean(token),
			login,
			signup,
			logout,
		}),
		[token, user, loading]
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

