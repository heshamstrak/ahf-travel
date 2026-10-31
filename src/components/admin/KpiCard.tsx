import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number | string }>;
  /** Positive shows green/up, negative shows red/down, omitted hides the trend row entirely. */
  trend?: number;
  trendLabel?: string;
}

/** Dashboard stat card (UBold CRM "Deals" style): icon chip, big value, optional trend line. */
export default function KpiCard({ label, value, icon: Icon, trend, trendLabel }: KpiCardProps) {
  const hasTrend = typeof trend === "number";
  const up = hasTrend && trend >= 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon size={18} />
        </span>
      </div>
      {hasTrend ? (
        <p className={`mt-3 flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-600" : "text-red-600"}`}>
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend).toFixed(1)}%{trendLabel ? <span className="font-normal text-slate-400"> {trendLabel}</span> : null}
        </p>
      ) : null}
    </div>
  );
}
