import { useState } from "react";
import { API_BASE_URL, API_FALLBACK_BASE_URL } from "../services/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const loginBody = JSON.stringify({
        email,
        password
      });

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: loginBody
      };

      const primaryTenantLoginUrl = `${API_BASE_URL}/api/platform/tenant-admin/login`;
      const fallbackTenantLoginUrl = `${API_FALLBACK_BASE_URL}/api/platform/tenant-admin/login`;

      const attemptLogin = async (primaryUrl, fallbackUrl) => {
        let res;
        try {
          res = await fetch(primaryUrl, requestOptions);
        } catch (primaryError) {
          if (API_FALLBACK_BASE_URL && API_FALLBACK_BASE_URL !== API_BASE_URL) {
            res = await fetch(fallbackUrl, requestOptions);
          } else {
            throw primaryError;
          }
        }

        if (!res.ok && res.status >= 500 && API_FALLBACK_BASE_URL && API_FALLBACK_BASE_URL !== API_BASE_URL) {
          res = await fetch(fallbackUrl, requestOptions);
        }

        const contentType = res.headers.get("content-type") || "";
        const isJsonResponse = contentType.includes("application/json");
        const payload = isJsonResponse ? await res.json() : await res.text();

        return { res, payload, isJsonResponse };
      };

      const result = await attemptLogin(primaryTenantLoginUrl, fallbackTenantLoginUrl);

      if (result.res.ok && result.payload?.success) {
        const isTenantAdminLogin = Boolean(result.payload?.tenant);
        const token = result.payload?.token || "";

        if (!token) {
          setError("Login succeeded but token missing");
          return;
        }

        if (isTenantAdminLogin) {
          localStorage.setItem("token", token);
          localStorage.setItem("tenantAdminName", result.payload?.admin?.name || "Tenant Admin");
          localStorage.setItem("tenantName", result.payload?.tenant?.name || "");

          const verifyRes = await fetch(`${API_BASE_URL}/api/clients`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!verifyRes.ok) {
            const payload = await verifyRes.json().catch(() => ({}));
            localStorage.removeItem("token");
            setError(payload?.error || payload?.message || "Token validation failed after login");
            return;
          }

          window.location.href = "/";
          return;
        }

        setError("This login is not allowed on tenant panel");
        return;
      }

      if (!result.res.ok) {
        if (result.isJsonResponse && result.payload?.message) {
          setError(result.payload.message);
          return;
        }

        if (result.isJsonResponse && result.payload?.error) {
          setError(result.payload.error);
          return;
        }

        setError(`Server error (${result.res.status})`);
        return;
      }

      setError("Invalid email or password");
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 transition-all duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2 transition-all duration-300">🐄 Dairy Manager Pro</h1>
          <p className="text-gray-600 dark:text-gray-300 transition-all duration-300">Admin Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 transition-all duration-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
              placeholder="Enter email"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 transition-all duration-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded-md text-sm font-medium text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200 bg-transparent"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-sm mt-4 text-center transition-all duration-300">{error}</p>
        )}
      </div>
    </div>
  );
}