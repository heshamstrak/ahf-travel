import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import TourDetail from "@/components/details/TourDetail";
import { getTourById } from "@/services/tours.service";
import { getBranding } from "@/services/branding.service";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }): Promise<Metadata> {
  const { locale, idOrSlug } = await params;
  const tour = await getTourById(idOrSlug);
  if (!tour) return { title: "Tour not found" };
  const branding = await getBranding();
  return buildMetadata({
    locale,
    path: `/tours/${tour.slug || tour.id}`,
    title: tour.title,
    description: tour.overview || undefined,
    image: tour.image,
    siteName: branding.identity.siteName,
  });
}

export default async function TourPage({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }) {
  const { locale, idOrSlug } = await params;
  const [tour, branding] = await Promise.all([getTourById(idOrSlug), getBranding()]);
  if (!tour) notFound();

  // Canonicalize onto the slug: old links by raw id keep working, but never get indexed twice.
  if (tour.slug && idOrSlug !== tour.slug) {
    permanentRedirect(locale === "en" ? `/tours/${tour.slug}` : `/${locale}/tours/${tour.slug}`);
  }

  const canonicalPath = `/tours/${tour.slug || tour.id}`;
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: absoluteUrl("/") },
      { name: "Tours", url: absoluteUrl("/tours") },
      { name: tour.title, url: absoluteUrl(canonicalPath) },
    ]),
    productJsonLd({
      type: "TouristTrip",
      name: tour.title,
      description: tour.overview || undefined,
      url: absoluteUrl(canonicalPath),
      image: tour.image,
      offer: tour.startingPrice ? { priceAmount: tour.startingPrice, priceCurrency: "EGP" } : undefined,
    }),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TourDetail tour={tour} whatsappNumber={branding.contactWhatsappNumber} />
    </>
  );
}
