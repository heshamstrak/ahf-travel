import { Destination } from "@/data/types";
import DestinationCard from "@/components/cards/DestinationCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Carousel from "@/components/ui/Carousel";

export default function PopularDestinations({ destinations }: { destinations: Destination[] }) {
  return (
    <section className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Where to next"
        title="Explore Popular Destinations"
        subtitle="Discover some of Egypt's most unforgettable destinations."
      />

      <div className="mt-10">
        <Carousel ariaLabel="Popular destinations">
          {destinations.slice(0, 9).map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
