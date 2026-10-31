import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

/** Canonical + hreflang alternates for a page at `pathWithoutLocale` (e.g. "/tours/giza-day-trip",
 *  or "/" for the home page) in the given locale. Matches next-intl's "as-needed" prefix scheme:
 *  the default locale (en) is never prefixed, every other locale is. */
export function localizedAlternates(locale: string, pathWithoutLocale: string): { canonical: string; languages: Record<string, string> } {
  const path = pathWithoutLocale === "/" ? "" : pathWithoutLocale;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = l === routing.defaultLocale ? absoluteUrl(path || "/") : absoluteUrl(`/${l}${path}` || "/");
  }
  languages["x-default"] = absoluteUrl(path || "/");
  const canonical = locale === routing.defaultLocale ? absoluteUrl(path || "/") : absoluteUrl(`/${locale}${path}`);
  return { canonical, languages };
}

export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
  siteName,
  noIndex,
}: {
  locale: string;
  path: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  noIndex?: boolean;
}): Metadata {
  const { canonical, languages } = localizedAlternates(locale, path);
  return {
    title,
    description,
    alternates: { canonical, languages },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      type: "website",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
