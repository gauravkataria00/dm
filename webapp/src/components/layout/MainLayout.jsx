import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

export default function MainLayout({ children }) {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { path: "/", label: t.dashboard, icon: "📊" },
    { path: "/clients", label: t.clients, icon: "👥" },
    { path: "/add-milk", label: t.addMilkEntry, icon: "🥛" },
    { path: "/ledger", label: t.ledger, icon: "📋" },
    { path: "/payments", label: t.payments, icon: "💳" },
    { path: "/advances", label: t.advances, icon: "💵" },
    { path: "/inventory", label: t.inventory, icon: "📦" },
    { path: "/reports", label: t.reports, icon: "📈" },
    { path: "/settings", label: t.settings, icon: "⚙️" },
  ];

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "hi" : "en";
    setLanguage(newLanguage);
  };

  return (
    <div className="flex min-h-screen transition-all duration-300 overflow-x-hidden bg-gray-100 dark:bg-gray-950">
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg transform transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:shadow-none`}
      >
        <div className="px-6 pt-6 pb-3 border-b border-gray-200 dark:border-gray-800">
          <p className="text-lg font-bold text-gray-900 dark:text-white">🐄 {t.dairyManagerPro}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">सरल डेयरी हिसाब-किताब</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm ${
                location.pathname === item.path
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="w-full flex-1 flex flex-col">
        <header className="bg-green-700 dark:bg-gray-900 text-white flex items-center justify-between px-4 py-3 shadow-md border-b border-white/20 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-2xl text-white"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          </div>

          <h1 className="font-semibold text-base sm:text-lg">{t.dairyManagerPro}</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition duration-200"
              title={language === "en" ? t.switchToHindi : t.switchToEnglish}
            >
              {language === "en" ? t.hindi : t.english}
            </button>
            <button
              onClick={async () => {
                await logout();
                window.location.hash = "#/login";
              }}
              className="text-sm text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
            >
              {t.logout}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full p-4 sm:p-6 overflow-auto transition-all duration-300">
          <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}