"use client";

import { ReactElement, useState } from "react";
import { Heart } from "lucide-react";
import { Car, Hotel, Tour, TravelPackage } from "@/data/types";
import { FavoriteItem, useApp } from "@/context/AppProvider";
import HotelCard from "@/components/cards/HotelCard";
import TourCard from "@/components/cards/TourCard";
import CarCard from "@/components/cards/CarCard";
import PackageCard from "@/components/cards/PackageCard";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

type Kind = FavoriteItem["type"] | "all";

const kinds: { key: Kind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "hotel", label: "Hotels" },
  { key: "tour", label: "Tours" },
  { key: "car", label: "Cars" },
  { key: "package", label: "Packages" },
];

export default function FavoritesView({
  hotels,
  tours,
  cars,
  packages,
}: {
  hotels: Hotel[];
  tours: Tour[];
  cars: Car[];
  packages: TravelPackage[];
}) {
  const { favorites } = useApp();
  const [kind, setKind] = useState<Kind>("all");

  const items: { key: string; node: ReactElement }[] = [];
  for (const f of favorites) {
    if (kind !== "all" && f.type !== kind) continue;
    const key = `${f.type}-${f.id}`;
    if (f.type === "hotel") {
      const hotel = hotels.find((h) => h.id === f.id);
      if (hotel) items.push({ key, node: <HotelCard hotel={hotel} /> });
    } else if (f.type === "tour") {
      const tour = tours.find((t) => t.id === f.id);
      if (tour) items.push({ key, node: <TourCard tour={tour} /> });
    } else if (f.type === "car") {
      const car = cars.find((c) => c.id === f.id);
      if (car) items.push({ key, node: <CarCard car={car} /> });
    } else {
      const pkg = packages.find((p) => p.id === f.id);
      if (pkg) items.push({ key, node: <PackageCard pkg={pkg} /> });
    }
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={24} />}
        title="No favorites yet"
        description="Tap the heart on any hotel, tour, car or package to save it here."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/hotels">Browse Hotels</Button>
            <Button href="/tours" variant="outline">
              Browse Tours
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div role="tablist" aria-label="Favorite type" className="flex flex-wrap gap-2">
        {kinds.map((k) => {
          const count = k.key === "all" ? favorites.length : favorites.filter((f) => f.type === k.key).length;
          return (
            <button
              key={k.key}
              type="button"
              role="tab"
              aria-selected={kind === k.key}
              onClick={() => setKind(k.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                kind === k.key ? "bg-brand-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300"
              }`}
            >
              {k.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <EmptyState title="Nothing saved in this category" description="Choose another tab or browse to save more." />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((i) => (
            <div key={i.key}>{i.node}</div>
          ))}
        </div>
      )}
    </div>
  );
}
