import { TravelPackage } from "@/data/types";
import PackageCard from "@/components/cards/PackageCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";
import Carousel from "@/components/ui/Carousel";

export default function TravelPackages({ packages }: { packages: TravelPackage[] }) {
  return (
    <section className="bg-sand-50 py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="All-in-one trips"
          title="Popular Travel Packages"
          subtitle="Hotel, tours and transfers bundled together for a seamless trip."
          action={
            <Button href="/packages" variant="outline">
              View All Packages
            </Button>
          }
        />

        <div className="mt-10">
          <Carousel ariaLabel="Popular travel packages">
            {packages.slice(0, 9).map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
