import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import ConferenceEventDetail from "@/components/details/ConferenceEventDetail";
import { getConferenceEventById } from "@/services/conference-events.service";
import { getBranding } from "@/services/branding.service";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }): Promise<Metadata> {
  const { locale, idOrSlug } = await params;
  const item = await getConferenceEventById(idOrSlug);
  if (!item) return { title: "Not found" };
  const branding = await getBranding();
  return buildMetadata({
    locale,
    path: `/conferences-events/${item.slug || item.id}`,
    title: item.name,
    description: item.description || undefined,
    image: item.image,
    siteName: branding.identity.siteName,
  });
}

export default async function ConferenceEventPage({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }) {
  const { locale, idOrSlug } = await params;
  const [item, branding] = await Promise.all([getConferenceEventById(idOrSlug), getBranding()]);
  if (!item) notFound();

  if (item.slug && idOrSlug !== item.slug) {
    permanentRedirect(locale === "en" ? `/conferences-events/${item.slug}` : `/${locale}/conferences-events/${item.slug}`);
  }

  const canonicalPath = `/conferences-events/${item.slug || item.id}`;
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: absoluteUrl("/") },
      { name: "Conferences & Events", url: absoluteUrl("/conferences-events") },
      { name: item.name, url: absoluteUrl(canonicalPath) },
    ]),
    productJsonLd({
      type: "Product",
      name: item.name,
      description: item.description || undefined,
      url: absoluteUrl(canonicalPath),
      image: item.image,
      offer: item.startingPrice ? { priceAmount: item.startingPrice, priceCurrency: "EGP" } : undefined,
    }),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ConferenceEventDetail item={item} whatsappNumber={branding.contactWhatsappNumber} />
    </>
  );
}
