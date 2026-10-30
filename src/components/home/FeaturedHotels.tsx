import { Hotel } from "@/data/types";
import HotelCard from "@/components/cards/HotelCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";
import Carousel from "@/components/ui/Carousel";

export default function FeaturedHotels({ hotels }: { hotels: Hotel[] }) {
  return (
    <section className="bg-sand-50 py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Where to stay"
          title="Featured Hotels"
          subtitle="Handpicked stays across Egypt's most sought-after locations."
          action={
            <Button href="/hotels" variant="outline">
              View All Hotels
            </Button>
          }
        />

        <div className="mt-10">
          <Carousel ariaLabel="Featured hotels">
            {hotels.slice(0, 9).map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
