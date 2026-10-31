import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import PackageDetail from "@/components/details/PackageDetail";
import { getPackageById } from "@/services/packages.service";
import { getBranding } from "@/services/branding.service";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }): Promise<Metadata> {
  const { locale, idOrSlug } = await params;
  const pkg = await getPackageById(idOrSlug);
  if (!pkg) return { title: "Package not found" };
  const branding = await getBranding();
  return buildMetadata({
    locale,
    path: `/packages/${pkg.slug || pkg.id}`,
    title: pkg.title,
    description: pkg.overview || undefined,
    image: pkg.image,
    siteName: branding.identity.siteName,
  });
}

export default async function PackagePage({ params }: { params: Promise<{ locale: string; idOrSlug: string }> }) {
  const { locale, idOrSlug } = await params;
  const [pkg, branding] = await Promise.all([getPackageById(idOrSlug), getBranding()]);
  if (!pkg) notFound();

  if (pkg.slug && idOrSlug !== pkg.slug) {
    permanentRedirect(locale === "en" ? `/packages/${pkg.slug}` : `/${locale}/packages/${pkg.slug}`);
  }

  const canonicalPath = `/packages/${pkg.slug || pkg.id}`;
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: absoluteUrl("/") },
      { name: "Packages", url: absoluteUrl("/packages") },
      { name: pkg.title, url: absoluteUrl(canonicalPath) },
    ]),
    productJsonLd({
      type: "Product",
      name: pkg.title,
      description: pkg.overview || undefined,
      url: absoluteUrl(canonicalPath),
      image: pkg.image,
      offer: pkg.startingPrice ? { priceAmount: pkg.startingPrice, priceCurrency: "EGP" } : undefined,
    }),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PackageDetail pkg={pkg} whatsappNumber={branding.contactWhatsappNumber} />
    </>
  );
}
