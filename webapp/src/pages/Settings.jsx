import MainLayout from "../components/layout/MainLayout";
import { useState } from "react";
import { useToast } from "../context/ToastContext";

export default function Settings() {
  const getStoredRate = (key, fallback) => {
    const value = parseFloat(localStorage.getItem(key));
    return Number.isNaN(value) ? fallback : value;
  };

  const [cowRate, setCowRate] = useState(() => getStoredRate("cowRate", 45));
  const [buffaloRate, setBuffaloRate] = useState(() => getStoredRate("buffaloRate", 55));
  const { push } = useToast();

  const saveSettings = () => {
    localStorage.setItem("cowRate", cowRate);
    localStorage.setItem("buffaloRate", buffaloRate);
    push("Settings saved", "success");
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your dairy management preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔔 Notifications</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Email notifications</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Daily summary reports</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">💰 Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Cow Milk Rate (₹/L)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={cowRate}
                onChange={(e) => setCowRate(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Buffalo Milk Rate (₹/L)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={buffaloRate}
                onChange={(e) => setBuffaloRate(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">👤 Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Farm Name
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter farm name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter owner name"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
