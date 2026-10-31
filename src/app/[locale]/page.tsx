import Hero from "@/components/home/Hero";
import BookingSearch from "@/components/home/BookingSearch";
import PopularDestinations from "@/components/home/PopularDestinations";
import FeaturedHotels from "@/components/home/FeaturedHotels";
import PopularTours from "@/components/home/PopularTours";
import FeaturedCars from "@/components/home/FeaturedCars";
import TransferBanner from "@/components/home/TransferBanner";
import TravelPackages from "@/components/home/TravelPackages";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Reviews from "@/components/home/Reviews";
import HomeCTA from "@/components/home/HomeCTA";
import { getDestinations } from "@/services/destinations.service";
import { getHotels } from "@/services/hotels.service";
import { getTours } from "@/services/tours.service";
import { getCars } from "@/services/cars.service";
import { getPackages } from "@/services/packages.service";
import { getReviews } from "@/services/reviews.service";
import { getBranding } from "@/services/branding.service";

export default async function Home() {
  const [destinations, hotels, tours, cars, packages, reviews, branding] = await Promise.all([
    getDestinations(),
    getHotels(),
    getTours(),
    getCars(),
    getPackages(),
    getReviews(),
    getBranding(),
  ]);

  return (
    <>
      <Hero branding={branding} />
      <div className="relative z-20 -mt-24 sm:-mt-20">
        <BookingSearch destinations={destinations} />
      </div>
      <PopularDestinations destinations={destinations} />
      <FeaturedHotels hotels={hotels} />
      <PopularTours tours={tours} />
      <FeaturedCars cars={cars} />
      <TransferBanner />
      <TravelPackages packages={packages} />
      <WhyChooseUs />
      <Reviews reviews={reviews} />
      <HomeCTA />
    </>
  );
}
