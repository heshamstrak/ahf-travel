import { absoluteUrl } from "./metadata";

/** Structured-data builders. Every field here comes from real backend data — never invent a
 *  price, availability, "official seller" status, partnership, or review/rating: this stack has
 *  no real review system (src/data/reviews.ts is static mock data), so no builder here ever emits
 *  AggregateRating or Review nodes. */

export function organizationJsonLd(siteName: string, logoUrl: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: absoluteUrl("/"),
    ...(logoUrl ? { logo: logoUrl } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface OfferInput {
  priceAmount: number;
  priceCurrency: string;
}

interface ProductJsonLdInput {
  type: "TouristTrip" | "LodgingBusiness" | "Product";
  name: string;
  description?: string;
  url: string;
  image?: string;
  /** Omit entirely for CONTACT_FOR_PRICE products — never surface a price that isn't bookable. */
  offer?: OfferInput;
}

export function productJsonLd({ type, name, description, url, image, offer }: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name,
    ...(description ? { description } : {}),
    url,
    ...(image ? { image } : {}),
    ...(offer
      ? {
          offers: {
            "@type": "Offer",
            price: offer.priceAmount,
            priceCurrency: offer.priceCurrency,
            availability: "https://schema.org/InStock",
            url,
          },
        }
      : {}),
  };
}
