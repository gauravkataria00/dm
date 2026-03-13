import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function MainLayout({ children }) {
  const location = useLocation();
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
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/clients", label: "Clients", icon: "👥" },
    { path: "/add-milk", label: "Add Milk Entry", icon: "🥛" },
    { path: "/ledger", label: "Ledger", icon: "📋" },
    { path: "/settlements", label: "Settlements", icon: "💰" },
    { path: "/payments", label: "Payments", icon: "💳" },
    { path: "/advances", label: "Advances", icon: "💵" },
    { path: "/consumers", label: "Consumers", icon: "🛒" },
    { path: "/consumer-sales", label: "Consumer Sales", icon: "🛍️" },
    { path: "/consumer-payments", label: "Consumer Payments", icon: "💸" },
    { path: "/inventory", label: "Inventory", icon: "📦" },
    { path: "/reports", label: "Reports", icon: "📈" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-blue-700 rounded transition"
            >
              ☰
            </button>
            <h1 className="text-2xl font-bold">🐄 Dairy Manager Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">Welcome Admin</span>
            <div className="w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center font-bold text-blue-900">👤</div>
          </div>
        </div>
      </header>

      <div className="lg:flex">
        {sidebarOpen && (
          <div
            className="fixed top-16 left-0 right-0 bottom-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white shadow-md transform transition-transform duration-300 lg:relative lg:top-0 lg:bottom-auto lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-6 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}