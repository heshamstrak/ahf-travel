"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { Destination, Tour } from "@/data/types";
import { filterTours, paginate, TourFilters, tourPriceCap } from "@/lib/listing";
import { useApp } from "@/context/AppProvider";
import { formatMoney } from "@/lib/currency";
import FilterLayout from "./FilterLayout";
import TourCard from "@/components/cards/TourCard";
import CheckboxGroup from "@/components/ui/CheckboxGroup";
import RangeInput from "@/components/ui/RangeInput";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadMore from "@/components/ui/LoadMore";
import Stepper from "@/components/ui/Stepper";

const PAGE_SIZE = 6;

const defaultFilters = (destinationId: string): TourFilters => ({
  destinationId,
  categories: [],
  maxPrice: tourPriceCap,
  durations: [],
  minRating: 0,
  sort: "recommended",
});

export default function ToursListing(props: { tours: Tour[]; destinations: Destination[] }) {
  const params = useSearchParams();
  return <ToursResults key={params.toString()} {...props} />;
}

function ToursResults({ tours, destinations }: { tours: Tour[]; destinations: Destination[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { currency } = useApp();

  const initial = {
    destination: params.get("destination") ?? "",
    date: params.get("date") ?? "",
    guests: Number(params.get("guests") ?? 2) || 2,
  };

  const [search, setSearch] = useState(initial);
  const [filters, setFilters] = useState<TourFilters>(defaultFilters(initial.destination));
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(() => [...new Set(tours.map((t) => t.category))].map((c) => ({ value: c, label: c })), [tours]);
  const results = useMemo(() => filterTours(tours, filters), [tours, filters]);
  const shown = paginate(results, PAGE_SIZE, visible);
  const destinationName = destinations.find((d) => d.id === initial.destination)?.name;

  const activeCount =
    filters.categories.length + filters.durations.length + (filters.maxPrice < tourPriceCap ? 1 : 0) + (filters.minRating > 0 ? 1 : 0);

  const update = (patch: Partial<TourFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setVisible(PAGE_SIZE);
  };

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (search.destination) q.set("destination", search.destination);
    if (search.date) q.set("date", search.date);
    q.set("guests", String(search.guests));
    router.push(`/tours?${q.toString()}`);
  };

  const filtersNode = (
    <>
      <CheckboxGroup legend="Category" options={categories} selected={filters.categories} onChange={(next) => update({ categories: next })} />
      <RangeInput
        label="Price per person"
        min={200}
        max={tourPriceCap}
        step={50}
        value={filters.maxPrice}
        onChange={(v) => update({ maxPrice: v })}
        format={(v) => formatMoney(v, currency)}
      />
      <CheckboxGroup
        legend="Duration"
        options={[
          { value: "short", label: "Up to 3 hours" },
          { value: "half", label: "3 to 6 hours" },
          { value: "full", label: "Full day (6+ hours)" },
        ]}
        selected={filters.durations}
        onChange={(next) => update({ durations: next as TourFilters["durations"] })}
      />
      <Select
        label="Rating"
        value={String(filters.minRating)}
        onChange={(e) => update({ minRating: Number(e.target.value) })}
        options={[
          { value: "0", label: "Any rating" },
          { value: "4.5", label: "4.5+ stars" },
          { value: "4.8", label: "4.8+ stars" },
        ]}
      />
    </>
  );

  return (
    <div className="space-y-8">
      <form onSubmit={submitSearch} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_auto_auto] xl:items-end">
        <Select
          label="Destination"
          value={search.destination}
          onChange={(e) => setSearch({ ...search, destination: e.target.value })}
          options={[{ value: "", label: "All destinations" }, ...destinations.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <Input label="Date" type="date" value={search.date} onChange={(e) => setSearch({ ...search, date: e.target.value })} />
        <div className="flex items-center rounded-xl border border-slate-200 px-4 py-2.5">
          <Stepper label="Guests" value={search.guests} min={1} max={20} onChange={(v) => setSearch({ ...search, guests: v })} />
        </div>
        <Button type="submit" className="w-full xl:w-auto">
          <Search size={16} />
          Find Experiences
        </Button>
      </form>

      <FilterLayout
        filters={filtersNode}
        activeCount={activeCount}
        onReset={() => update(defaultFilters(filters.destinationId))}
        toolbar={
          <>
            <p className="hidden text-sm text-slate-600 sm:block" aria-live="polite">
              <span className="font-semibold text-slate-900">{results.length}</span> experiences
              {destinationName ? ` in ${destinationName}` : ""}
            </p>
            <Select
              label=""
              aria-label="Sort experiences"
              className="w-56"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as TourFilters["sort"] })}
              options={[
                { value: "recommended", label: "Recommended" },
                { value: "price-asc", label: "Price: low to high" },
                { value: "price-desc", label: "Price: high to low" },
                { value: "rating", label: "Top rated" },
              ]}
            />
          </>
        }
      >
        {results.length === 0 ? (
          <EmptyState
            title="No experiences match these filters"
            description="Try a different category or raise the price limit."
            action={
              <Button variant="outline" onClick={() => setFilters(defaultFilters(filters.destinationId))}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
            <LoadMore shown={shown.length} total={results.length} noun="experiences" onLoadMore={() => setVisible((v) => v + PAGE_SIZE)} />
          </>
        )}
      </FilterLayout>
    </div>
  );
}
