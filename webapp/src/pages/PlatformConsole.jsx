import { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/config";

export default function PlatformConsole() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdCredential, setCreatedCredential] = useState(null);

  const [tenantName, setTenantName] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [monthlyCharge, setMonthlyCharge] = useState(1500);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const getPlatformToken = () => localStorage.getItem("platformToken") || "";
  const formInputClass =
    "w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 " +
    "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 " +
    "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 dark:hover:border-gray-500";

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getPlatformToken()}`,
  });

  const loadTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/platform/tenants`, {
        headers: getAuthHeaders(),
      });
      const payload = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to load tenants");
      }
      setTenants(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getPlatformToken();
    console.log("TOKEN:", token);

    if (!token) {
      window.location.href = "/#/platform/login";
      return;
    }

    loadTenants();
  }, []);

  const createTenant = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setCreatedCredential(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/platform/tenants`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tenantName,
          tenantCode,
          monthlyCharge: Number(monthlyCharge || 0),
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to create tenant");
      }

      setCreatedCredential(payload);
      setTenantName("");
      setTenantCode("");
      setMonthlyCharge(1500);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      await loadTenants();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateTenant = async (tenant) => {
    try {
      setError("");
      const primaryAdmin = tenant.admins?.[0] || {};

      const nextTenantName = window.prompt("Dairy Name", tenant.name || "");
      if (nextTenantName === null) return;

      const nextMonthlyCharge = window.prompt("Monthly Charge", String(tenant.monthlyCharge || 0));
      if (nextMonthlyCharge === null) return;

      const nextAdminName = window.prompt("Admin Name", primaryAdmin.name || "");
      if (nextAdminName === null) return;

      const nextAdminEmail = window.prompt("Admin Email", primaryAdmin.email || "");
      if (nextAdminEmail === null) return;

      const nextAdminPassword = window.prompt(
        "Temp Password (leave blank to keep old)",
        primaryAdmin.tempPassword || ""
      );
      if (nextAdminPassword === null) return;

      const res = await fetch(`${API_BASE_URL}/api/platform/tenants/${tenant.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tenantName: nextTenantName,
          monthlyCharge: Number(nextMonthlyCharge || 0),
          adminName: nextAdminName,
          adminEmail: nextAdminEmail,
          adminPassword: nextAdminPassword,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to update tenant");
      }

      await loadTenants();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTenant = async (tenant) => {
    try {
      setError("");
      const confirmed = window.confirm(`Delete dairy account \"${tenant.name}\"?`);
      if (!confirmed) return;

      const res = await fetch(`${API_BASE_URL}/api/platform/tenants/${tenant.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to delete tenant");
      }

      await loadTenants();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Console</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create dairy accounts and generate login credentials (existing dairy website unchanged).
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Dairy Admin</h2>
          <form onSubmit={createTenant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Dairy Name" className={formInputClass} required />
            <input value={tenantCode} onChange={(e) => setTenantCode(e.target.value.toLowerCase())} placeholder="Dairy Code (unique)" className={formInputClass} required />
            <input type="number" value={monthlyCharge} onChange={(e) => setMonthlyCharge(e.target.value)} placeholder="Monthly Charge" className={formInputClass} />
            <input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Admin Name" className={formInputClass} required />
            <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Admin Email" className={formInputClass} required />
            <div className="relative">
              <input
                type={showAdminPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Temp Password"
                className={`${formInputClass} pr-20`}
                required
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded-md text-sm font-medium text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
                aria-label={showAdminPassword ? "Hide password" : "Show password"}
              >
                {showAdminPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="md:col-span-2">
              <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold disabled:opacity-60">
                {saving ? "Creating..." : "Create Dairy Admin"}
              </button>
            </div>
          </form>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          {createdCredential?.success && (
            <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-900 text-sm">
              Created: {createdCredential?.tenant?.name} ({createdCredential?.tenant?.code})<br />
              Admin Email: {createdCredential?.admin?.email}<br />
              Temp Password: {createdCredential?.admin?.tempPassword}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Existing Dairy Accounts</h2>
            <button
              onClick={loadTenants}
              className="text-sm px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-500"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : tenants.length === 0 ? (
            <p className="text-sm text-gray-500">No dairy accounts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Dairy</th>
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Charge</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Admin Email</th>
                    <th className="py-2 pr-4">Temp Password</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => {
                    const primaryAdmin = tenant.admins?.[0] || {};
                    return (
                      <tr key={tenant.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{tenant.name}</td>
                        <td className="py-2 pr-4">{tenant.code}</td>
                        <td className="py-2 pr-4">₹{Number(tenant.monthlyCharge || 0)}</td>
                        <td className="py-2 pr-4">{tenant.isActive ? "Active" : "Blocked"}</td>
                        <td className="py-2 pr-4">{primaryAdmin.email || "-"}</td>
                        <td className="py-2 pr-4">{primaryAdmin.tempPassword || "-"}</td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateTenant(tenant)}
                              className="px-3 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTenant(tenant)}
                              className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}