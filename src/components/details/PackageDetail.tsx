"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { Building2, Calendar, Car, Check, MapPin, Ticket, X } from "lucide-react";
import { TravelPackage } from "@/data/types";
import type { DepartureOffer } from "@/lib/api/types";
import { getPackageDepartures } from "@/services/packages.service";
import { formatDate } from "@/lib/dates";
import ImageGallery from "@/components/ui/ImageGallery";
import Stepper from "@/components/ui/Stepper";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EstimateCard from "@/components/booking/EstimateCard";
import ContactForPriceCta from "@/components/product/ContactForPriceCta";

export default function PackageDetail({ pkg, whatsappNumber }: { pkg: TravelPackage; whatsappNumber: string | null }) {
  const router = useRouter();
  const [guests, setGuests] = useState(2);
  const [departures, setDepartures] = useState<DepartureOffer[]>([]);
  const [departureId, setDepartureId] = useState<string | null>(null);
  const bookable = pkg.pricingMode === "FIXED_PRICE";
  const [loadingDepartures, setLoadingDepartures] = useState(bookable);
  const [departuresError, setDeparturesError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookable) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined;
        setLoadingDepartures(true);
        setDeparturesError(null);
        return getPackageDepartures(pkg.id, guests);
      })
      .then((result) => {
        if (!result) return;
        if (cancelled) return;
        setDepartures(result);
        setDepartureId((current) => (current && result.some((d) => d.id === current) ? current : (result[0]?.id ?? null)));
      })
      .catch(() => {
        if (!cancelled) setDeparturesError("Could not load available departures. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDepartures(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pkg.id, guests, bookable]);

  const selectedDeparture = useMemo(() => departures.find((d) => d.id === departureId) ?? null, [departures, departureId]);
  const perTraveller = selectedDeparture?.priceOverride ? Number(selectedDeparture.priceOverride.amount) : pkg.startingPrice ?? 0;
  const estimateEGP = perTraveller * guests;

  const book = () => {
    if (!departureId) return;
    const q = new URLSearchParams({ type: "package", id: pkg.id, departureId, guests: String(guests) });
    router.push(`/checkout?${q.toString()}`);
  };

  return (
    <div className="mx-auto max-w-8xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Packages", href: "/packages" }, { label: pkg.title }]} />
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-12">
          <ImageGallery images={pkg.gallery} alt={pkg.title} />

          <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="font-display text-3xl font-medium text-slate-900 sm:text-4xl">{pkg.title}</h1>
              <FavoriteButton type="package" id={pkg.id} label={pkg.title} className="border border-slate-200" />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} /> {pkg.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={15} /> {pkg.cities.join(" · ")}
              </span>
            </div>
            <p className="leading-relaxed text-slate-700">{pkg.overview}</p>
          </section>

          <section aria-labelledby="itinerary" className="space-y-4">
            <h2 id="itinerary" className="font-display text-2xl font-medium text-slate-900">Day-by-day itinerary</h2>
            <ol className="space-y-4">
              {pkg.itinerary.map((d) => (
                <li key={d.day} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 font-display text-lg font-semibold text-white">
                    {d.day}
                  </span>
                  <div>
                    <h3 className="font-medium text-slate-900">{d.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{d.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="inclusions" className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <h2 className="flex items-center gap-2 font-medium text-slate-900">
                <Building2 size={18} className="text-brand-600" /> Hotel
              </h2>
              <p className="mt-2 font-semibold text-slate-800">{pkg.hotel.name}</p>
              <p className="mt-1 text-sm text-slate-600">{pkg.hotel.description}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <h2 className="flex items-center gap-2 font-medium text-slate-900">
                <Ticket size={18} className="text-brand-600" /> Tours
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {pkg.toursIncluded.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <h2 className="flex items-center gap-2 font-medium text-slate-900">
                <Car size={18} className="text-brand-600" /> Transfers
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {pkg.transfersIncluded.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="included" className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h2 id="included" className="font-display text-xl font-medium text-slate-900">Included</h2>
              <ul className="mt-3 space-y-2">
                {pkg.included.map((i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-xl font-medium text-slate-900">Excluded</h2>
              <ul className="mt-3 space-y-2">
                {pkg.excluded.map((i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <X size={16} className="mt-0.5 shrink-0 text-slate-400" /> {i}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {!bookable ? (
            <ContactForPriceCta productName={pkg.title} productType="package" productId={pkg.id} whatsappNumber={whatsappNumber} />
          ) : loadingDepartures ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium text-slate-900">Plan your trip</h2>
              <p className="mt-3 text-sm text-slate-500">Loading available departures…</p>
            </div>
          ) : departuresError ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium text-slate-900">Plan your trip</h2>
              <p role="alert" className="mt-3 text-sm text-red-600">
                {departuresError}
              </p>
            </div>
          ) : departures.length === 0 ? (
            // No departures have been configured for this package yet (or none have room for
            // {guests} travellers) — show that plainly instead of a booking form, price and action
            // that can never actually complete.
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              <h2 className="font-display text-lg font-medium text-slate-900">Not yet available to book</h2>
              <p className="mt-2">This package doesn&apos;t have any upcoming departure dates yet. Check back soon, or contact us for availability.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-medium text-slate-900">Plan your trip</h2>
                <Select
                  label="Available start date"
                  value={departureId ?? ""}
                  onChange={(e) => setDepartureId(e.target.value)}
                  options={departures.map((d) => ({ value: d.id, label: `${formatDate(d.startsOn)} (${d.remainingTravellers} spots left)` }))}
                />
                <div className="rounded-xl border border-slate-200 p-4">
                  <Stepper label="Travellers" value={guests} min={1} max={10} onChange={setGuests} />
                </div>
              </div>

              <EstimateCard
                image={pkg.image}
                title={pkg.title}
                subtitle={`${pkg.duration} · ${pkg.cities.join(", ")}`}
                quantityLabel={`${guests} traveller(s)`}
                estimateLabel={`${guests} traveller(s) × package rate`}
                estimateEGP={selectedDeparture ? estimateEGP : null}
              >
                <p className="text-xs text-slate-500">Starting price is based on two travellers and scaled per person.</p>
              </EstimateCard>
              <Button className="w-full" size="lg" onClick={book} disabled={!departureId}>
                Book Package
              </Button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
