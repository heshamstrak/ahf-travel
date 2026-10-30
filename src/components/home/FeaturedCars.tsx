import { Car } from "@/data/types";
import CarCard from "@/components/cards/CarCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";
import Carousel from "@/components/ui/Carousel";

export default function FeaturedCars({ cars }: { cars: Car[] }) {
  return (
    <section className="bg-sand-50 py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Get around Egypt"
          title="Find the Perfect Ride"
          subtitle="Self-drive rentals with flexible pick-up locations nationwide."
          action={
            <Button href="/cars" variant="outline">
              View All Cars
            </Button>
          }
        />

        <div className="mt-10">
          <Carousel ariaLabel="Available cars">
            {cars.slice(0, 9).map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
