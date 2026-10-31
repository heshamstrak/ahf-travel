"use client";

import { ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useApp } from "@/context/AppProvider";
import { CURRENCIES, CURRENCY_LABELS } from "@/lib/currency";
import { CurrencyCode } from "@/data/types";
import type { AppLocale } from "@/i18n/routing";

const LANGUAGES: { code: AppLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

/* Compact currency + language picker used in the navbar and mobile menu. Language switching
 * navigates to the same page in the other locale (real URL change, not a client-only toggle) so
 * every page stays crawlable per-language rather than silently re-rendering in place. */
export default function SettingsMenu({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { currency, setCurrency } = useApp();
  const t = useTranslations("settings");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("currencyLanguage")}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/10 ${textClass}`}
      >
        <Globe size={15} />
        <span>{currency}</span>
        <span aria-hidden className="text-xs opacity-70">·</span>
        <span>{locale === "en" ? "EN" : "AR"}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div role="menu" className="absolute end-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-3 text-slate-900 shadow-xl">
          <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("currency")}</p>
          <div className="space-y-0.5">
            {CURRENCIES.map((c: CurrencyCode) => (
              <button
                key={c}
                type="button"
                role="menuitemradio"
                aria-checked={currency === c}
                onClick={() => setCurrency(c)}
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

          <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("language")}</p>
          <div className="space-y-0.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="menuitemradio"
                aria-checked={locale === l.code}
                onClick={() => {
                  setOpen(false);
                  router.replace(pathname, { locale: l.code });
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-sand-50 ${
                  locale === l.code ? "font-semibold text-brand-700" : "text-slate-700"
                }`}
              >
                <span>{l.label}</span>
                {locale === l.code ? <span aria-hidden>✓</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
