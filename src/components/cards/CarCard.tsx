import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Briefcase, DoorOpen, Snowflake, Users, Zap } from "lucide-react";
import { Car } from "@/data/types";
import FavoriteButton from "@/components/ui/FavoriteButton";
import PriceDisplay from "@/components/ui/PriceDisplay";

export default function CarCard({ car, days }: { car: Car; days?: number }) {
  const t = useTranslations();
  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-50">
        <Link href={`/cars/${car.slug || car.id}`} className="block h-full w-full" tabIndex={-1} aria-hidden>
          <Image
            src={car.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
        <span className="absolute start-3 top-3 rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-brand-800 backdrop-blur-sm">
          {car.category}
        </span>
        <FavoriteButton type="car" id={car.id} label={car.name} className="absolute end-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-lg font-medium text-slate-900">
          <Link href={`/cars/${car.slug || car.id}`} className="hover:text-brand-700">
            {car.name}
          </Link>
        </h3>
        <p className="truncate text-xs text-slate-500">{car.brand}</p>

        <ul className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-1.5">
            <Users size={14} />
            {car.passengers} {t("card.seats")}
          </li>
          <li className="flex items-center gap-1.5">
            <Briefcase size={14} />
            {car.bags} {t("card.bags")}
          </li>
          <li className="flex items-center gap-1.5">
            <DoorOpen size={14} />
            {car.doors} {t("card.doors")}
          </li>
          <li className="flex items-center gap-1.5">
            <Zap size={14} />
            {car.transmission}
          </li>
          {car.airConditioning ? (
            <li className="flex items-center gap-1.5">
              <Snowflake size={14} />
              {t("card.ac")}
            </li>
          ) : null}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            {car.pricingMode === "FIXED_PRICE" && car.pricePerDay !== null ? (
              <>
                <p className="text-xs text-slate-500">{t("card.perDay")}</p>
                <PriceDisplay amountEGP={car.pricePerDay} className="font-display text-lg font-semibold text-slate-900" />
                {days ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t("card.totalForDays", { days })} <PriceDisplay amountEGP={car.pricePerDay * days} className="font-semibold text-slate-700" />
                  </p>
                ) : null}
              </>
            ) : (
              <p className="font-display text-sm font-medium text-slate-500">{t("card.priceOnRequest")}</p>
            )}
          </div>
          <Link
            href={`/cars/${car.slug || car.id}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            {t("common.viewDetails")}
          </Link>
        </div>
      </div>
    </article>
  );
}
