import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import HotelsListing from "@/components/listing/HotelsListing";
import { ListingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getHotels } from "@/services/hotels.service";
import { getDestinations } from "@/services/destinations.service";

export const metadata: Metadata = { title: "Hotels in Egypt" };

export default async function HotelsPage() {
  const [hotels, destinations] = await Promise.all([getHotels(), getDestinations()]);

  return (
    <>
      <PageHeader
        title="Hotels in Egypt"
        subtitle="From Nile-view palaces to Red Sea resorts. Compare rates and book in a few clicks."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Hotels" }]}
      />
      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<ListingSkeleton />}>
          <HotelsListing hotels={hotels} destinations={destinations} />
        </Suspense>
      </div>
    </>
  );
}
