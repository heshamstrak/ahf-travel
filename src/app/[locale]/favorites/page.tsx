import type { Metadata } from "next";
import FavoritesView from "@/components/favorites/FavoritesView";
import { getHotels } from "@/services/hotels.service";
import { getTours } from "@/services/tours.service";
import { getCars } from "@/services/cars.service";
import { getPackages } from "@/services/packages.service";

export const metadata: Metadata = { title: "Favorites", robots: { index: false, follow: false } };

export default async function FavoritesPage() {
  const [hotels, tours, cars, packages] = await Promise.all([getHotels(), getTours(), getCars(), getPackages()]);

  return (
    <>
      <div className="border-b border-slate-100 bg-sand-50">
        <div className="mx-auto max-w-8xl px-4 pb-8 pt-28 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-medium text-slate-900 sm:text-4xl">Your favorites</h1>
          <p className="mt-2 text-slate-600">Hotels, tours, cars and packages you saved. Saved on this device.</p>
        </div>
      </div>
      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
        <FavoritesView hotels={hotels} tours={tours} cars={cars} packages={packages} />
      </div>
    </>
  );
}
