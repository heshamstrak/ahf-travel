import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Destination } from "@/data/types";

export default function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link
      href={`/hotels?destination=${destination.id}`}
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <Image
        src={destination.image}
        alt={`${destination.name}, ${destination.country}`}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

      {destination.featured ? (
        <span className="absolute start-4 top-4 flex items-center gap-1.5 rounded-md bg-gold-500 px-3 py-1 text-xs font-semibold text-white">
          <Sparkles size={12} />
          Most Popular
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="line-clamp-1 font-display text-xl font-medium text-white">{destination.name}</h3>
        <p className="mt-1 truncate text-sm text-white/80">
          {destination.listingsCount}+ {destination.listingsLabel}
        </p>
      </div>
    </Link>
  );
}
