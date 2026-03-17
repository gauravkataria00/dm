import { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import { getMilkEntries, getClients } from "../services/api";
import { useToast } from "../context/ToastContext";
import { FaWhatsapp } from "react-icons/fa";

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [entriesData, clientsData] = await Promise.all([
          getMilkEntries(),
          getClients()
        ]);
        setEntries(entriesData);
        setClients(clientsData);
      } catch {
        push("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [push]);

  const totalLitres = entries.reduce((sum, e) => sum + e.litres, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.total, 0);

  const formatFatValue = (fat) => {
    const value = Number(fat);
    if (!value || value <= 0 || value > 20) {
      return "-";
    }
    return value.toFixed(2) + "%";
  };

  const formatSnfValue = (snf) => {
    const value = Number(snf);
    if (!value || value <= 0 || value > 15) {
      return "-";
    }
    return value.toFixed(2) + "%";
  };

  const handleSendWhatsApp = (entry) => {
    const client = clients.find(c => c.id === entry.clientId);
    if (!client || !client.phone) {
      push("Client phone number not found", "error");
      return;
    }

    const message = `🥛 Milk Entry Update

Client: ${entry.clientName}
Date: ${new Date(entry.createdAt).toLocaleDateString()}

Milk: ${entry.litres} L
Fat: ${entry.fat || "-"}
Rate: ₹${entry.rate}

Total: ₹${entry.total}

Thank you!
Dairy Manager Pro`;

    const encodedMessage = encodeURIComponent(message);
    const phone = client.phone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Milk Ledger</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">View all milk entries with customer details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Total Entries</h3>
          <p className="text-3xl font-bold mt-2">{entries.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Total Litres</h3>
          <p className="text-3xl font-bold mt-2">{totalLitres.toFixed(2)} L</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Total Amount</h3>
          <p className="text-3xl font-bold mt-2">₹{totalAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading ledger...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No milk entries found</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-4 md:hidden">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">{entry.clientName}</div>
                      <div className="text-sm text-gray-600">{entry.type} milk • {entry.litres}L</div>
                      <div className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => handleSendWhatsApp(entry)}
                      className="bg-green-600 text-white px-3 py-2 rounded text-xs hover:bg-green-700 flex items-center gap-2 transition-colors"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>Fat: {formatFatValue(entry.fat)}</div>
                    <div>SNF: {formatSnfValue(entry.snf)}</div>
                    <div>Rate: ₹{entry.rate.toFixed(2)}</div>
                    <div className="font-semibold text-green-600">Total: ₹{entry.total.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Litres</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fat %</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SNF %</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rate</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-800">{entry.clientName}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{entry.type}</td>
                      <td className="px-6 py-4 text-gray-600">{entry.litres} L</td>
                      <td className="px-6 py-4 text-gray-600">{formatFatValue(entry.fat)}</td>
                      <td className="px-6 py-4 text-gray-600">{formatSnfValue(entry.snf)}</td>
                      <td className="px-6 py-4 text-gray-600">₹{entry.rate.toFixed(2)}</td>
                      <td className="px-6 py-4 font-semibold text-green-600">₹{entry.total.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSendWhatsApp(entry)}
                          className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2 transition-colors"
                        >
                          <FaWhatsapp className="w-4 h-4" />
                          <span className="hidden sm:inline">Send</span>
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
    </MainLayout>
  );
}
