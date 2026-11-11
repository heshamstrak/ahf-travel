"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useApp } from "@/context/AppProvider";
import { CURRENCIES, CURRENCY_LABELS } from "@/lib/currency";
import { CurrencyCode } from "@/data/types";

/* Currency picker used in the navbar and mobile menu. Language switching lives on the Profile
 * page instead (a real URL change there, not a client-only toggle) — removed from the public
 * header per the redesign, but next-intl routing/messages are untouched. */
export default function SettingsMenu({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { currency, setCurrency } = useApp();
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const textClass = tone === "dark" ? "text-slate-700" : "text-white/90";
  const hoverClass = tone === "dark" ? "hover:bg-slate-100" : "hover:bg-white/10";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("currency")}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${hoverClass} ${textClass}`}
      >
        <span>{currency}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div role="menu" className="absolute end-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-3 text-slate-900 shadow-xl">
          <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("currency")}</p>
          <div className="space-y-0.5">
            {CURRENCIES.map((c: CurrencyCode) => (
              <button
                key={c}
                type="button"
                role="menuitemradio"
                aria-checked={currency === c}
                onClick={() => {
                  setCurrency(c);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-sand-50 ${
                  currency === c ? "font-semibold text-brand-700" : "text-slate-700"
                }`}
              >
                <span>
                  {c} <span className="text-xs text-slate-500">· {CURRENCY_LABELS[c]}</span>
                </span>
                {currency === c ? <span aria-hidden>✓</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
