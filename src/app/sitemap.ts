import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/metadata";
import { getTours } from "@/services/tours.service";
import { getHotels } from "@/services/hotels.service";
import { getCars } from "@/services/cars.service";
import { getPackages } from "@/services/packages.service";

type Sitemap = MetadataRoute.Sitemap;

const STATIC_PATHS = [
  "/",
  "/hotels",
  "/tours",
  "/cars",
  "/transfers",
  "/packages",
  "/about",
  "/contact",
  "/faq",
  "/help",
  "/careers",
  "/cancellation-policy",
  "/terms",
  "/privacy",
];

function languagesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = locale === routing.defaultLocale ? absoluteUrl(path) : absoluteUrl(`/${locale}${path === "/" ? "" : path}`);
  }
  return languages;
}

function entry(path: string): Sitemap[number] {
  return {
    url: absoluteUrl(path),
    alternates: { languages: languagesFor(path) },
  };
}

/**
 * Only public, canonical, indexable pages — never /admin, /checkout, /my-bookings, /profile,
 * /favorites, auth pages, or a non-published product. Product entries always use the slug form
 * (the id form still works when visited directly, but 308-redirects onto this canonical URL, so
 * it's deliberately never the one listed here).
 */
export default async function sitemap(): Promise<Sitemap> {
  const [tours, hotels, cars, packages] = await Promise.all([getTours(), getHotels(), getCars(), getPackages()]);

  const staticEntries = STATIC_PATHS.map(entry);
  const tourEntries = tours.filter((t) => t.slug).map((t) => entry(`/tours/${t.slug}`));
  const hotelEntries = hotels.filter((h) => h.slug).map((h) => entry(`/hotels/${h.slug}`));
  const carEntries = cars.filter((c) => c.slug).map((c) => entry(`/cars/${c.slug}`));
  const packageEntries = packages.filter((p) => p.slug).map((p) => entry(`/packages/${p.slug}`));

  return [...staticEntries, ...tourEntries, ...hotelEntries, ...carEntries, ...packageEntries];
}
