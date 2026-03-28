import React, { useState, useEffect } from "react";
import { getInventory, getTodayInventory, calculateTodayInventory } from "../services/api";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [todayInventory, setTodayInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const [inventoryData, todayData] = await Promise.all([
        getInventory(),
        getTodayInventory(),
      ]);
      setInventory(inventoryData);
      setTodayInventory(todayData);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateToday = async () => {
    try {
      setCalculating(true);
      await calculateTodayInventory();
      await loadInventory();
    } catch (error) {
      console.error("Error calculating inventory:", error);
    } finally {
      setCalculating(false);
    }
  };

  const getStatusBadge = (openingStock, closingStock) => {
    const change = closingStock - openingStock;
    if (change > 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Stock In</span>;
    } else if (change < 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Stock Out</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">No Change</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Track and manage your dairy stock</p>
          </div>
          <button
            onClick={handleCalculateToday}
            disabled={calculating}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {calculating ? "Calculating..." : "Calculate Today's Inventory"}
          </button>
        </div>
      </div>

      {/* Today's Summary */}
      {todayInventory && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-xl bg-white p-6 text-black shadow-md transition-shadow hover:shadow-lg dark:bg-gray-900 dark:text-white">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Opening Stock</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayInventory.opening_stock?.toFixed(2)} L</p>
          </div>
          <div className="rounded-xl bg-white p-6 text-black shadow-md transition-shadow hover:shadow-lg dark:bg-gray-900 dark:text-white">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Milk Received</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{todayInventory.milk_received?.toFixed(2)} L</p>
          </div>
          <div className="rounded-xl bg-white p-6 text-black shadow-md transition-shadow hover:shadow-lg dark:bg-gray-900 dark:text-white">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Milk Sold</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{todayInventory.milk_sold?.toFixed(2)} L</p>
          </div>
          <div className="rounded-xl bg-white p-6 text-black shadow-md transition-shadow hover:shadow-lg dark:bg-gray-900 dark:text-white">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Closing Stock</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{todayInventory.closing_stock?.toFixed(2)} L</p>
          </div>
        </div>
      )}

      {/* Inventory History */}
      <div className="overflow-hidden rounded-xl bg-white text-black shadow-md transition-shadow hover:shadow-lg dark:bg-gray-900 dark:text-white">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory History</h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Opening Stock (L)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Milk Received (L)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Milk Sold (L)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Closing Stock (L)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {inventory.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {item.opening_stock?.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-green-600 dark:text-green-400">
                    +{item.milk_received?.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-red-600 dark:text-red-400">
                    -{item.milk_sold?.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {item.closing_stock?.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(item.opening_stock, item.closing_stock)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inventory.length === 0 && (
          <div className="py-10 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            No inventory data yet
          </div>
        )}
      </div>

      {/* Inventory Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Stock Movement</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Average Daily Receipt</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {inventory.length > 0
                  ? (inventory.reduce((sum, item) => sum + item.milk_received, 0) / inventory.length).toFixed(2)
                  : "0.00"
                } L
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Average Daily Sales</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {inventory.length > 0
                  ? (inventory.reduce((sum, item) => sum + item.milk_sold, 0) / inventory.length).toFixed(2)
                  : "0.00"
                } L
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Current Stock Level</span>
              <span className="text-sm font-medium text-blue-600">
                {todayInventory?.closing_stock?.toFixed(2) || "0.00"} L
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Stock Alerts</h3>
          <div className="space-y-3">
            {todayInventory && todayInventory.closing_stock < 10 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">Low stock alert! Current stock is below 10 liters.</p>
                  </div>
                </div>
              </div>
            )}
            {todayInventory && todayInventory.milk_sold > todayInventory.milk_received && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">More milk sold than received today. Monitor stock levels.</p>
                  </div>
                </div>
              </div>
            )}
            {(!todayInventory || inventory.length === 0) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">Click "Calculate Today's Inventory" to see current stock levels.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;