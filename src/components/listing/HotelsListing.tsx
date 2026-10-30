"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Destination, Hotel } from "@/data/types";
import { filterHotels, HotelFilters, hotelPriceCap, paginate } from "@/lib/listing";
import { nightsBetween } from "@/lib/dates";
import { useApp } from "@/context/AppProvider";
import { formatMoney } from "@/lib/currency";
import FilterLayout from "./FilterLayout";
import HotelCard from "@/components/cards/HotelCard";
import CheckboxGroup from "@/components/ui/CheckboxGroup";
import RangeInput from "@/components/ui/RangeInput";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadMore from "@/components/ui/LoadMore";
import Stepper from "@/components/ui/Stepper";

const PAGE_SIZE = 6;

const defaultFilters: HotelFilters = {
  destinationId: "",
  maxPrice: hotelPriceCap,
  stars: [],
  minGuestRating: 0,
  amenities: [],
  propertyTypes: [],
  sort: "recommended",
};

export default function HotelsListing(props: { hotels: Hotel[]; destinations: Destination[] }) {
  const params = useSearchParams();
  return <HotelsResults key={params.toString()} {...props} />;
}

function HotelsResults({ hotels, destinations }: { hotels: Hotel[]; destinations: Destination[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { currency } = useApp();

  const initial = {
    destination: params.get("destination") ?? "",
    checkIn: params.get("checkIn") ?? "",
    checkOut: params.get("checkOut") ?? "",
    guests: Number(params.get("guests") ?? 2) || 2,
    rooms: Number(params.get("rooms") ?? 1) || 1,
  };

  const [search, setSearch] = useState(initial);
  const [filters, setFilters] = useState<HotelFilters>({ ...defaultFilters, destinationId: initial.destination });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const destinationName = destinations.find((d) => d.id === initial.destination)?.name;
  const nights = nightsBetween(initial.checkIn, initial.checkOut);

  const amenityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    hotels.forEach((h) => h.amenities.forEach((a) => counts.set(a, (counts.get(a) ?? 0) + 1)));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([value, count]) => ({ value, label: value, count }));
  }, [hotels]);

  const results = useMemo(() => filterHotels(hotels, filters), [hotels, filters]);
  const shown = paginate(results, PAGE_SIZE, visible);

  const activeCount =
    (filters.maxPrice < hotelPriceCap ? 1 : 0) +
    filters.stars.length +
    (filters.minGuestRating > 0 ? 1 : 0) +
    filters.amenities.length +
    filters.propertyTypes.length;

  const update = (patch: Partial<HotelFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setVisible(PAGE_SIZE);
  };

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (search.destination) q.set("destination", search.destination);
    if (search.checkIn) q.set("checkIn", search.checkIn);
    if (search.checkOut) q.set("checkOut", search.checkOut);
    q.set("guests", String(search.guests));
    q.set("rooms", String(search.rooms));
    router.push(`/hotels?${q.toString()}`);
  };

  const filtersNode = (
    <>
      <RangeInput
        label="Price per night"
        min={500}
        max={hotelPriceCap}
        step={100}
        value={filters.maxPrice}
        onChange={(v) => update({ maxPrice: v })}
        format={(v) => formatMoney(v, currency)}
      />
      <CheckboxGroup
        legend="Star rating"
        options={[5, 4, 3].map((s) => ({ value: String(s), label: `${s} stars` }))}
        selected={filters.stars.map(String)}
        onChange={(next) => update({ stars: next.map(Number) })}
      />
      <Select
        label="Guest rating"
        value={String(filters.minGuestRating)}
        onChange={(e) => update({ minGuestRating: Number(e.target.value) })}
        options={[
          { value: "0", label: "Any rating" },
          { value: "8", label: "8.0+ Very good" },
          { value: "9", label: "9.0+ Exceptional" },
        ]}
      />
      <CheckboxGroup
        legend="Property type"
        options={["Hotel", "Resort", "Apartment", "Villa"].map((p) => ({ value: p, label: p }))}
        selected={filters.propertyTypes}
        onChange={(next) => update({ propertyTypes: next })}
      />
      <CheckboxGroup
        legend="Amenities"
        options={amenityOptions}
        selected={filters.amenities}
        onChange={(next) => update({ amenities: next })}
      />
    </>
  );

  const sortControl = (
    <Select
      label=""
      aria-label="Sort hotels"
      className="w-56"
      value={filters.sort}
      onChange={(e) => update({ sort: e.target.value as HotelFilters["sort"] })}
      options={[
        { value: "recommended", label: "Recommended" },
        { value: "price-asc", label: "Price: low to high" },
        { value: "price-desc", label: "Price: high to low" },
        { value: "rating", label: "Guest rating" },
        { value: "stars", label: "Star rating" },
      ]}
    />
  );

  return (
    <div className="space-y-8">
      <form onSubmit={submitSearch} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto_auto] xl:items-end">
        <Select
          label="Destination"
          value={search.destination}
          onChange={(e) => setSearch({ ...search, destination: e.target.value })}
          options={[{ value: "", label: "All destinations" }, ...destinations.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <Input label="Check-in" type="date" value={search.checkIn} onChange={(e) => setSearch({ ...search, checkIn: e.target.value })} />
        <Input label="Check-out" type="date" value={search.checkOut} onChange={(e) => setSearch({ ...search, checkOut: e.target.value })} />
        <div className="flex flex-col justify-end gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
          <Stepper label="Guests" value={search.guests} min={1} max={12} onChange={(v) => setSearch({ ...search, guests: v })} />
          <Stepper label="Rooms" value={search.rooms} min={1} max={6} onChange={(v) => setSearch({ ...search, rooms: v })} />
        </div>
        <Button type="submit" className="w-full xl:w-auto">
          <Search size={16} />
          Search
        </Button>
      </form>

      <FilterLayout
        filters={filtersNode}
        activeCount={activeCount}
        onReset={() => update({ ...defaultFilters, destinationId: filters.destinationId })}
        toolbar={
          <>
            <p className="hidden text-sm text-slate-600 sm:block" aria-live="polite">
              <span className="font-semibold text-slate-900">{results.length}</span> hotels
              {destinationName ? ` in ${destinationName}` : ""}
              {nights > 0 ? ` · ${nights} night${nights > 1 ? "s" : ""}` : ""} · {search.guests} guest{search.guests > 1 ? "s" : ""}
            </p>
            {sortControl}
          </>
        }
      >
        {results.length === 0 ? (
          <EmptyState
            title="No hotels match these filters"
            description="Try a higher price, fewer amenities, or a different destination."
            action={
              <Button variant="outline" onClick={() => setFilters({ ...defaultFilters, destinationId: filters.destinationId })}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
            <LoadMore shown={shown.length} total={results.length} noun="hotels" onLoadMore={() => setVisible((v) => v + PAGE_SIZE)} />
          </>
        )}
      </FilterLayout>
    </div>
  );
}
