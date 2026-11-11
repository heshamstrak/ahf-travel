"use client";

import { FormEvent, ReactNode, useId, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { BedDouble, Calendar, Car, Clock, Compass, MapPin, Minus, Plus, Search, Shuffle, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import { Destination } from "@/data/types";
import { addDays } from "@/lib/dates";

type TabKey = "hotels" | "tours" | "cars" | "transfers";

const tabs: { key: TabKey; labelKey: string; icon: typeof BedDouble }[] = [
  { key: "hotels", labelKey: "search.hotels", icon: BedDouble },
  { key: "tours", labelKey: "search.tours", icon: Compass },
  { key: "cars", labelKey: "search.cars", icon: Car },
  { key: "transfers", labelKey: "search.transfers", icon: Shuffle },
];

const submitKey: Record<TabKey, string> = {
  hotels: "search.searchHotels",
  tours: "search.findExperiences",
  cars: "search.searchCars",
  transfers: "search.findTransfer",
};

const inputClasses =
  "w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0";

function FieldShell({ icon, label, htmlFor, children }: { icon: ReactNode; label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3 lg:flex-1 lg:px-5 lg:py-2.5">
      <span className="text-brand-600" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-500">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

function resolveDestination(text: string, destinations: Destination[]): string {
  const value = text.trim().toLowerCase();
  if (!value) return "";
  const match = destinations.find((d) => d.id === value || d.name.toLowerCase() === value);
  return match ? match.id : value;
}

function toQuery(params: Record<string, string>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}

export default function BookingSearch({ destinations }: { destinations: Destination[] }) {
  const router = useRouter();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabKey>("hotels");
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (name: string) => String(data.get(name) ?? "").trim();

    if (activeTab === "hotels") {
      const checkIn = get("checkIn");
      const checkOut = get("checkOut");
      if (checkIn && checkOut && checkOut <= checkIn) {
        setError("Check-out must be after check-in.");
        return;
      }
      router.push(
        `/hotels?${toQuery({
          destination: resolveDestination(get("destination"), destinations),
          checkIn,
          checkOut: checkOut || (checkIn ? addDays(checkIn, 1) : ""),
          guests: String(guests),
          rooms: String(rooms),
        })}`
      );
    }

    if (activeTab === "tours") {
      router.push(
        `/tours?${toQuery({
          destination: resolveDestination(get("destination"), destinations),
          date: get("date"),
          guests: get("guests") || "2",
        })}`
      );
    }

    if (activeTab === "cars") {
      const pickupDate = get("pickupDate");
      const dropoffDate = get("dropoffDate");
      if (pickupDate && dropoffDate && dropoffDate < pickupDate) {
        setError("Drop-off date cannot be before pick-up.");
        return;
      }
      router.push(
        `/cars?${toQuery({
          pickup: get("pickup"),
          pickupDate,
          dropoffDate,
          driverAge: get("driverAge") || "30",
        })}`
      );
    }

    if (activeTab === "transfers") {
      router.push(
        `/transfers?${toQuery({
          pickup: get("pickup"),
          destination: get("destination"),
          date: get("date"),
          time: get("time"),
          passengers: get("passengers") || "2",
        })}`
      );
    }
  };

  return (
    <div id="booking-search" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white shadow-xl shadow-black/10 ring-1 ring-black/5">
        <div role="tablist" aria-label="Booking type" className="flex flex-wrap gap-1 border-b border-slate-100 p-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.key}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setError(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
                  selected ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-sand-50 hover:text-brand-700"
                }`}
              >
                <Icon size={16} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        <form
          key={activeTab}
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          onSubmit={submit}
          className="p-3"
        >
          <div className="flex flex-col divide-y divide-slate-100 rounded-2xl border border-slate-100 lg:flex-row lg:items-center lg:divide-x lg:divide-y-0">
            {activeTab === "hotels" ? (
              <>
                <FieldShell icon={<MapPin size={18} />} label="Destination" htmlFor={id("dest")}>
                  <input id={id("dest")} name="destination" list={id("dest-list")} placeholder="Where are you going?" className={inputClasses} />
                  <datalist id={id("dest-list")}>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                </FieldShell>
                <FieldShell icon={<Calendar size={18} />} label="Check-in" htmlFor={id("checkin")}>
                  <input id={id("checkin")} name="checkIn" type="date" className={inputClasses} />
                </FieldShell>
                <FieldShell icon={<Calendar size={18} />} label="Check-out" htmlFor={id("checkout")}>
                  <input id={id("checkout")} name="checkOut" type="date" className={inputClasses} />
                </FieldShell>
                <div className="flex w-full items-center gap-3 px-4 py-3 lg:flex-1 lg:px-5 lg:py-2.5">
                  <span className="text-brand-600" aria-hidden>
                    <Users size={18} />
                  </span>
                  <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
                    <Counter label="Guests" value={guests} min={1} max={12} onChange={setGuests} />
                    <Counter label="Rooms" value={rooms} min={1} max={6} onChange={setRooms} />
                  </div>
                </div>
              </>
            ) : null}

            {activeTab === "tours" ? (
              <>
                <FieldShell icon={<MapPin size={18} />} label="Destination" htmlFor={id("tdest")}>
                  <input id={id("tdest")} name="destination" list={id("dest-list")} placeholder="Where do you want to explore?" className={inputClasses} />
                  <datalist id={id("dest-list")}>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                </FieldShell>
                <FieldShell icon={<Calendar size={18} />} label="Date" htmlFor={id("tdate")}>
                  <input id={id("tdate")} name="date" type="date" className={inputClasses} />
                </FieldShell>
                <FieldShell icon={<Users size={18} />} label="Guests" htmlFor={id("tguests")}>
                  <input id={id("tguests")} name="guests" type="number" min={1} max={20} defaultValue={2} className={inputClasses} />
                </FieldShell>
              </>
            ) : null}

            {activeTab === "cars" ? (
              <>
                <FieldShell icon={<MapPin size={18} />} label="Pick-up Location" htmlFor={id("cpick")}>
                  <input id={id("cpick")} name="pickup" placeholder="Airport, city or hotel" className={inputClasses} />
                </FieldShell>
                <FieldShell icon={<Calendar size={18} />} label="Pick-up Date" htmlFor={id("cpd")}>
                  <input id={id("cpd")} name="pickupDate" type="date" className={inputClasses} />
                </FieldShell>
                <FieldShell icon={<Calendar size={18} />} label="Drop-off Date" htmlFor={id("cdd")}>
                  <input id={id("cdd")} name="dropoffDate" type="date" className={inputClasses} />
                </FieldShell>
                <FieldShell icon={<Users size={18} />} label="Driver Age" htmlFor={id("cage")}>
                  <input id={id("cage")} name="driverAge" type="number" min={18} max={99} defaultValue={30} className={inputClasses} />
                </FieldShell>
              </>
            ) : null}

            {activeTab === "transfers" ? (
              <>
                <FieldShell icon={<MapPin size={18} />} label="Pick-up" htmlFor={id("tpick")}>
                  <input id={id("tpick")} name="pickup" placeholder="Airport or hotel" className={inputClasses} />
                </FieldShell>
                <FieldShell icon={<MapPin size={18} />} label="Destination" htmlFor={id("tto")}>
                  <input id={id("tto")} name="destination" placeholder="Hotel or address" className={inputClasses} />
                </FieldShell>
                <FieldShell icon={<Calendar size={18} />} label="Date" htmlFor={id("trd")}>
                  <input id={id("trd")} name="date" type="date" className={inputClasses} />
                </FieldShell>
                <FieldShell icon={<Clock size={18} />} label="Time" htmlFor={id("ttime")}>
                  <input id={id("ttime")} name="time" type="time" className={inputClasses} />
                </FieldShell>
                <FieldShell icon={<Users size={18} />} label="Passengers" htmlFor={id("tpax")}>
                  <input id={id("tpax")} name="passengers" type="number" min={1} max={12} defaultValue={2} className={inputClasses} />
                </FieldShell>
              </>
            ) : null}

            <div className="p-3 lg:p-2">
              <Button type="submit" className="w-full lg:w-auto">
                <Search size={17} />
                {t(submitKey[activeTab])}
              </Button>
            </div>
          </div>
          {error ? (
            <p role="alert" className="mt-3 px-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-700">
        {value} {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-brand-500 hover:text-brand-600"
        >
          <Minus size={11} />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-brand-500 hover:text-brand-600"
        >
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}
