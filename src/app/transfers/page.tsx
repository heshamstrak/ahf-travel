import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import TransfersBooking from "@/components/transfers/TransfersBooking";
import { getLocations } from "@/services/transfers.service";

export const metadata: Metadata = { title: "Airport Transfers" };

export default async function TransfersPage() {
  const locations = await getLocations();

  return (
    <>
      <PageHeader
        title="Airport & Private Transfers"
        subtitle="Fixed prices, professional drivers and flight tracking. Choose your route and vehicle."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Transfers" }]}
      />
      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <TransfersBooking locations={locations} />
        </Suspense>
      </div>
    </>
  );
}
