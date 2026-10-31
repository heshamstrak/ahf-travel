"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Briefcase, DoorOpen, Fuel, Gauge, ShieldCheck, Snowflake, Users, Wallet, Zap } from "lucide-react";
import { Car } from "@/data/types";
import type { LocationRef } from "@/lib/api/types";
import { addDays, businessToday, nightsBetween } from "@/lib/dates";
import ImageGallery from "@/components/ui/ImageGallery";
import Stepper from "@/components/ui/Stepper";
import DateInput from "@/components/ui/DateInput";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EstimateCard from "@/components/booking/EstimateCard";
import PriceDisplay from "@/components/ui/PriceDisplay";

const YOUNG_DRIVER_FEE_EGP = 150;

export default function CarDetail({ car, locations }: { car: Car; locations: LocationRef[] }) {
  const router = useRouter();
  const [pickupDate, setPickupDate] = useState(() => businessToday());
  const [dropoffDate, setDropoffDate] = useState(() => addDays(businessToday(), 3));
  const [pickupTime, setPickupTime] = useState("10:00");
  const [pickupLocationId, setPickupLocationId] = useState(locations[0]?.id ?? "");
  const [driverAge, setDriverAge] = useState(30);

  const days = Math.max(1, nightsBetween(pickupDate, dropoffDate));
  const valid = dropoffDate > pickupDate && pickupLocationId !== "";
  const estimateEGP = valid
    ? car.pricePerDay * days + (driverAge < 25 ? YOUNG_DRIVER_FEE_EGP * days : 0)
    : null;

  const book = () => {
    if (!valid) return;
    const q = new URLSearchParams({
      type: "car",
      id: car.id,
      pickupLocationId,
      pickupDate,
      pickupTime,
      dropoffDate,
      driverAge: String(driverAge),
    });
    router.push(`/checkout?${q.toString()}`);
  };

  const specs = [
    { icon: Users, label: "Passengers", value: `${car.passengers} seats` },
    { icon: Briefcase, label: "Luggage", value: `${car.bags} bags` },
    { icon: DoorOpen, label: "Doors", value: `${car.doors}` },
    { icon: Zap, label: "Transmission", value: car.transmission },
    { icon: Snowflake, label: "Air conditioning", value: car.airConditioning ? "Yes" : "No" },
    { icon: Gauge, label: "Mileage", value: car.mileageIncluded },
    { icon: Fuel, label: "Fuel policy", value: car.fuelPolicy },
    { icon: Wallet, label: "Security deposit", value: "" },
  ];

  return (
    <div className="mx-auto max-w-8xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cars", href: "/cars" }, { label: car.name }]} />
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-12">
          <ImageGallery images={car.gallery} alt={car.name} />

          <section className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">{car.category}</span>
              <h1 className="mt-1 font-display text-3xl font-medium text-slate-900 sm:text-4xl">{car.name}</h1>
              <p className="mt-1 text-slate-600">{car.brand}</p>
            </div>
            <FavoriteButton type="car" id={car.id} label={car.name} className="border border-slate-200" />
          </section>

          <section aria-labelledby="specs" className="space-y-4">
            <h2 id="specs" className="font-display text-2xl font-medium text-slate-900">Specifications</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {specs.map((s) => (
                <div key={s.label} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4">
                  <s.icon size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  <div>
                    <dt className="text-xs text-slate-500">{s.label}</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {s.label === "Security deposit" ? <PriceDisplay amountEGP={car.depositEGP} /> : s.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="conditions" className="space-y-3">
            <h2 id="conditions" className="font-display text-2xl font-medium text-slate-900">Rental conditions</h2>
            <ul className="list-disc space-y-2 ps-5 text-sm text-slate-700">
              {car.rentalConditions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="insurance" className="space-y-3">
            <h2 id="insurance" className="flex items-center gap-2 font-display text-2xl font-medium text-slate-900">
              <ShieldCheck size={22} className="text-brand-600" /> Insurance
            </h2>
            <ul className="flex flex-wrap gap-2">
              {car.insurance.map((i) => (
                <li key={i} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800">
                  {i}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pickup" className="space-y-3 rounded-2xl bg-sand-50 p-6">
            <h2 id="pickup" className="font-display text-xl font-medium text-slate-900">Pick-up information</h2>
            <p className="text-sm text-slate-700">{car.pickupInfo}</p>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {locations.length === 0 ? (
            // No pick-up branches are configured for this car yet — show that plainly instead of a
            // booking form, price and action that can never actually complete.
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              <h2 className="font-display text-lg font-medium text-slate-900">Not yet available to book</h2>
              <p className="mt-2">This car doesn&apos;t have any pick-up branches yet. Check back soon, or contact us for availability.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-medium text-slate-900">Rental details</h2>
                <Select
                  label="Pick-up location"
                  value={pickupLocationId}
                  onChange={(e) => setPickupLocationId(e.target.value)}
                  options={locations.map((l) => ({ value: l.id, label: l.name }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <DateInput label="Pick-up date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                  <Input label="Pick-up time" type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                  <DateInput label="Drop-off date" value={dropoffDate} error={valid ? undefined : "Must be after pick-up"} onChange={(e) => setDropoffDate(e.target.value)} />
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <Stepper label="Driver age" value={driverAge} min={18} max={80} onChange={setDriverAge} />
                </div>
                {driverAge < 25 ? <p className="text-xs text-gold-700">A young driver surcharge applies under 25.</p> : null}
              </div>

              <EstimateCard
                image={car.image}
                title={car.name}
                subtitle={`${car.category} · ${car.transmission}`}
                quantityLabel={`${days} day(s)`}
                estimateLabel={`${car.name} × ${days} day(s)`}
                estimateEGP={estimateEGP}
              >
                <p className="text-xs text-slate-500">
                  Included mileage: {car.mileageIncluded}. Deposit of {`${car.depositEGP.toLocaleString("en-US")} EGP`} is held on your card and released at return.
                </p>
              </EstimateCard>
              <Button className="w-full" size="lg" onClick={book} disabled={!valid}>
                Book Now ({days} day{days > 1 ? "s" : ""})
              </Button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
