import MainLayout from "../components/layout/MainLayout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getClients, getMilkEntries, getPayments, getConsumerSales } from "../services/api";
import { DEFAULT_REPORT_WHATSAPP_PHONE } from "../services/config";
import { useToast } from "../context/ToastContext";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import AppButton from "../components/common/AppButton";

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getSaleAmount = (sale) => {
  const explicitAmount = toNumber(sale?.totalAmount ?? sale?.total_amount ?? sale?.amount);
  if (explicitAmount > 0) return explicitAmount;
  return toNumber(sale?.litres) * toNumber(sale?.rate);
};

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState({
    clients: [],
    milkEntries: [],
    payments: [],
    consumerSales: [],
  });

  const hasLoadedRef = useRef(false);
  const { push } = useToast();

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [clients, milkEntries, payments, consumerSales] = await Promise.all([
        getClients(),
        getMilkEntries(),
        getPayments(),
        getConsumerSales(),
      ]);

      setReportData({ clients, milkEntries, payments, consumerSales });
    } catch (loadError) {
      setError(loadError?.message || "Failed to load report data");
      push("Failed to load report data", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadReportData();
  }, [loadReportData]);

  const summary = useMemo(() => {
    const totalMilk = reportData.milkEntries.reduce((sum, entry) => sum + toNumber(entry?.litres), 0);
    const totalSales = reportData.consumerSales.reduce((sum, sale) => sum + getSaleAmount(sale), 0);
    const totalPayments = reportData.payments.reduce((sum, payment) => sum + toNumber(payment?.amount), 0);
    const remainingBalance = totalSales - totalPayments;

    return {
      totalMilk,
      totalSales,
      totalPayments,
      remainingBalance,
    };
  }, [reportData]);

  const reportRows = useMemo(
    () =>
      reportData.clients.map((client) => {
        const clientMilk = reportData.milkEntries
          .filter((entry) => String(entry?.clientId) === String(client.id))
          .reduce((sum, entry) => sum + toNumber(entry?.litres), 0);

        const clientPayments = reportData.payments
          .filter((payment) => String(payment?.clientId) === String(client.id))
          .reduce((sum, payment) => sum + toNumber(payment?.amount), 0);

        return {
          id: client.id,
          name: client.name,
          phone: client.phone,
          milk: `${clientMilk.toFixed(1)} L`,
          payments: `₹${clientPayments.toFixed(0)}`,
        };
      }),
    [reportData]
  );

  const reportColumns = [
    { key: "name", label: "Client" },
    { key: "phone", label: "Phone" },
    { key: "milk", label: "Total Milk" },
    { key: "payments", label: "Total Payments" },
  ];

  const exportCSV = () => {
    const rows = [
      "Client,Phone,Total Milk (L),Total Payments",
      ...reportRows.map((row) => `${row.name},${row.phone},${row.milk.replace(" L", "")},${row.payments.replace("₹", "")}`),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reports.csv";
    a.click();
    URL.revokeObjectURL(url);
    push("Exported reports.csv", "success");
  };

  const sendReportToWhatsApp = () => {
    const configuredPhone = String(localStorage.getItem("reportWhatsAppPhone") || DEFAULT_REPORT_WHATSAPP_PHONE || "").replace(/\D/g, "");

    if (!configuredPhone) {
      push("Add report WhatsApp number in Settings first", "error");
      return;
    }

    const reportText = [
      "Milk Report:",
      `Total Milk: ${summary.totalMilk.toFixed(1)} L`,
      `Sold: ₹${summary.totalSales.toFixed(0)}`,
      `Remaining: ₹${summary.remainingBalance.toFixed(0)}`,
      `Revenue: ₹${summary.totalSales.toFixed(0)}`,
    ].join("\n");

    const url = `https://wa.me/${configuredPhone}?text=${encodeURIComponent(reportText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports</h1>
            <p className="text-slate-600 dark:text-slate-300">Operational summary and export-ready numbers.</p>
          </div>
          <div className="flex items-center gap-2">
            <AppButton variant="ghost" onClick={loadReportData}>Refresh</AppButton>
            <AppButton onClick={exportCSV}>Export CSV</AppButton>
            <AppButton variant="success" onClick={sendReportToWhatsApp}>Send Report to WhatsApp</AppButton>
          </div>
        </div>

        {loading ? <LoadingState message="Loading reports..." /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={loadReportData} /> : null}

        {!loading && !error ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Milk" value={`${summary.totalMilk.toFixed(1)} L`} tone="info" />
              <StatCard title="Total Sales" value={`₹${summary.totalSales.toFixed(0)}`} tone="success" />
              <StatCard title="Total Payments" value={`₹${summary.totalPayments.toFixed(0)}`} tone="warning" />
              <StatCard title="Remaining Balance" value={`₹${summary.remainingBalance.toFixed(0)}`} tone={summary.remainingBalance >= 0 ? "danger" : "success"} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Client Report Table</h2>
              <DataTable columns={reportColumns} rows={reportRows} emptyMessage="No report data available" />
            </div>
          </>
        ) : null}
      </div>
    </MainLayout>
  );
}
