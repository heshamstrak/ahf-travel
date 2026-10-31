"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { ArrowDownUp, Plane } from "lucide-react";
import { TransferVehicle } from "@/data/types";
import type { LocationRef, TransferRateView } from "@/lib/api/types";
import { getTransferRates } from "@/services/transfers.service";
import { FALLBACK_IMAGE } from "@/lib/api/images";
import TransferVehicleCard from "@/components/cards/TransferVehicleCard";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Stepper from "@/components/ui/Stepper";
import DateInput from "@/components/ui/DateInput";
import Input from "@/components/ui/Input";

function toVehicle(rate: TransferRateView): TransferVehicle {
  return {
    id: rate.id,
    type: rate.vehicleClass.name as TransferVehicle["type"],
    name: rate.vehicleClass.name,
    image: rate.vehicleClass.image?.url ?? FALLBACK_IMAGE,
    passengers: rate.vehicleClass.passengersMax,
    luggage: rate.vehicleClass.luggageMax,
    features: rate.vehicleClass.features,
    basePriceEGP: Number(rate.amount.amount),
  };
}

export default function TransfersBooking({ locations }: { locations: LocationRef[] }) {
  const params = useSearchParams();
  return <TransfersForm key={params.toString()} locations={locations} />;
}

function TransfersForm({ locations }: { locations: LocationRef[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const airports = locations.filter((l) => l.type === "AIRPORT");
  const zones = locations.filter((l) => l.type === "ZONE");

  const [originId, setOriginId] = useState(airports[0]?.id ?? locations[0]?.id ?? "");
  const [destinationId, setDestinationId] = useState(zones[0]?.id ?? locations[1]?.id ?? "");
  const [date, setDate] = useState(params.get("date") ?? "");
  const [time, setTime] = useState(params.get("time") ?? "12:00");
  const [passengers, setPassengers] = useState(Number(params.get("passengers") ?? 2) || 2);
  const [luggage, setLuggage] = useState(2);
  const [rateId, setRateId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [rates, setRates] = useState<TransferRateView[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined;
        if (!originId || !destinationId || originId === destinationId) {
          setRates([]);
          return undefined;
        }
        setLoadingRates(true);
        setRateError(null);
        return getTransferRates({ originLocationId: originId, destinationLocationId: destinationId, date: date || undefined, time: time || undefined, passengers, luggage });
      })
      .then((result) => {
        if (!result || cancelled) return;
        setRates(result);
        setRateId(null);
      })
      .catch(() => {
        if (!cancelled) setRateError("Could not load rates for this route. Try a different route or date.");
      })
      .finally(() => {
        if (!cancelled) setLoadingRates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [originId, destinationId, date, time, passengers, luggage]);

  const selectedRate = useMemo(() => rates.find((r) => r.id === rateId) ?? null, [rates, rateId]);

  const swap = () => {
    setOriginId(destinationId);
    setDestinationId(originId);
    setRateId(null);
  };

  const proceed = () => {
    const next: Record<string, string> = {};
    if (!originId) next.pickup = "Choose a pick-up location";
    if (!destinationId || destinationId === originId) next.destination = "Choose a different destination";
    if (!date) next.date = "Choose a date";
    if (!rateId) next.vehicle = "Select a vehicle to continue";
    setErrors(next);
    if (Object.keys(next).length > 0 || !rateId) return;

    const q = new URLSearchParams({
      type: "transfer",
      rateId,
      date,
      time,
      passengers: String(passengers),
      luggage: String(luggage),
    });
    router.push(`/checkout?${q.toString()}`);
  };

  const locationLabel = (id: string) => locations.find((l) => l.id === id)?.name ?? "—";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-8">
        <section aria-labelledby="route-title" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="route-title" className="font-display text-lg font-medium text-slate-900">
            Your route
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <Select
              label="Pick-up"
              value={originId}
              error={errors.pickup}
              onChange={(e) => setOriginId(e.target.value)}
              options={locations.map((l) => ({ value: l.id, label: l.name }))}
            />

            <button
              type="button"
              onClick={swap}
              aria-label="Swap pick-up and destination"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-700"
            >
              <ArrowDownUp size={16} />
            </button>

            <Select
              label="Destination"
              value={destinationId}
              error={errors.destination}
              onChange={(e) => setDestinationId(e.target.value)}
              options={locations.map((l) => ({ value: l.id, label: l.name }))}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DateInput label="Date" value={date} error={errors.date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <div className="rounded-xl border border-slate-200 px-4 py-2.5">
              <Stepper label="Passengers" value={passengers} min={1} max={12} onChange={setPassengers} />
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-2.5">
              <Stepper label="Luggage" value={luggage} min={0} max={12} onChange={setLuggage} />
            </div>
          </div>
        </section>

        <section aria-labelledby="vehicles-title" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 id="vehicles-title" className="font-display text-xl font-medium text-slate-900">
              Choose a vehicle
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <Plane size={14} /> Fixed price, flight tracking included
            </p>
          </div>
          {errors.vehicle ? (
            <p role="alert" className="text-sm text-red-600">
              {errors.vehicle}
            </p>
          ) : null}
          {loadingRates ? (
            <p className="text-sm text-slate-500">Loading available vehicles…</p>
          ) : rateError ? (
            <p role="alert" className="text-sm text-red-600">
              {rateError}
            </p>
          ) : rates.length === 0 ? (
            <p className="text-sm text-slate-500">No vehicles available for this route yet. Try a different date.</p>
          ) : (
            <div className="space-y-4">
              {rates.map((r) => (
                <TransferVehicleCard
                  key={r.id}
                  vehicle={toVehicle(r)}
                  priceEGP={Number(r.amount.amount)}
                  selected={rateId === r.id}
                  passengerWarning={passengers > r.vehicleClass.passengersMax}
                  onSelect={() => {
                    setRateId(r.id);
                    setErrors((e) => ({ ...e, vehicle: "" }));
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        {selectedRate ? (
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-medium text-slate-900">Transfer summary</h2>
            <dl className="space-y-1 text-sm text-slate-600">
              <div className="flex justify-between gap-3">
                <dt>From</dt>
                <dd className="truncate text-end font-medium text-slate-800">{locationLabel(originId)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>To</dt>
                <dd className="truncate text-end font-medium text-slate-800">{locationLabel(destinationId)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>When</dt>
                <dd className="text-end font-medium text-slate-800">
                  {date || "Date not set"} · {time}
                </dd>
              </div>
            </dl>
            <Button className="w-full" onClick={proceed}>
              Continue to checkout
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <h2 className="font-display text-lg font-medium text-slate-900">Transfer summary</h2>
            <p className="mt-2 text-sm text-slate-600">Select a vehicle to see your fixed price and booking summary.</p>
            <Button className="mt-5 w-full" variant="outline" onClick={proceed}>
              Continue to checkout
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}
