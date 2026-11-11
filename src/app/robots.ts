import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/metadata";

const PRIVATE_PATHS = [
  "/admin",
  "/checkout",
  "/my-bookings",
  "/profile",
  "/favorites",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/booking/success",
];

// Disallow both the unprefixed (default locale) and locale-prefixed form of every private path,
// since next-intl's "as-needed" prefixing means /checkout and /ar/checkout are the same page.
const disallow = PRIVATE_PATHS.flatMap((path) => [
  path,
  `${path}/`,
  ...routing.locales.filter((l) => l !== routing.defaultLocale).map((l) => `/${l}${path}`),
]);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
