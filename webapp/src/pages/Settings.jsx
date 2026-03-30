import MainLayout from "../components/layout/MainLayout";
import { useState } from "react";
import { useToast } from "../context/ToastContext";
import { DEFAULT_REPORT_WHATSAPP_PHONE } from "../services/config";

export default function Settings() {
  const getStoredRate = (key, fallback) => {
    const value = parseFloat(localStorage.getItem(key));
    return Number.isNaN(value) ? fallback : value;
  };

  const getStoredBoolean = (key, fallback) => {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return value === "true";
  };

  const getStoredText = (key, fallback = "") => {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  };

  const [cowRate, setCowRate] = useState(() => getStoredRate("cowRate", 45));
  const [buffaloRate, setBuffaloRate] = useState(() => getStoredRate("buffaloRate", 55));
  const [autoOpenWhatsAppAfterSave, setAutoOpenWhatsAppAfterSave] = useState(() =>
    getStoredBoolean("autoOpenWhatsAppAfterSave", true)
  );
  const [dairyName, setDairyName] = useState(() => getStoredText("dairyName", "Dairy Manager Pro"));
  const [ownerName, setOwnerName] = useState(() => getStoredText("ownerName", ""));
  const [reportWhatsAppPhone, setReportWhatsAppPhone] = useState(() =>
    getStoredText("reportWhatsAppPhone", DEFAULT_REPORT_WHATSAPP_PHONE)
  );
  const { push } = useToast();

  const saveSettings = () => {
    localStorage.setItem("cowRate", cowRate);
    localStorage.setItem("buffaloRate", buffaloRate);
    localStorage.setItem("autoOpenWhatsAppAfterSave", String(autoOpenWhatsAppAfterSave));
    localStorage.setItem("dairyName", String(dairyName || "").trim() || "Dairy Manager Pro");
    localStorage.setItem("ownerName", String(ownerName || "").trim());
    localStorage.setItem("reportWhatsAppPhone", String(reportWhatsAppPhone || "").replace(/\D/g, ""));
    push("Settings saved", "success");
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure your dairy management preferences.</p>
      </div>

      <div className="max-w-md mx-auto px-3 space-y-6">
        <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔔 Notifications</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 dark:text-gray-200 font-medium">Email notifications</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-800 dark:text-gray-200 font-medium">Daily summary reports</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-800 dark:text-gray-200 font-medium">Auto-open WhatsApp after save</span>
              <input
                type="checkbox"
                className="rounded"
                checked={autoOpenWhatsAppAfterSave}
                onChange={(e) => setAutoOpenWhatsAppAfterSave(e.target.checked)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">💰 Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Default Cow Milk Rate (₹/L)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={cowRate}
                onChange={(e) => setCowRate(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Default Buffalo Milk Rate (₹/L)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={buffaloRate}
                onChange={(e) => setBuffaloRate(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">👤 Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Dairy Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Enter dairy name"
                value={dairyName}
                onChange={(e) => setDairyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Owner Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Enter owner name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Report WhatsApp Number (country code + number)
              </label>
              <input
                type="tel"
                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="e.g. 919999888877"
                value={reportWhatsAppPhone}
                onChange={(e) => setReportWhatsAppPhone(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-6 shadow-md dark:bg-gray-800/40">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Need help? Contact our support team</p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-md transition duration-300 hover:scale-105 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gavi Support Specialist</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Get help with dairy operations and usage</p>
              <button
                onClick={() => window.open("https://wa.me/918059172716", "_blank")}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Contact Support
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md transition duration-300 hover:scale-105 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin – Himanshu</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">For account issues or technical help</p>
              <button
                onClick={() => window.open("https://wa.me/918708195687", "_blank")}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Contact Admin
              </button>
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
