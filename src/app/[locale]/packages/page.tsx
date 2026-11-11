import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import PackagesListing from "@/components/listing/PackagesListing";
import { ListingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getPackages } from "@/services/packages.service";
import { getDestinations } from "@/services/destinations.service";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/packages",
    title: "Egypt Travel Packages",
    description: "Multi-day Egypt travel packages bundling hotels, tours and transfers into one itinerary, from budget to luxury.",
  });
}

export default async function PackagesPage() {
  const [packages, destinations] = await Promise.all([getPackages(), getDestinations()]);

  return (
    <>
      <PageHeader
        title="Travel Packages"
        subtitle="Hotels, tours and transfers bundled into one itinerary, so planning takes minutes instead of days."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Packages" }]}
      />
      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<ListingSkeleton />}>
          <PackagesListing packages={packages} destinations={destinations} />
        </Suspense>
      </div>
    </>
  );
}
