import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Building2, MapPin } from "lucide-react";
import { ConferenceEvent } from "@/data/types";
import PriceDisplay from "@/components/ui/PriceDisplay";

export default function ConferenceEventCard({ item }: { item: ConferenceEvent }) {
  const t = useTranslations();
  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={`/conferences-events/${item.slug || item.id}`} className="block h-full w-full" tabIndex={-1} aria-hidden>
          <Image
            src={item.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-lg font-medium text-slate-900">
          <Link href={`/conferences-events/${item.slug || item.id}`} className="hover:text-brand-700">
            {item.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          {item.venue ? (
            <span className="flex items-center gap-1.5 truncate">
              <MapPin size={14} className="shrink-0" />
              {item.venue}
            </span>
          ) : null}
          {item.organizerName ? (
            <span className="flex items-center gap-1.5 truncate">
              <Building2 size={14} className="shrink-0" />
              {item.organizerName}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            {item.pricingMode === "FIXED_PRICE" && item.startingPrice !== null ? (
              <>
                <p className="text-xs text-slate-500">{t("card.startingFrom")}</p>
                <PriceDisplay amountEGP={item.startingPrice} className="font-display text-lg font-semibold text-slate-900" />
              </>
            ) : (
              <p className="font-display text-sm font-medium text-slate-500">{t("card.priceOnRequest")}</p>
            )}
          </div>
          <Link
            href={`/conferences-events/${item.slug || item.id}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            {t("common.viewDetails")}
          </Link>
        </div>
      </div>
    </article>
  );
}
