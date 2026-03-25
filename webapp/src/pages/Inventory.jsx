import React, { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import { getInventory, getTodayInventory, calculateTodayInventory } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const Inventory = () => {
  const { language } = useLanguage();
  const tr = (hi, en) => (language === "hi" ? hi : en);
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
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{tr("स्टॉक बढ़ा", "Stock In")}</span>;
    } else if (change < 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">{tr("स्टॉक घटा", "Stock Out")}</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{tr("कोई बदलाव नहीं", "No Change")}</span>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tr("दूध स्टॉक (इन्वेंटरी)", "Milk Inventory")}</h1>
          <button
            onClick={handleCalculateToday}
            disabled={calculating || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {calculating ? tr("गिनती हो रही है...", "Calculating...") : tr("आज का स्टॉक निकालें", "Calculate Today's Inventory")}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {todayInventory && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-5 rounded-xl shadow-md">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{tr("शुरुआती स्टॉक", "Opening Stock")}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayInventory.opening_stock?.toFixed(2)} L</p>
                </div>
                <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-5 rounded-xl shadow-md">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{tr("आज आया दूध", "Milk Received")}</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{todayInventory.milk_received?.toFixed(2)} L</p>
                </div>
                <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-5 rounded-xl shadow-md">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{tr("आज बिका दूध", "Milk Sold")}</h3>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{todayInventory.milk_sold?.toFixed(2)} L</p>
                </div>
                <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-5 rounded-xl shadow-md">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{tr("बचा हुआ स्टॉक", "Closing Stock")}</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{todayInventory.closing_stock?.toFixed(2)} L</p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{tr("पुराना स्टॉक रिकॉर्ड", "Inventory History")}</h2>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{tr("तारीख", "Date")}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{tr("शुरुआत", "Opening")} (L)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{tr("आया", "Received")} (L)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{tr("बिका", "Sold")} (L)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{tr("अंत", "Closing")} (L)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{tr("स्थिति", "Status")}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(item.date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{item.opening_stock?.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">+{item.milk_received?.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">-{item.milk_sold?.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.closing_stock?.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.opening_stock, item.closing_stock)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inventory.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {tr('कोई रिकॉर्ड नहीं मिला। पहले "आज का स्टॉक निकालें" दबाएं।', 'No inventory records found. Calculate today\'s inventory to get started.')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Inventory;