"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Car } from "@/data/types";
import { carPriceCap, CarFilters, filterCars, paginate } from "@/lib/listing";
import { nightsBetween } from "@/lib/dates";
import { useApp } from "@/context/AppProvider";
import { formatMoney } from "@/lib/currency";
import FilterLayout from "./FilterLayout";
import CarCard from "@/components/cards/CarCard";
import CheckboxGroup from "@/components/ui/CheckboxGroup";
import RangeInput from "@/components/ui/RangeInput";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadMore from "@/components/ui/LoadMore";

const PAGE_SIZE = 6;

const defaultFilters: CarFilters = {
  categories: [],
  maxPrice: carPriceCap,
  transmission: "any",
  minPassengers: 1,
  minBags: 0,
  airConditioning: false,
  brands: [],
  sort: "recommended",
};

export default function CarsListing(props: { cars: Car[] }) {
  const params = useSearchParams();
  return <CarsResults key={params.toString()} {...props} />;
}

function CarsResults({ cars }: { cars: Car[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { currency } = useApp();

  const initial = {
    pickup: params.get("pickup") ?? "",
    dropoff: params.get("dropoff") ?? "",
    pickupDate: params.get("pickupDate") ?? "",
    pickupTime: params.get("pickupTime") ?? "10:00",
    dropoffDate: params.get("dropoffDate") ?? "",
    dropoffTime: params.get("dropoffTime") ?? "10:00",
    driverAge: params.get("driverAge") ?? "30",
  };

  const [search, setSearch] = useState(initial);
  const [filters, setFilters] = useState<CarFilters>(defaultFilters);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(() => [...new Set(cars.map((c) => c.category))].map((c) => ({ value: c, label: c })), [cars]);
  const brands = useMemo(() => [...new Set(cars.map((c) => c.brand))].map((b) => ({ value: b, label: b })), [cars]);
  const results = useMemo(() => filterCars(cars, filters), [cars, filters]);
  const shown = paginate(results, PAGE_SIZE, visible);
  const days = Math.max(1, nightsBetween(initial.pickupDate, initial.dropoffDate) || (initial.pickupDate ? 1 : 0));

  const activeCount =
    filters.categories.length +
    filters.brands.length +
    (filters.maxPrice < carPriceCap ? 1 : 0) +
    (filters.transmission !== "any" ? 1 : 0) +
    (filters.minPassengers > 1 ? 1 : 0) +
    (filters.minBags > 0 ? 1 : 0) +
    (filters.airConditioning ? 1 : 0);

  const update = (patch: Partial<CarFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setVisible(PAGE_SIZE);
  };

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value) q.set(key, value);
    });
    router.push(`/cars?${q.toString()}`);
  };

  const filtersNode = (
    <>
      <CheckboxGroup legend="Category" options={categories} selected={filters.categories} onChange={(next) => update({ categories: next })} />
      <RangeInput
        label="Price per day"
        min={300}
        max={carPriceCap}
        step={50}
        value={filters.maxPrice}
        onChange={(v) => update({ maxPrice: v })}
        format={(v) => formatMoney(v, currency)}
      />
      <Select
        label="Transmission"
        value={filters.transmission}
        onChange={(e) => update({ transmission: e.target.value as CarFilters["transmission"] })}
        options={[
          { value: "any", label: "Any" },
          { value: "Automatic", label: "Automatic" },
          { value: "Manual", label: "Manual" },
        ]}
      />
      <Select
        label="Passengers"
        value={String(filters.minPassengers)}
        onChange={(e) => update({ minPassengers: Number(e.target.value) })}
        options={[
          { value: "1", label: "Any" },
          { value: "4", label: "4 or more" },
          { value: "5", label: "5 or more" },
          { value: "7", label: "7 or more" },
        ]}
      />
      <Select
        label="Bags"
        value={String(filters.minBags)}
        onChange={(e) => update({ minBags: Number(e.target.value) })}
        options={[
          { value: "0", label: "Any" },
          { value: "2", label: "2 or more" },
          { value: "3", label: "3 or more" },
          { value: "4", label: "4 or more" },
        ]}
      />
      <CheckboxGroup
        legend="Comfort"
        options={[{ value: "ac", label: "Air conditioning" }]}
        selected={filters.airConditioning ? ["ac"] : []}
        onChange={(next) => update({ airConditioning: next.includes("ac") })}
      />
      <CheckboxGroup legend="Brand" options={brands} selected={filters.brands} onChange={(next) => update({ brands: next })} />
    </>
  );

  return (
    <div className="space-y-8">
      <form onSubmit={submitSearch} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.3fr_1.3fr_1fr_1fr_auto] xl:items-end">
        <Input label="Pick-up location" value={search.pickup} placeholder="Airport, city or hotel" onChange={(e) => setSearch({ ...search, pickup: e.target.value })} />
        <Input label="Drop-off location" value={search.dropoff} placeholder="Same as pick-up" onChange={(e) => setSearch({ ...search, dropoff: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Pick-up date" type="date" value={search.pickupDate} onChange={(e) => setSearch({ ...search, pickupDate: e.target.value })} />
          <Input label="Time" type="time" value={search.pickupTime} onChange={(e) => setSearch({ ...search, pickupTime: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Drop-off date" type="date" value={search.dropoffDate} onChange={(e) => setSearch({ ...search, dropoffDate: e.target.value })} />
          <Input label="Time" type="time" value={search.dropoffTime} onChange={(e) => setSearch({ ...search, dropoffTime: e.target.value })} />
        </div>
        <Button type="submit" className="w-full xl:w-auto">
          <Search size={16} />
          Search Cars
        </Button>
      </form>

      <FilterLayout
        filters={filtersNode}
        activeCount={activeCount}
        onReset={() => update(defaultFilters)}
        toolbar={
          <>
            <p className="hidden text-sm text-slate-600 md:block" aria-live="polite">
              <span className="font-semibold text-slate-900">{results.length}</span> cars
              {initial.pickupDate ? ` · ${days} day${days > 1 ? "s" : ""}` : ""}
            </p>
            <Select
              label=""
              aria-label="Sort cars"
              className="w-56"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as CarFilters["sort"] })}
              options={[
                { value: "recommended", label: "Recommended" },
                { value: "price-asc", label: "Price: low to high" },
                { value: "price-desc", label: "Price: high to low" },
              ]}
            />
          </>
        }
      >
        {results.length === 0 ? (
          <EmptyState
            title="No cars match these filters"
            description="Try removing a filter or increasing the daily price limit."
            action={
              <Button variant="outline" onClick={() => update(defaultFilters)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((car) => (
                <CarCard key={car.id} car={car} days={initial.pickupDate ? days : undefined} />
              ))}
            </div>
            <LoadMore shown={shown.length} total={results.length} noun="cars" onLoadMore={() => setVisible((v) => v + PAGE_SIZE)} />
          </>
        )}
      </FilterLayout>
    </div>
  );
}
