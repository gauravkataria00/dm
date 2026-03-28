export default function TenantHome() {
  const tenantName = localStorage.getItem("tenantName") || "Your Dairy";
  const tenantAdminName = localStorage.getItem("tenantAdminName") || "Tenant Admin";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dairy Admin Panel</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome, {tenantAdminName}</p>
        <p className="text-gray-600 dark:text-gray-300">Dairy: {tenantName}</p>

        <div className="mt-6 p-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100">
          Tenant admin ka interface alag route par enabled hai, taaki legacy dashboard data mix na ho.
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("tenantToken");
            localStorage.removeItem("tenantAdminName");
            localStorage.removeItem("tenantName");
            window.location.href = "/login";
          }}
          className="mt-6 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
