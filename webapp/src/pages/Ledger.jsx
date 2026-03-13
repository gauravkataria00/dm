import { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import { getMilkEntries } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await getMilkEntries();
        setEntries(data);
      } catch {
        push("Failed to load milk entries", "error");
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [push]);

  const totalLitres = entries.reduce((sum, e) => sum + e.litres, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.total, 0);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Milk Ledger</h1>
        <p className="text-gray-600 mt-2">View all milk entries with customer details.</p>
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading ledger...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No milk entries found</div>
        ) : (
          <div className="overflow-x-auto">
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
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">{entry.clientName}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{entry.type}</td>
                    <td className="px-6 py-4 text-gray-600">{entry.litres} L</td>
                    <td className="px-6 py-4 text-gray-600">{entry.fat}%</td>
                    <td className="px-6 py-4 text-gray-600">{entry.snf}%</td>
                    <td className="px-6 py-4 text-gray-600">₹{entry.rate.toFixed(2)}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">₹{entry.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</td>
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
