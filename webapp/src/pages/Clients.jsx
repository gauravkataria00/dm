import { useState, useEffect, useRef } from "react";
import MainLayout from "../components/layout/MainLayout";
import { getClients, createClient, deleteClient } from "../services/api";
import { useToast } from "../context/ToastContext";
import LoadingState from "../components/common/LoadingState";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { push } = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getClients();
      setClients(data);
      setError("");
    } catch (error) {
      setError(error?.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Client name is required");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError("Valid phone number is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const newClient = await createClient(formData);
      setClients([...clients, newClient]);
      setFormData({ name: "", phone: "" });
      setSuccess("Client added successfully!");
      setError("");
      push("Client added successfully", "success");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error?.message || "Failed to add client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteClient(id);
      setClients(clients.filter((c) => c.id !== id));
      push("Client deleted", "success");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      push("Failed to delete client", "error");
      setError(error?.message || "Failed to delete client");
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) || client.phone.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginated = filteredClients.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const rows = ["Name,Phone,Joined", ...filteredClients.map((c) => `${c.name},${c.phone},${new Date(c.createdAt).toLocaleString()}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients.csv";
    a.click();
    URL.revokeObjectURL(url);
    push("Exported clients.csv", "success");
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Clients Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your dairy clients and suppliers here.</p>
      </div>

      {error && <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">❌ {error}</div>}
      {success && <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">✅ {success}</div>}

      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">➕ Add New Client</h2>
        <form onSubmit={handleAddClient} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Client Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add Client"}
          </button>
        </form>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <LoadingState message="Loading clients..." />
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No clients found</div>
        ) : (
          <>
            {/* Mobile-friendly list */}
            <div className="space-y-4 sm:hidden">
              {paginated.map((client) => (
                <div
                  key={client.id}
                  className="p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white">{client.name}</div>
                      <div className="text-gray-300">{client.phone}</div>
                      <div className="text-xs text-gray-400 mt-1">Joined: {new Date(client.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto w-full">
              <table className="min-w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-gray-700 bg-gray-900 hover:bg-gray-800 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 font-semibold text-white">{client.name}</td>
                      <td className="px-6 py-4 text-gray-300">{client.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(client.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-800 font-medium transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded">Export CSV</button>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page<=1}
            onClick={()=>setPage((p)=>Math.max(1,p-1))}
            className={
              page <= 1
                ? "px-4 py-2 rounded-lg bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed border border-gray-600"
                : "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition border border-gray-600"
            }
          >
            Prev
          </button>
          <span className="px-3">Page {page} / {totalPages}</span>
          <button
            disabled={page>=totalPages}
            onClick={()=>setPage((p)=>Math.min(totalPages,p+1))}
            className={
              page >= totalPages
                ? "px-4 py-2 rounded-lg bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed border border-gray-600"
                : "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition border border-gray-600"
            }
          >
            Next
          </button>
        </div>
      </div>
    </MainLayout>
  );
}