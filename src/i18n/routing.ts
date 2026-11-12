import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Always serve English unless the visitor explicitly switches (via the Profile page's language
  // picker or a /ar URL) — without this, next-intl's middleware auto-redirects a first-time
  // visitor to /ar purely from their browser's Accept-Language header, overriding defaultLocale.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
