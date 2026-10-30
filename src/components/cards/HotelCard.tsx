import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Hotel } from "@/data/types";
import FavoriteButton from "@/components/ui/FavoriteButton";
import PriceDisplay from "@/components/ui/PriceDisplay";

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={`/hotels/${hotel.id}`} className="block h-full w-full" tabIndex={-1} aria-hidden>
          <Image
            src={hotel.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
        <FavoriteButton type="hotel" id={hotel.id} label={hotel.name} className="absolute end-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-0.5 text-gold-500" aria-label={`${hotel.starRating} star hotel`}>
          {Array.from({ length: hotel.starRating }).map((_, i) => (
            <Star key={i} size={13} className="fill-gold-500 text-gold-500" />
          ))}
        </div>

        <h3 className="mt-2 line-clamp-2 font-display text-lg font-medium text-slate-900">
          <Link href={`/hotels/${hotel.id}`} className="hover:text-brand-700">
            {hotel.name}
          </Link>
        </h3>

        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{hotel.location}</span>
        </div>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {hotel.amenities.slice(0, 3).map((amenity) => (
            <li key={amenity} className="rounded-md bg-sand-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {amenity}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-700 text-xs font-semibold text-white">
              {hotel.guestRating}
            </span>
            <span className="text-xs text-slate-500">{hotel.reviewCount.toLocaleString("en-US")} reviews</span>
          </div>
          <div className="text-end">
            {hotel.priceAvailable ? (
              <>
                <p className="text-xs text-slate-500">from</p>
                <PriceDisplay
                  amountEGP={hotel.pricePerNight}
                  suffix="/night"
                  className="font-display text-lg font-semibold text-slate-900"
                />
              </>
            ) : (
              <p className="font-display text-sm font-medium text-slate-500">Price on request</p>
            )}
          </div>
        </div>

        <Link
          href={`/hotels/${hotel.id}`}
          className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}
