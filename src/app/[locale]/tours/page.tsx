import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import ToursListing from "@/components/listing/ToursListing";
import { ListingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getTours } from "@/services/tours.service";
import { getDestinations } from "@/services/destinations.service";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/tours",
    title: "Tours & Activities in Egypt",
    description: "Book Egypt tours and excursions, including Grand Egyptian Museum and Pyramids of Giza tours, Nile cruises and day trips, led by licensed local guides.",
  });
}

export default async function ToursPage() {
  const [tours, destinations] = await Promise.all([getTours(), getDestinations()]);

  return (
    <>
      <PageHeader
        title="Tours & Experiences"
        subtitle="Pyramids at sunrise, temples of Luxor, Red Sea reefs and Nile evenings, with licensed local guides."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Tours" }]}
      />
      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<ListingSkeleton />}>
          <ToursListing tours={tours} destinations={destinations} />
        </Suspense>
      </div>
    </>
  );
}
