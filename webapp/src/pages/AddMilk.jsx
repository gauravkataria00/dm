import { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import { getClients, createMilkEntry } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function AddMilk() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [litres, setLitres] = useState("");
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("");
  const [type, setType] = useState("cow");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { push } = useToast();

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await getClients();
        setClients(data);
        if (data.length > 0) setSelectedClientId(data[0].id);
      } catch {
        push("Failed to load clients", "error");
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [push]);

  const cowRate = parseFloat(localStorage.getItem("cowRate")) || 45;
  const buffaloRate = parseFloat(localStorage.getItem("buffaloRate")) || 55;
  const rate = type === "cow" ? cowRate : buffaloRate;
  const total = litres && rate ? Number(litres) * rate : 0;

  const handleSave = async () => {
    if (!selectedClientId) {
      push("Please select a customer", "error");
      return;
    }

    if (!litres || Number(litres) <= 0) {
      push("Enter a valid litres value", "error");
      return;
    }

    if (!fat || Number(fat) <= 0) {
      push("Enter a valid fat percentage", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMilkEntry({
        clientId: selectedClientId,
        type,
        litres: Number(litres),
        fat: Number(fat),
        snf: Number(snf) || 0,
        rate,
        total,
      });
      push("Milk entry saved", "success");
      setLitres("");
      setFat("");
      setSnf("");
    } catch {
      push("Failed to save milk entry", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add Milk Entry</h1>

      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md p-6 space-y-5">
        {loading ? (
          <div className="text-center text-gray-500">Loading customers...</div>
        ) : clients.length === 0 ? (
          <div className="text-center text-gray-500">
            No customers found. Please add a customer first.
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Customer</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.phone || "-"})
                </option>
              ))}
            </select>

            {/* Milk Type */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType("cow")}
                className={`flex-1 text-center px-4 py-2 rounded-xl font-semibold transition ${
                  type === "cow"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Cow
              </button>

              <button
                type="button"
                onClick={() => setType("buffalo")}
                className={`flex-1 text-center px-4 py-2 rounded-xl font-semibold transition ${
                  type === "buffalo"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Buffalo
              </button>
            </div>

            {/* Inputs */}
            <input
              type="number"
              placeholder="Litres"
              value={litres}
              onChange={(e) => setLitres(e.target.value)}
              className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />

            <input
              type="number"
              placeholder="Fat %"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />

            <input
              type="number"
              placeholder="SNF %"
              value={snf}
              onChange={(e) => setSnf(e.target.value)}
              className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />

            {/* Calculation */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-gray-800 dark:text-gray-200">Rate: ₹ {rate.toFixed(2)}</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">Total: ₹ {total.toFixed(2)}</p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Entry"}
            </button>
          </>
        )}
      </div>
    </MainLayout>
  );
}