import MainLayout from "../components/layout/MainLayout";
import { useEffect, useState } from "react";
import { getClients } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";

export default function Reports() {
  const { language } = useLanguage();
  const tr = (hi, en) => (language === "hi" ? hi : en);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getClients();
        setClients(data);
      } catch {
        push(tr("रिपोर्ट डेटा लोड नहीं हुआ", "Failed to load report data"), "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [push]);

  const exportCSV = () => {
    const rows = ["Name,Phone,Joined", ...clients.map((c) => `${c.name},${c.phone},${new Date(c.createdAt).toLocaleString()}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    push(tr("रिपोर्ट डाउनलोड हो गई", "Exported clients_report.csv"), "success");
  };

  // Simple trend: clients over time (counts per month)
  const grouped = clients.reduce((acc, c) => {
    const key = new Date(c.createdAt).toISOString().slice(0,7); // YYYY-MM
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const labels = Object.keys(grouped).sort();
  const values = labels.map((l) => grouped[l]);

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tr("रिपोर्ट", "Reports")}</h1>
        <p className="text-gray-600 dark:text-gray-400">{tr("ग्राहक रिपोर्ट देखें और डाउनलोड करें।", "Export and view client/register reports.")}</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div></div>
        <button onClick={exportCSV} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{tr("CSV डाउनलोड करें", "Export CSV")}</button>
      </div>

      <div className="bg-white dark:bg-gray-900 dark:text-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{tr("महीने के हिसाब से नए ग्राहक", "Client Registrations (by month)")}</h2>
        {loading ? (
          <div className="text-gray-500 dark:text-gray-400">{tr("लोड हो रहा है...", "Loading...")}</div>
        ) : labels.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">{tr("कोई डेटा उपलब्ध नहीं है", "No data available")}</div>
        ) : (
          <div className="w-full">
            <svg viewBox={`0 0 ${labels.length*60} 120`} className="w-full h-36">
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3"
                points={values.map((v,i)=>`${i*60+10},${110 - (v/Math.max(...values))*80}`).join(" ")}
              />
              {values.map((v,i) => (
                <g key={i}>
                  <circle cx={i*60+10} cy={110 - (v/Math.max(...values))*80} r="4" fill="#4f46e5" />
                  <text x={i*60+10} y={112} fontSize="10" textAnchor="middle" fill="#374151">{labels[i].slice(5)}</text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>
    </MainLayout>
  );
}