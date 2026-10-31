import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Clock, MapPin, Star } from "lucide-react";
import { Tour } from "@/data/types";
import FavoriteButton from "@/components/ui/FavoriteButton";
import PriceDisplay from "@/components/ui/PriceDisplay";

export default function TourCard({ tour }: { tour: Tour }) {
  const t = useTranslations();
  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={`/tours/${tour.slug || tour.id}`} className="block h-full w-full" tabIndex={-1} aria-hidden>
          <Image
            src={tour.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
        <span className="absolute start-3 top-3 rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-brand-800 backdrop-blur-sm">
          {tour.category}
        </span>
        <FavoriteButton type="tour" id={tour.id} label={tour.title} className="absolute end-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-lg font-medium text-slate-900">
          <Link href={`/tours/${tour.slug || tour.id}`} className="hover:text-brand-700">
            {tour.title}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <MapPin size={14} />
            {tour.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {tour.duration}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <Star size={14} className="fill-gold-500 text-gold-500" />
          <span className="text-sm font-semibold text-slate-800">{tour.rating}</span>
          <span className="text-xs text-slate-500">({tour.reviewCount.toLocaleString("en-US")} {t("card.reviews")})</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-xs text-slate-500">{t("card.startingFrom")}</p>
            <PriceDisplay amountEGP={tour.startingPrice} suffix={t("card.perPerson")} className="font-display text-lg font-semibold text-slate-900" />
          </div>
          <Link
            href={`/tours/${tour.slug || tour.id}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            {t("common.viewDetails")}
          </Link>
        </div>
      </div>
    </article>
  );
}
