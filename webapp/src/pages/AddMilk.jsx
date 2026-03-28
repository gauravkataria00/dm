import { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import { getClients, createMilkEntry, getMilkEntries } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function AddMilk() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [litres, setLitres] = useState("");
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("");
  const [rate, setRate] = useState("");
  const [type, setType] = useState("cow");
  const [shift, setShift] = useState("morning");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isRateManuallyEdited, setIsRateManuallyEdited] = useState(false);
  const [todaySummary, setTodaySummary] = useState({
    totalEntries: 0,
    totalLitres: 0,
    totalAmount: 0,
    morningLitres: 0,
    eveningLitres: 0,
  });

  const { push } = useToast();

  const cowRate = parseFloat(localStorage.getItem("cowRate")) || 45;
  const buffaloRate = parseFloat(localStorage.getItem("buffaloRate")) || 55;
  const defaultRateForType = type === "cow" ? cowRate : buffaloRate;
  const total = Number(litres || 0) * Number(rate || 0);

  const loadTodaySummary = async () => {
    try {
      const entries = await getMilkEntries();
      const today = new Date().toISOString().split("T")[0];
      const todaysEntries = (entries || []).filter((entry) =>
        String(entry?.createdAt || "").startsWith(today)
      );

      const summary = todaysEntries.reduce(
        (acc, entry) => {
          const litresValue = Number(entry?.litres || 0);
          const rateValue = Number(entry?.rate || 0);
          const entryTotal = Number(entry?.total || litresValue * rateValue);

          acc.totalEntries += 1;
          acc.totalLitres += litresValue;
          acc.totalAmount += entryTotal;

          if (entry?.shift === "evening") {
            acc.eveningLitres += litresValue;
          } else {
            acc.morningLitres += litresValue;
          }

          return acc;
        },
        {
          totalEntries: 0,
          totalLitres: 0,
          totalAmount: 0,
          morningLitres: 0,
          eveningLitres: 0,
        }
      );

      setTodaySummary(summary);
    } catch {
      setTodaySummary({
        totalEntries: 0,
        totalLitres: 0,
        totalAmount: 0,
        morningLitres: 0,
        eveningLitres: 0,
      });
    }
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await getClients();
        setClients(data || []);
        setFilteredClients(data || []);
        setRate(String(defaultRateForType));
        await loadTodaySummary();
      } catch {
        push("Failed to load clients", "error");
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [push]);

  // ✅ FORCE EMPTY STATE ON PAGE LOAD
  useEffect(() => {
    setSelectedClientId("");
    setSearch("");
  }, []);

  useEffect(() => {
    if (!Array.isArray(clients) || clients.length === 0) {
      setFilteredClients([]);
      return;
    }

    const term = (search || "").toString().trim().toLowerCase();
    if (!term) {
      setFilteredClients(clients);
      return;
    }

    setFilteredClients(
      clients.filter((client) => {
        const name = (client?.name || "").toLowerCase();
        const phone = (client?.phone || "").toLowerCase();
        return name.includes(term) || phone.includes(term);
      })
    );
  }, [clients, search]);

  useEffect(() => {
    if (!isRateManuallyEdited) {
      setRate(String(defaultRateForType));
    }
  }, [defaultRateForType, isRateManuallyEdited]);

  const openWhatsAppWithEntry = (savedEntry) => {
    const selectedClient = clients.find(
      (client) => String(client?.id) === String(selectedClientId)
    );
    const phone = String(selectedClient?.phone || "").replace(/[^0-9]/g, "");

    if (!phone) {
      push("Entry saved. Client phone not found for WhatsApp.", "success");
      return;
    }

    const entryDate = savedEntry?.createdAt ? new Date(savedEntry.createdAt) : new Date();
    const formattedDate = entryDate.toLocaleDateString("en-IN");
    const formattedTime = entryDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const finalLitres = Number(savedEntry?.litres ?? litres ?? 0);
    const finalFat = Number(savedEntry?.fat ?? fat ?? 0);
    const finalSnf = Number(savedEntry?.snf ?? snf ?? 0);
    const finalRate = Number(savedEntry?.rate ?? rate ?? 0);
    const finalTotal = Number(savedEntry?.total ?? total ?? 0);
    const finalType = savedEntry?.type || type;
    const finalShift = savedEntry?.shift || shift;

    const message = `🥛 Milk Entry Update\n\nClient: ${selectedClient?.name || "Customer"}\nDate: ${formattedDate}\nTime: ${formattedTime}\nType: ${String(finalType).toUpperCase()}\nShift: ${finalShift === "evening" ? "Evening 🌙" : "Morning 🌅"}\nLitres: ${finalLitres.toFixed(2)} L\nFAT: ${finalFat.toFixed(2)}%\nSNF: ${finalSnf.toFixed(2)}%\nRate: ₹${finalRate.toFixed(2)}/L\nTotal: ₹${finalTotal.toFixed(2)}\n\nThank you 🙏\nDairy Manager Pro`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const popup = window.open(whatsappUrl, "_blank");

    if (!popup) {
      push("Entry saved, but WhatsApp popup was blocked by browser.", "error");
      return;
    }

    push("WhatsApp opened with entry details", "success");
  };

  const handleSave = async () => {
    if (!selectedClientId) {
      push("Please select a customer", "error");
      return;
    }

    if (!litres || Number(litres) <= 0) {
      push("Enter a valid litres value", "error");
      return;
    }

    if (!rate || Number(rate) <= 0) {
      push("Enter a valid rate", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const savedEntry = await createMilkEntry({
        clientId: selectedClientId,
        type,
        litres: Number(litres),
        fat: Number(fat) || 0,
        snf: Number(snf) || 0,
        rate: Number(rate),
        total,
        shift, // ✅ NEW FIELD
      });
      push("Milk entry saved", "success");
      setLitres("");
      setFat("");
      setSnf("");
      setRate(String(defaultRateForType));
      setIsRateManuallyEdited(false);
      await loadTodaySummary();

      setIsSendingWhatsApp(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      openWhatsAppWithEntry(savedEntry);
    } catch {
      push("Failed to save milk entry", "error");
    } finally {
      setIsSubmitting(false);
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add Milk Entry</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl bg-white dark:bg-gray-900 shadow-md p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Today Entries</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{todaySummary.totalEntries}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-900 shadow-md p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Today Litres</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{todaySummary.totalLitres.toFixed(1)} L</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-900 shadow-md p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Morning / Evening</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {todaySummary.morningLitres.toFixed(1)} / {todaySummary.eveningLitres.toFixed(1)} L
          </p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-900 shadow-md p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Today Amount</p>
          <p className="text-xl font-bold text-green-600">₹ {todaySummary.totalAmount.toFixed(0)}</p>
        </div>
      </div>

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
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedClientId(""); // ✅ RESET ON TYPING
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                placeholder="Search client by name / phone / SR No."
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />

              {dropdownOpen && clients?.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredClients?.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No clients found</div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client?.id}
                        type="button"
                        onClick={() => {
                          setSelectedClientId(client?.id ?? "");
                          setSearch(`${client?.name || ""} (${client?.phone || "-"})`);
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {`${client?.name || "N/A"} (${client?.phone || "-"})`}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Show Phone Only After Selection */}
            {selectedClientId && (
              <div className="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-400">
                📞 {clients.find(c => c?.id === selectedClientId)?.phone || "No phone"}
              </div>
            )}

            {/* Milk Type */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setType("cow");
                  if (!isRateManuallyEdited) setRate(String(cowRate));
                }}
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
                onClick={() => {
                  setType("buffalo");
                  if (!isRateManuallyEdited) setRate(String(buffaloRate));
                }}
                className={`flex-1 text-center px-4 py-2 rounded-xl font-semibold transition ${
                  type === "buffalo"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Buffalo
              </button>
            </div>

            {/* Shift Selection */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShift("morning")}
                className={`px-3 py-2 rounded font-semibold transition ${
                  shift === "morning"
                    ? "bg-yellow-400 text-black shadow-md"
                    : "bg-gray-600 text-white hover:bg-gray-500"
                }`}
              >
                🌅 Morning
              </button>
              <button
                type="button"
                onClick={() => setShift("evening")}
                className={`px-3 py-2 rounded font-semibold transition ${
                  shift === "evening"
                    ? "bg-purple-500 text-white shadow-md"
                    : "bg-gray-600 text-white hover:bg-gray-500"
                }`}
              >
                🌙 Evening
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

            <input
              type="number"
              placeholder="Enter Rate (₹/L)"
              value={rate}
              onChange={(e) => {
                setRate(e.target.value);
                setIsRateManuallyEdited(true);
              }}
              className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRate(String(defaultRateForType));
                  setIsRateManuallyEdited(false);
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Use Default Rate (₹ {defaultRateForType})
              </button>
              <button
                type="button"
                onClick={() => {
                  setLitres("");
                  setFat("");
                  setSnf("");
                  setRate(String(defaultRateForType));
                  setIsRateManuallyEdited(false);
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
              >
                Reset Form
              </button>
            </div>

            {/* Calculation */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-gray-800 dark:text-gray-200">Rate: ₹ {Number(rate || 0).toFixed(2)} / L</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">Total: ₹ {total.toFixed(2)}</p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || isSendingWhatsApp}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  Saving Entry...
                </>
              ) : isSendingWhatsApp ? (
                <>
                  <span className="animate-bounce">📲</span>
                  Opening WhatsApp...
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Entry + WhatsApp</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </MainLayout>
  );
}