import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import CarDetail from "@/components/details/CarDetail";
import { getCarById } from "@/services/cars.service";
import { getLocations } from "@/services/locations.service";
import { getBranding } from "@/services/branding.service";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }): Promise<Metadata> {
  const { locale, idOrSlug } = await params;
  const car = await getCarById(idOrSlug);
  if (!car) return { title: "Car not found" };
  const branding = await getBranding();
  return buildMetadata({
    locale,
    path: `/cars/${car.slug || car.id}`,
    title: `${car.brand} ${car.name}`,
    image: car.image,
    siteName: branding.identity.siteName,
  });
}

export default async function CarPage({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }) {
  const { locale, idOrSlug } = await params;
  const [car, locations, branding] = await Promise.all([getCarById(idOrSlug), getLocations({ type: "CAR_BRANCH" }), getBranding()]);
  if (!car) notFound();

  if (car.slug && idOrSlug !== car.slug) {
    permanentRedirect(locale === "en" ? `/cars/${car.slug}` : `/${locale}/cars/${car.slug}`);
  }

  const canonicalPath = `/cars/${car.slug || car.id}`;
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: absoluteUrl("/") },
      { name: "Cars", url: absoluteUrl("/cars") },
      { name: `${car.brand} ${car.name}`, url: absoluteUrl(canonicalPath) },
    ]),
    productJsonLd({
      type: "Product",
      name: `${car.brand} ${car.name}`,
      url: absoluteUrl(canonicalPath),
      image: car.image,
      offer: car.pricePerDay ? { priceAmount: car.pricePerDay, priceCurrency: "EGP" } : undefined,
    }),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CarDetail car={car} locations={locations} whatsappNumber={branding.contactWhatsappNumber} />
    </>
  );
}
