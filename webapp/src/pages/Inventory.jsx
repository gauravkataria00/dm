import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import {
  getInventory,
  getTodayInventory,
  calculateTodayInventory,
  getMilkEntries,
  getPayments,
  getSettlements,
} from "../services/api";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import AppButton from "../components/common/AppButton";

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getStockTone = (value) => {
  if (value <= 10) return "danger";
  if (value <= 30) return "warning";
  return "success";
};

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [todayInventory, setTodayInventory] = useState(null);
  const [milkEntries, setMilkEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [inventoryData, todayData, milkEntriesData, paymentsData, settlementsData] = await Promise.all([
        getInventory(),
        getTodayInventory(),
        getMilkEntries(),
        getPayments(),
        getSettlements(),
      ]);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setTodayInventory(todayData || null);
      setMilkEntries(Array.isArray(milkEntriesData) ? milkEntriesData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setSettlements(Array.isArray(settlementsData) ? settlementsData : []);
    } catch (loadError) {
      setError(loadError?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadInventory();
  }, [loadInventory]);

  const handleCalculateToday = async () => {
    try {
      setCalculating(true);
      await calculateTodayInventory();
      await loadInventory();
    } catch (calculateError) {
      setError(calculateError?.message || "Failed to calculate inventory");
    } finally {
      setCalculating(false);
    }
  };

  const summary = useMemo(() => {
    const totalStock = toNumber(todayInventory?.opening_stock) + toNumber(todayInventory?.milk_received);
    const addedToday = toNumber(todayInventory?.milk_received);
    const usedToday = toNumber(todayInventory?.milk_sold);
    const remaining = toNumber(todayInventory?.closing_stock);

    return { totalStock, addedToday, usedToday, remaining };
  }, [todayInventory]);

  const overviewCards = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayMilkEntries = milkEntries.filter((entry) =>
      String(entry?.createdAt || "").startsWith(today)
    );

    const totalMilk = todayMilkEntries.reduce((sum, entry) => sum + toNumber(entry?.litres), 0);
    const revenue = todayMilkEntries.reduce(
      (sum, entry) => sum + toNumber(entry?.litres) * toNumber(entry?.rate),
      0
    );
    const pendingPayments = settlements.filter((item) => item?.status === "pending").length;
    const currentInventory = toNumber(todayInventory?.closing_stock);

    return { totalMilk, revenue, pendingPayments, currentInventory };
  }, [milkEntries, settlements, todayInventory]);

  const tableColumns = [
    {
      key: "date",
      label: "Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "opening_stock",
      label: "Opening",
      render: (value) => `${toNumber(value).toFixed(2)} L`,
    },
    {
      key: "milk_received",
      label: "Added",
      render: (value) => <span className="font-semibold text-emerald-700">+{toNumber(value).toFixed(2)} L</span>,
    },
    {
      key: "milk_sold",
      label: "Used",
      render: (value) => <span className="font-semibold text-amber-700">-{toNumber(value).toFixed(2)} L</span>,
    },
    {
      key: "closing_stock",
      label: "Remaining",
      render: (value) => {
        const numericValue = toNumber(value);
        const color = numericValue <= 10 ? "text-rose-700" : numericValue <= 30 ? "text-amber-700" : "text-emerald-700";
        return <span className={`font-bold ${color}`}>{numericValue.toFixed(2)} L</span>;
      },
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory</h1>
            <p className="text-slate-600 dark:text-slate-300">Daily stock position and movement table.</p>
          </div>
          <AppButton onClick={handleCalculateToday} disabled={calculating}>
            {calculating ? "Calculating..." : "Calculate Today's Inventory"}
          </AppButton>
        </div>

        {loading ? <LoadingState message="Loading inventory..." /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={loadInventory} /> : null}

        {!loading && !error ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Milk" value={`${overviewCards.totalMilk.toFixed(1)} L`} subtitle="Today" tone="info" />
              <StatCard title="Revenue" value={`₹${overviewCards.revenue.toFixed(0)}`} subtitle="Today" tone="success" />
              <StatCard title="Pending Payments" value={overviewCards.pendingPayments} subtitle="Open settlements" tone="warning" />
              <StatCard title="Inventory" value={`${overviewCards.currentInventory.toFixed(1)} L`} subtitle="Current stock" tone={overviewCards.currentInventory <= 30 ? "danger" : "success"} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Stock" value={`${summary.totalStock.toFixed(2)} L`} tone="info" />
              <StatCard title="Added Today" value={`${summary.addedToday.toFixed(2)} L`} tone="success" />
              <StatCard title="Used Today" value={`${summary.usedToday.toFixed(2)} L`} tone="warning" />
              <StatCard
                title="Remaining"
                value={`${summary.remaining.toFixed(2)} L`}
                subtitle={
                  summary.remaining <= 10
                    ? "Critical"
                    : summary.remaining <= 30
                      ? "Low"
                      : "Good"
                }
                tone={getStockTone(summary.remaining)}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Inventory History</h2>
              <DataTable columns={tableColumns} rows={inventory} emptyMessage="No inventory data yet" />
            </div>
          </>
        ) : null}
      </div>
    </MainLayout>
  );
}
