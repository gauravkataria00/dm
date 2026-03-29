import { useState } from "react";
import { API_BASE_URL } from "../services/config";

export default function PlatformLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res = await fetch(`${API_BASE_URL}/api/platform/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 404) {
        res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      }

      const payload = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setError("Backend platform routes not deployed yet. Please redeploy backend on Render.");
        return;
      }

      if (!res.ok || !payload?.token) {
        setError(payload?.error || "Invalid platform credentials");
        return;
      }

      localStorage.setItem("platformToken", payload.token);
      localStorage.setItem("platformAdminName", payload?.admin?.name || "Owner");
      console.log("TOKEN:", localStorage.getItem("platformToken"));
      window.location.href = "/#/platform/console";
    } catch (err) {
      console.error(err);
      setError("Platform login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Platform Login</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Owner panel for creating dairy admins and credentials.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Owner email"
            autoComplete="username"
            className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Owner password"
            autoComplete="current-password"
            className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Open Platform Console"}
          </button>
        </form>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}