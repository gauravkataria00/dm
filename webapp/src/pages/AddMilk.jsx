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

  const rate = fat ? (type === "cow" ? fat * 10 : fat * 12) : 0;
  const total = litres && rate ? litres * rate : 0;

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
      <h1 className="text-2xl font-bold mb-4">Add Milk Entry</h1>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading customers...</div>
        ) : clients.length === 0 ? (
          <div className="text-center text-gray-500">
            No customers found. Please add a customer first.
          </div>
        ) : (
          <>
            <label className="block font-medium">Customer</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.phone || "-"})
                </option>
              ))}
            </select>

            {/* Milk Type */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setType("cow")}
                className={`px-4 py-2 rounded ${
                  type === "cow"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                Cow
              </button>

              <button
                type="button"
                onClick={() => setType("buffalo")}
                className={`px-4 py-2 rounded ${
                  type === "buffalo"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
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
              className="w-full border p-2 rounded"
            />

            <input
              type="number"
              placeholder="Fat %"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <input
              type="number"
              placeholder="SNF %"
              value={snf}
              onChange={(e) => setSnf(e.target.value)}
              className="w-full border p-2 rounded"
            />

            {/* Calculation */}
            <div className="bg-gray-100 p-3 rounded">
              <p>Rate: ₹ {rate.toFixed(2)}</p>
              <p className="font-bold text-lg">Total: ₹ {total.toFixed(2)}</p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Entry"}
            </button>
          </>
        )}
      </div>
    </MainLayout>
  );
}