import { Tour } from "@/data/types";
import TourCard from "@/components/cards/TourCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";
import Carousel from "@/components/ui/Carousel";

export default function PopularTours({ tours }: { tours: Tour[] }) {
  return (
    <section className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Things to do"
        title="Unforgettable Experiences"
        subtitle="Explore Egypt beyond the ordinary."
        action={
          <Button href="/tours" variant="outline">
            View All Experiences
          </Button>
        }
      />

      <div className="mt-10">
        <Carousel ariaLabel="Popular tours">
          {tours.slice(0, 9).map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
