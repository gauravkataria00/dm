import MainLayout from "../components/layout/MainLayout";
import { useEffect, useState } from "react";
import { getPayments, getClients, getSettlements, createPayment, getClientPaymentSummary } from "../services/api";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [clientSummaries, setClientSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    clientId: "",
    settlementId: "",
    amount: "",
    type: "settlement_payment",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [paymentsData, clientsData, settlementsData] = await Promise.all([
        getPayments(),
        getClients(),
        getSettlements()
      ]);
      setPayments(paymentsData);
      setClients(clientsData);
      setSettlements(settlementsData);

      // Load payment summaries for all clients
      const summaries = {};
      for (const client of clientsData) {
        try {
          const summary = await getClientPaymentSummary(client.id);
          summaries[client.id] = summary;
        } catch (error) {
          console.error(`Error loading summary for client ${client.id}:`, error);
        }
      }
      setClientSummaries(summaries);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      await createPayment(formData);
      const client = clients.find(c => c.id === formData.clientId);
      if (client && client.phone) {
        const message = `Payment of ₹${formData.amount} received on ${formData.date}. Notes: ${formData.notes || 'None'}`;
        let phone = client.phone;
        if (!phone.startsWith('+')) {
          phone = '+91' + phone;
        }
        const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
      setFormData({
        clientId: "",
        settlementId: "",
        amount: "",
        type: "settlement_payment",
        date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error("Error creating payment:", error);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "settlement_payment": return "bg-green-100 text-green-800";
      case "advance_given": return "bg-blue-100 text-blue-800";
      case "advance_repaid": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "settlement_payment": return "Settlement Payment";
      case "advance_given": return "Advance Given";
      case "advance_repaid": return "Advance Repaid";
      default: return type;
    }
  };

  const getClientSummary = (clientId) => {
    return clientSummaries[clientId] || {
      totalEarned: 0,
      totalPaid: 0,
      advancesGiven: 0,
      netOutstanding: 0,
      status: 'unknown'
    };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-gray-500">Loading payments...</div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={loadData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Payments</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Track all payment transactions and client balances</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
          >
            Record Payment
          </button>
        </div>
      </div>

      {/* Client Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {clients.map(client => {
          const summary = getClientSummary(client.id);
          return (
            <div key={client.id} className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{client.name}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Earned:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{summary.totalEarned?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Paid:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{summary.totalPaid?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Advances:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{summary.advancesGiven?.toFixed(2) || '0.00'}</span>
                </div>
                <hr className="my-2 border-gray-300 dark:border-gray-600" />
                <div className="flex justify-between font-bold">
                  <span className="text-gray-900 dark:text-white">Net Balance:</span>
                  <span className={summary.netOutstanding > 0 ? 'text-green-600 dark:text-green-400' : summary.netOutstanding < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}>
                    ₹{summary.netOutstanding?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {summary.status === 'owed_to_client' ? '💰 Amount to pay client' :
                   summary.status === 'client_owes' ? '📉 Client owes money' :
                   '✅ Settled'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Record New Payment</h2>
          <form onSubmit={handleCreatePayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value, settlementId: ""})}
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Payment Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                required
              >
                <option value="settlement_payment">Settlement Payment</option>
                <option value="advance_given">Advance Given</option>
                <option value="advance_repaid">Advance Repaid</option>
              </select>
            </div>
            {formData.type === 'settlement_payment' && formData.clientId && (
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Settlement</label>
                <select
                  value={formData.settlementId}
                  onChange={(e) => setFormData({...formData, settlementId: e.target.value})}
                  className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                  <option value="">Select Settlement (Optional)</option>
                  {settlements.filter(s => s.clientId == formData.clientId && s.status === 'pending').map(settlement => (
                    <option key={settlement.id} value={settlement.id}>
                      {settlement.startDate} - {settlement.endDate} (₹{settlement.totalAmount})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                rows="3"
                placeholder="Optional notes..."
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
              >
                Record Payment
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment History</h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(payment.type)}`}>
                      {getTypeLabel(payment.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No payments recorded yet. Record your first payment to get started.
          </div>
        )}
      </div>
    </MainLayout>
  );
}