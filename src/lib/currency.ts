import { CurrencyCode } from "@/data/types";

/* Mock rates. Replace with a live FX source later; everything else reads through here. */
export const BASE_CURRENCY: CurrencyCode = "EGP";

export const CURRENCY_RATES: Record<CurrencyCode, number> = {
  EGP: 1,
  USD: 1 / 50,
  EUR: 1 / 54,
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  EGP: "Egyptian Pound",
  USD: "US Dollar",
  EUR: "Euro",
};

export const CURRENCIES = Object.keys(CURRENCY_RATES) as CurrencyCode[];

export function convertFromEGP(amountEGP: number, currency: CurrencyCode): number {
  return amountEGP * CURRENCY_RATES[currency];
}

export function formatMoney(amountEGP: number, currency: CurrencyCode): string {
  const value = convertFromEGP(amountEGP, currency);
  const digits = currency === "EGP" ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
  return value === "EGP" || value === "USD" || value === "EUR";
}

/** Formats a real, backend-supplied amount in its OWN currency — no conversion applied. Used for
 *  quote/booking totals, which are always authoritative and must never be run through the fake
 *  display-currency conversion above. */
export function formatExact(amount: number | string, currency: string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  const digits = currency === "EGP" ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${value.toFixed(digits)} ${currency}`;
  }
}
