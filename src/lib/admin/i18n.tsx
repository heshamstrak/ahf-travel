"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo } from "react";
import { usePersistentState } from "@/lib/persistent";
import adminEn from "@/messages/admin-en.json";
import adminAr from "@/messages/admin-ar.json";

export type AdminLocale = "en" | "ar";

const DICTIONARIES: Record<AdminLocale, Record<string, unknown>> = { en: adminEn, ar: adminAr };
const LOCALE_KEY = "eb_admin_locale";

function lookup(dict: Record<string, unknown>, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((node, key) => (typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined), dict);
  return typeof value === "string" ? value : undefined;
}

interface AdminI18nValue {
  locale: AdminLocale;
  dir: "ltr" | "rtl";
  setLocale: (l: AdminLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const AdminI18nContext = createContext<AdminI18nValue | null>(null);

/** Admin's own, non-URL-routed locale toggle — admin stays outside next-intl's [locale] segment
 *  (it's never crawled/indexed, so there's no SEO reason to prefix its URLs), but still needs a
 *  real EN/AR + LTR/RTL switch for staff who prefer Arabic. */
export function AdminI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = usePersistentState<AdminLocale>(LOCALE_KEY, "en");
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES.en, key) ?? key;
      if (!vars) return raw;
      return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), raw);
    },
    [locale]
  );

  const value = useMemo<AdminI18nValue>(() => ({ locale, dir, setLocale, t }), [locale, dir, setLocale, t]);

  return <AdminI18nContext.Provider value={value}>{children}</AdminI18nContext.Provider>;
}

export function useAdminI18n(): AdminI18nValue {
  const ctx = useContext(AdminI18nContext);
  if (!ctx) throw new Error("useAdminI18n must be used inside AdminI18nProvider");
  return ctx;
}
