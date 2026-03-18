import MainLayout from "../components/layout/MainLayout";
import { useEffect, useState } from "react";
import { getAdvances, getClients, createAdvance, updateAdvanceStatus } from "../services/api";

export default function Advances() {
  const [advances, setAdvances] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    purpose: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log("Starting data load from:", import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000");
      
      const [advancesData, clientsData] = await Promise.all([
        getAdvances(),
        getClients()
      ]);
      
      console.log("Raw advances data:", advancesData);
      console.log("Raw clients data:", clientsData);
      console.log("Clients is array?", Array.isArray(clientsData));
      console.log("Clients length:", clientsData?.length);
      
      const processedAdvances = Array.isArray(advancesData) ? advancesData : [];
      const processedClients = Array.isArray(clientsData) ? clientsData : [];
      
      setAdvances(processedAdvances);
      setClients(processedClients);
      
      console.log("State update - Advances loaded:", processedAdvances.length);
      console.log("State update - Clients loaded:", processedClients.length);
      console.log("Clients data structure:", processedClients.map(c => ({ id: c.id, _id: c._id, name: c.name })));
    } catch (error) {
      console.error("Error loading data:", error);
      setAdvances([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdvance = async (e) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      alert("Please select a client");
      return;
    }
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    try {
      await createAdvance(formData);
      setFormData({
        clientId: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        purpose: ""
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error("Error creating advance:", error);
      alert("Failed to create advance");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateAdvanceStatus(id, status);
      loadData();
    } catch (error) {
      console.error("Error updating advance:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-yellow-100 text-yellow-800";
      case "repaid": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActiveAdvancesTotal = () => {
    return advances
      .filter(advance => advance.status === 'active')
      .reduce((total, advance) => total + advance.amount, 0);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-gray-500">Loading advances...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Advances</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage advances given to clients</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            Give Advance
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Advances Summary</h2>
            <p className="text-gray-600 dark:text-gray-400">Total outstanding advances to clients</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{getActiveAdvancesTotal().toFixed(2)}</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Active Advances</div>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Give New Advance</h2>
          <form onSubmit={handleCreateAdvance} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Client *</label>
              {clients?.length === 0 ? (
                <div className="w-full px-4 py-3 text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                  No clients available
                </div>
              ) : (
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                  required
                >
                  <option value="">Select Client</option>
                  {clients?.map(client => (
                    <option key={client?.id} value={client?.id || client?._id}>
                      {client?.name || "N/A"} ({client?.phone || "-"})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                placeholder="Enter amount"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Purpose</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                placeholder="e.g., Medical emergency, Farm expenses"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={clients?.length === 0}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Give Advance
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Advance History</h2>
        </div>
        {advances?.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">📋 No advances recorded yet</div>
            <p className="text-gray-500 dark:text-gray-400">Give your first advance to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {advances?.map((advance) => (
                  <tr key={advance?.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {advance?.clientName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      ₹{advance?.amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {advance?.date ? new Date(advance.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {advance?.purpose || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(advance?.status)}`}>
                        {advance?.status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {advance?.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(advance?.id, 'repaid')}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-semibold transition"
                        >
                          Mark Repaid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}