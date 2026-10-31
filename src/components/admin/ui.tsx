"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Inbox, Plus, X } from "lucide-react";
import { useAdminI18n } from "@/lib/admin/i18n";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-700",
    info: "bg-brand-100 text-brand-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  ARCHIVED: "danger",
  OPEN: "success",
  CLOSED: "neutral",
  CANCELLED: "danger",
  PENDING_PAYMENT: "warning",
  CONFIRMED: "success",
  COMPLETED: "info",
  EXPIRED: "neutral",
  PENDING: "warning",
  PENDING_VERIFICATION: "warning",
  SUCCEEDED: "success",
  REJECTED: "danger",
  FAILED: "danger",
  PAID: "success",
  UNPAID: "neutral",
  PAY_LATER: "warning",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status.replace(/_/g, " ")}</Badge>;
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useAdminI18n();
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">{label ?? t("common.loading")}</span>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-slate-500">
      <Inbox size={28} className="text-slate-300" />
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-10 text-center text-red-700">
      <AlertTriangle size={24} />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  const { t } = useAdminI18n();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40">
        {t("common.previous")}
      </button>
      <span className="text-sm text-slate-500">{t("common.pageOf", { page, totalPages })}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40">
        {t("common.next")}
      </button>
    </div>
  );
}

export function ConfirmButton({
  label,
  confirmLabel,
  tone = "danger",
  onConfirm,
  className = "",
}: {
  label: React.ReactNode;
  confirmLabel: string;
  tone?: "danger" | "neutral";
  onConfirm: () => void | Promise<void>;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">{confirmLabel}</span>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
              setConfirming(false);
            }
          }}
          className="rounded-md bg-red-600 px-2 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? "…" : "Confirm"}
        </button>
        <button onClick={() => setConfirming(false)} className="rounded-md border border-slate-200 px-2 py-1 font-medium text-slate-600">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={
        className ||
        `rounded-md px-3 py-1.5 text-sm font-medium ${tone === "danger" ? "text-red-600 hover:bg-red-50" : "text-slate-600 hover:bg-slate-100"}`
      }
    >
      {label}
    </button>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function PrimaryButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/** Editable list of short strings (amenities, features, highlights, included/excluded items…) shown
 *  as removable chips with an add box — the common shape behind most catalogue "list" fields. */
export function TagListInput({ values, onChange, placeholder }: { values: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1.5 text-xs text-slate-700">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="rounded-full p-0.5 hover:bg-slate-200" aria-label={`Remove ${v}`}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Type and press Enter…"}
          className={inputClass}
        />
        <button type="button" onClick={add} className="shrink-0 rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50" aria-label="Add">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
