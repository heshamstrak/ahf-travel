import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import CarsListing from "@/components/listing/CarsListing";
import { ListingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getCars } from "@/services/cars.service";

export const metadata: Metadata = { title: "Car Rentals" };

export default async function CarsPage() {
  const cars = await getCars();

  return (
    <>
      <PageHeader
        title="Car Rentals"
        subtitle="Economy to premium, collected at airports, city branches or your hotel."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cars" }]}
      />
      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<ListingSkeleton />}>
          <CarsListing cars={cars} />
        </Suspense>
      </div>
    </>
  );
}
