import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const { login, signup, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectTarget = useMemo(() => {
    const from = location.state?.from;
    if (!from || typeof from !== "object") {
      return "/dashboard";
    }

    const pathname = from.pathname || "/dashboard";
    const search = from.search || "";
    const hash = from.hash || "";
    return `${pathname}${search}${hash}`;
  }, [location.state]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectTarget, { replace: true });
    }
  }, [loading, isAuthenticated, navigate, redirectTarget]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        await signup({ name, email, password });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err?.message || t.serverError);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-gray-600 dark:text-gray-300">{t.processing}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 transition-all duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2 transition-all duration-300">🐄 {t.dairyManagerPro}</h1>
          <p className="text-gray-600 dark:text-gray-300 transition-all duration-300">{mode === "signup" ? t.createAccount : t.login}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 transition-all duration-300">
                {t.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                placeholder={t.yourName}
                required
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 transition-all duration-300">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
              placeholder="name@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 transition-all duration-300">
              {t.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
              placeholder={t.enterPassword}
              required
              disabled={isLoading}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
                {t.processing}
              </>
            ) : (
              mode === "signup" ? t.createAccount : t.login
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === "login" ? "signup" : "login"));
            setError("");
          }}
          className="mt-4 w-full text-sm text-green-600 hover:text-green-700"
        >
          {mode === "login" ? t.noAccountSignUp : t.alreadyHaveAccountLogin}
        </button>

        {error && (
          <p className="text-red-500 text-sm mt-4 text-center transition-all duration-300">{error}</p>
        )}
      </div>
    </div>
  );
}