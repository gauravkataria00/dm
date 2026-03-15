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
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:shadow-none`}
      >
        <nav className="p-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`block px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="w-full flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 text-gray-800 flex items-center justify-between px-4 py-3 shadow-sm">
          <button
            className="md:hidden text-2xl text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <h1 className="font-semibold text-lg sm:text-xl">
            🐄 Dairy Manager Pro
          </h1>

          <button
            onClick={() => {
              localStorage.removeItem("adminToken");
              window.location.href = "/login";
            }}
            className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 w-full p-4 sm:p-6 overflow-auto">
          <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}