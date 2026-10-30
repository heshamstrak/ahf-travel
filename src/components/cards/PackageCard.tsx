import Image from "next/image";
import Link from "next/link";
import { Building2, Calendar, Car, MapPin, Ticket } from "lucide-react";
import { TravelPackage } from "@/data/types";
import FavoriteButton from "@/components/ui/FavoriteButton";
import PriceDisplay from "@/components/ui/PriceDisplay";

export default function PackageCard({ pkg }: { pkg: TravelPackage }) {
  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={`/packages/${pkg.id}`} className="block h-full w-full" tabIndex={-1} aria-hidden>
          <Image
            src={pkg.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-white/90">
            <Calendar size={13} />
            {pkg.duration}
          </span>
        </div>
        <FavoriteButton type="package" id={pkg.id} label={pkg.title} className="absolute end-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-lg font-medium text-slate-900">
          <Link href={`/packages/${pkg.id}`} className="hover:text-brand-700">
            {pkg.title}
          </Link>
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{pkg.cities.join(" · ")}</span>
        </div>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          <li className="flex items-center gap-1 rounded-md bg-sand-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            <Building2 size={12} />
            Hotel
          </li>
          <li className="flex items-center gap-1 rounded-md bg-sand-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            <Ticket size={12} />
            Tours
          </li>
          <li className="flex items-center gap-1 rounded-md bg-sand-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            <Car size={12} />
            Transfers
          </li>
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-xs text-slate-500">Starting from</p>
            <PriceDisplay amountEGP={pkg.startingPrice} className="font-display text-lg font-semibold text-slate-900" />
          </div>
          <Link
            href={`/packages/${pkg.id}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
