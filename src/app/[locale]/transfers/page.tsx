import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import TransfersBooking from "@/components/transfers/TransfersBooking";
import { getLocations } from "@/services/transfers.service";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/transfers",
    title: "Airport & Private Transfers in Egypt",
    description: "Book a private airport transfer or point-to-point transfer in Egypt, with fixed prices by vehicle class and route.",
  });
}

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
