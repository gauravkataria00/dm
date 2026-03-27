import { useState } from "react";
import { API_BASE_URL, API_FALLBACK_BASE_URL } from "../services/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      let res = await fetch(`${API_BASE_URL}/api/auth/login`, requestOptions);

      if (!res.ok && res.status >= 500 && API_FALLBACK_BASE_URL && API_FALLBACK_BASE_URL !== API_BASE_URL) {
        res = await fetch(`${API_FALLBACK_BASE_URL}/api/auth/login`, requestOptions);
      }

      const contentType = res.headers.get("content-type") || "";
      const isJsonResponse = contentType.includes("application/json");
      const payload = isJsonResponse ? await res.json() : await res.text();

      if (res.ok && payload?.success) {
        localStorage.setItem("adminToken", payload.token);
        window.location.href = "/";
        return;
      }

      if (!res.ok) {
        if (isJsonResponse && payload?.message) {
          setError(payload.message);
          return;
        }

        if (isJsonResponse && payload?.error) {
          setError(payload.error);
          return;
        }

        setError(`Server error (${res.status})`);
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
              placeholder="Himanshu@admin.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 transition-all duration-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
              placeholder="Enter password"
              required
              disabled={isLoading}
            />
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