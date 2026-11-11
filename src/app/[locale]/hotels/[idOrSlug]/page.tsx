import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import HotelDetail from "@/components/details/HotelDetail";
import { getHotelById, getRoomsForHotel } from "@/services/hotels.service";
import { getBranding } from "@/services/branding.service";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }): Promise<Metadata> {
  const { locale, idOrSlug } = await params;
  const hotel = await getHotelById(idOrSlug);
  if (!hotel) return { title: "Hotel not found" };
  const branding = await getBranding();
  return buildMetadata({
    locale,
    path: `/hotels/${hotel.slug || hotel.id}`,
    title: hotel.name,
    description: hotel.description || undefined,
    image: hotel.image,
    siteName: branding.identity.siteName,
  });
}

export default async function HotelPage({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }) {
  const { locale, idOrSlug } = await params;
  const hotel = await getHotelById(idOrSlug);
  if (!hotel) notFound();
  // Rooms are a nested resource keyed by the hotel's real id, not its slug — resolve the hotel
  // first (above), then always fetch rooms by hotel.id regardless of which form the URL used.
  const rooms = await getRoomsForHotel(hotel.id);

  if (hotel.slug && idOrSlug !== hotel.slug) {
    permanentRedirect(locale === "en" ? `/hotels/${hotel.slug}` : `/${locale}/hotels/${hotel.slug}`);
  }

  const canonicalPath = `/hotels/${hotel.slug || hotel.id}`;
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: absoluteUrl("/") },
      { name: "Hotels", url: absoluteUrl("/hotels") },
      { name: hotel.name, url: absoluteUrl(canonicalPath) },
    ]),
    productJsonLd({
      type: "LodgingBusiness",
      name: hotel.name,
      description: hotel.description || undefined,
      url: absoluteUrl(canonicalPath),
      image: hotel.image,
      offer: hotel.priceAvailable && hotel.pricePerNight > 0 ? { priceAmount: hotel.pricePerNight, priceCurrency: "EGP" } : undefined,
    }),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-8xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Hotels", href: "/hotels" }, { label: hotel.name }]} />
        </div>
        <HotelDetail hotel={hotel} rooms={rooms} />
      </div>
    </>
  );
}
