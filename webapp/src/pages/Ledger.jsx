import { useState, useEffect, useMemo } from "react";
import MainLayout from "../components/layout/MainLayout";
import { getMilkEntries, getClients } from "../services/api";
import { useToast } from "../context/ToastContext";
import { FaWhatsapp } from "react-icons/fa";
import { jsPDF } from "jspdf";

const formatNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatPercent = (value, max) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > max) return "-";
  return `${num.toFixed(2)}%`;
};

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf())
    ? date.toLocaleDateString()
    : "-";
};

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeRange, setActiveRange] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    clientId: "",
    start: "",
    end: "",
  });

  const toInputDateString = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (!date || Number.isNaN(date.valueOf())) return "";
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${mm}-${dd}`;
  };

  const applyFilters = ({ clientId, start, end, range = "" }) => {
    setSelectedClientId(clientId);
    setStartDate(start);
    setEndDate(end);
    setAppliedFilters({ clientId, start, end });
    setActiveRange(range);
  };

  const applyQuickRange = (rangeType) => {
    const today = new Date();
    const todayStr = toInputDateString(today);

    let start = todayStr;
    let end = todayStr;

    if (rangeType === "week") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      start = toInputDateString(weekStart);
    }

    if (rangeType === "month") {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      start = toInputDateString(monthStart);
      end = toInputDateString(monthEnd);
    }

    applyFilters({
      clientId: selectedClientId,
      start,
      end,
      range: rangeType,
    });
  };

  const { push } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [entriesData, clientsData] = await Promise.all([
          getMilkEntries(),
          getClients(),
        ]);

        setEntries(Array.isArray(entriesData) ? entriesData : []);
        setClients(Array.isArray(clientsData) ? clientsData : []);
        console.log("Entries:", entries);
      } catch (err) {
        console.error("LOAD ERROR:", err);
        push("Failed to load ledger", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [push]);

  const filteredEntries = useMemo(() => {
    if (!Array.isArray(entries)) return [];

    return entries.filter((entry) => {
      if (appliedFilters.clientId && String(entry?.clientId) !== String(appliedFilters.clientId)) {
        return false;
      }

      const entryDate = entry?.createdAt ? new Date(entry.createdAt) : null;
      if (!entryDate || Number.isNaN(entryDate.valueOf())) {
        return false;
      }

      if (appliedFilters.start) {
        const start = new Date(appliedFilters.start);
        start.setHours(0, 0, 0, 0);
        if (entryDate < start) return false;
      }

      if (appliedFilters.end) {
        const end = new Date(appliedFilters.end);
        end.setHours(23, 59, 59, 999);
        if (entryDate > end) return false;
      }

      return true;
    });
  }, [entries, appliedFilters]);

  const totalLitres = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + formatNumber(e?.litres), 0),
    [filteredEntries]
  );

  const totalAmount = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + formatNumber(e?.total), 0),
    [filteredEntries]
  );

  const handleSendWhatsApp = (entry) => {
    const client = clients.find((c) => c.id === entry?.clientId);
    const rawPhone = client?.phone ?? "";
    const phone = String(rawPhone).replace(/[^0-9]/g, "");

    if (!phone) {
      push("Client phone number not found", "error");
      return;
    }

    const message = `🥛 Milk Entry Update

Client: ${entry?.clientName || "Unknown"}
Date: ${formatDate(entry?.createdAt)}

Milk: ${formatNumber(entry?.litres)} L
Fat: ${entry?.fat ?? "-"}
Rate: ₹${formatNumber(entry?.rate)}

Total: ₹${formatNumber(entry?.total)}

Thank you!
Dairy Manager Pro`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  const handleSendWhatsAppReport = () => {
    if (!appliedFilters.clientId) {
      push("Please select a client to send the report", "error");
      return;
    }

    const client = clients.find((c) => String(c.id) === String(appliedFilters.clientId));
    const rawPhone = client?.phone ?? "";
    const phone = String(rawPhone).replace(/[^0-9]/g, "");

    if (!phone) {
      push("Client phone number not found", "error");
      return;
    }

    const rangeLabel =
      appliedFilters.start || appliedFilters.end
        ? `${appliedFilters.start || "start"} → ${appliedFilters.end || "end"}`
        : "All time";

    const message = `🥛 Milk Report

Client: ${client?.name || "Unknown"}
Period: ${rangeLabel}

Entries: ${filteredEntries.length}
Total litres: ${totalLitres.toFixed(2)} L
Total amount: ₹${totalAmount.toFixed(2)}

Thank you!
Dairy Manager Pro`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  const handleDelete = async (entryId) => {
    if (!entryId) {
      console.warn("No entry ID");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
    if (!confirmDelete) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL;

      console.log("Deleting ID:", entryId);
      console.log("API URL:", API_URL);

      const res = await fetch(`${API_URL}/api/milk/${entryId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      console.log("Response status:", res.status);

      const data = await res.json().catch(() => null);
      console.log("Response data:", data);

      if (!res.ok) {
        alert("Delete failed. Check console.");
        return;
      }

      // Update UI
      setEntries(prev =>
        Array.isArray(prev)
          ? prev.filter(item => item?._id !== entryId)
          : []
      );

      alert("Entry deleted successfully");

    } catch (error) {
      console.error("Delete error:", error);
      alert("Server error while deleting");
    }
  };

  const handleDownloadPdf = () => {
    const client = clients.find((c) => String(c.id) === String(appliedFilters.clientId));
    const clientName = client?.name || client?.title || "All clients";

    const rangeLabel =
      appliedFilters.start || appliedFilters.end
        ? `${appliedFilters.start || "start"} → ${appliedFilters.end || "end"}`
        : "All time";

    const doc = new jsPDF({ unit: "pt" });
    const margin = 40;
    let y = margin;
    const lineHeight = 18;

    doc.setFontSize(16);
    doc.text("Milk Ledger Report", margin, y);
    y += lineHeight * 1.5;

    doc.setFontSize(11);
    doc.text(`Client: ${clientName}`, margin, y);
    y += lineHeight;
    doc.text(`Period: ${rangeLabel}`, margin, y);
    y += lineHeight;
    doc.text(`Total entries: ${filteredEntries.length}`, margin, y);
    y += lineHeight;
    doc.text(`Total milk: ${totalLitres.toFixed(2)} L`, margin, y);
    y += lineHeight;
    doc.text(`Total amount: ₹${totalAmount.toFixed(2)}`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(12);
    doc.text("Entries:", margin, y);
    y += lineHeight;

    const rowHeight = 12;
    const maxY = doc.internal.pageSize.height - margin;

    filteredEntries.forEach((entry, index) => {
      if (y + rowHeight > maxY) {
        doc.addPage();
        y = margin;
      }

      const date = formatDate(entry.createdAt);
      const litres = formatNumber(entry.litres).toFixed(2);
      const total = formatNumber(entry.total).toFixed(2);
      const line = `${index + 1}. ${entry.clientName || "Unknown"} | ${date} | ${litres} L | ₹${total}`;

      doc.text(line, margin, y);
      y += rowHeight;
    });

    doc.save("milk-ledger-report.pdf");
  };

  const renderEntries = () => {
    if (loading) {
      return (
        <div className="p-8 flex flex-col items-center gap-3 text-gray-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <div>Loading ledger…</div>
        </div>
      );
    }

    const hasEntries = Array.isArray(entries) && entries.length > 0;
    const hasFiltered = Array.isArray(filteredEntries) && filteredEntries.length > 0;

    if (!hasEntries) {
      return (
        <div className="p-8 text-center text-gray-500">
          <div className="text-lg font-semibold">No milk entries found</div>
          <div className="mt-2">Add milk entries to see them here.</div>
        </div>
      );
    }

    if (hasEntries && !hasFiltered) {
      return (
        <>
          <div className="space-y-4 md:hidden">
            <div className="p-8 text-center text-gray-500">
              <div className="text-lg font-semibold">No data found for selected filters</div>
              <div className="mt-2">Try a different date range or client.</div>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full min-w-[700px] divide-y divide-gray-200">
              <thead className="bg-white/80 text-left text-sm font-semibold text-gray-700 backdrop-blur">
                <tr>
                  <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Customer</th>
                  <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Type</th>
                  <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Litres</th>
                  <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Fat %</th>
                  <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">SNF %</th>
                  <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Rate</th>
                  <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Total</th>
                  <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Date</th>
                  <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="h-[180px]">
                  <td colSpan={9} className="py-16 text-center text-gray-500">
                    No data found for selected filters
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="space-y-4 md:hidden">
          {filteredEntries.map((entry) => {
            const litres = formatNumber(entry?.litres);
            const rate = formatNumber(entry?.rate);
            const total = formatNumber(entry?.total);

            return (
              <div
                key={entry?.id || `${entry?.clientId}-${entry?.createdAt}`}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {entry?.clientName || "Unknown customer"}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {entry?.type || "Milk"} • {litres} L
                    </div>
                    <div className="text-xs text-gray-500">{formatDate(entry?.createdAt)}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>Fat: {formatPercent(entry?.fat, 20)}</div>
                  <div>SNF: {formatPercent(entry?.snf, 15)}</div>
                  <div>Rate: ₹{rate.toFixed(2)}</div>
                  <div className="font-semibold text-green-600">Total: ₹{total.toFixed(2)}</div>
                </div>

                <div className="flex justify-between gap-2 mt-4">
                  <button
                    onClick={() => handleSendWhatsApp(entry)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold shadow-sm transition duration-200"
                    aria-label="Send WhatsApp message"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    <span>Send</span>
                  </button>

                  <button
                    onClick={() => handleDelete(entry?._id)}
                    className="flex-1 inline-flex items-center justify-center rounded bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-xs font-semibold shadow-sm transition duration-200"
                    aria-label="Delete entry"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full min-w-[700px] divide-y divide-gray-200">
            <thead className="bg-white/80 text-left text-sm font-semibold text-gray-700 backdrop-blur">
              <tr>
                <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Customer</th>
                <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Type</th>
                <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Litres</th>
                <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Fat %</th>
                <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">SNF %</th>
                <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Rate</th>
                <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Total</th>
                <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Date</th>
                <th className="sticky top-0 z-10 bg-white/90 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredEntries.map((entry) => {
                const litres = formatNumber(entry?.litres);
                const rate = formatNumber(entry?.rate);
                const total = formatNumber(entry?.total);

                return (
                  <tr
                    key={entry?.id || `${entry?.clientId}-${entry?.createdAt}`}
                    className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-950 dark:even:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">
                      {entry?.clientName || "Unknown customer"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 capitalize">{entry?.type || "Milk"}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{litres} L</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatPercent(entry?.fat, 20)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatPercent(entry?.snf, 15)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">₹{rate.toFixed(2)}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">₹{total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(entry?.createdAt)}</td>
                    <td className="px-6 py-4 flex gap-2">{/* EXISTING SEND BUTTON (DO NOT REMOVE) */}
                      <button
                        onClick={() => handleSendWhatsApp?.(entry)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Send
                      </button>{/* NEW DELETE BUTTON */}
                      <button
                        onClick={() => handleDelete(entry?._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end gap-2 px-4 py-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Download PDF
          </button>

          <button
            type="button"
            onClick={handleSendWhatsAppReport}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <FaWhatsapp className="w-4 h-4" />
            Send WhatsApp Report
          </button>
        </div>
      </>
    );
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Milk Ledger
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          View all milk entries with customer details.
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generate Client Report
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Filter entries by client and date range, then generate a report.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
              Client
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.title || client.id}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyQuickRange("today")}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeRange === "today"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange("week")}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeRange === "week"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange("month")}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeRange === "month"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                This Month
              </button>
            </div>

            <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveRange("");
                }}
                className="mt-1 w-full rounded-md border-gray-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
              />
            </label>

            <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
              End date
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveRange("");
                }}
                className="mt-1 w-full rounded-md border-gray-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
              />
            </label>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  applyFilters({
                    clientId: selectedClientId,
                    start: startDate,
                    end: endDate,
                    range: "",
                  })
                }
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Generate Report
              </button>

              <button
                type="button"
                onClick={() => handleSendWhatsAppReport()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <FaWhatsapp className="w-4 h-4" />
                Send WhatsApp
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedClientId("");
                  setStartDate("");
                  setEndDate("");
                  setAppliedFilters({ clientId: "", start: "", end: "" });
                  setActiveRange("");
                }}
                className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg">
          <h3 className="text-sm font-semibold uppercase tracking-wide">Total Entries</h3>
          <p className="mt-2 text-3xl font-bold">{filteredEntries.length}</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg">
          <h3 className="text-sm font-semibold uppercase tracking-wide">Total Litres</h3>
          <p className="mt-2 text-3xl font-bold">{totalLitres.toFixed(2)} L</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 p-6 text-white shadow-lg">
          <h3 className="text-sm font-semibold uppercase tracking-wide">Total Amount</h3>
          <p className="mt-2 text-3xl font-bold">₹{totalAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white/80 dark:bg-gray-900/80 shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        {renderEntries()}
      </div>
    </MainLayout>
  );
}
