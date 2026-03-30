export default function StatCard({ title, value, subtitle, tone = "neutral", className = "" }) {
  const toneClasses = {
    neutral: "from-slate-50 to-white border-slate-200",
    success: "from-emerald-50 to-white border-emerald-200",
    warning: "from-amber-50 to-white border-amber-200",
    danger: "from-rose-50 to-white border-rose-200",
    info: "from-sky-50 to-white border-sky-200",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition hover:shadow-md ${toneClasses[tone] || toneClasses.neutral} ${className}`}
    >
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}