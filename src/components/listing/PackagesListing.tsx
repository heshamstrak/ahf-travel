"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Destination, TravelPackage } from "@/data/types";
import { filterPackages, PackageFilters, paginate } from "@/lib/listing";
import FilterLayout from "./FilterLayout";
import PackageCard from "@/components/cards/PackageCard";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import LoadMore from "@/components/ui/LoadMore";

const PAGE_SIZE = 6;

export default function PackagesListing(props: { packages: TravelPackage[]; destinations: Destination[] }) {
  const params = useSearchParams();
  return <PackagesResults key={params.toString()} {...props} />;
}

function PackagesResults({ packages, destinations }: { packages: TravelPackage[]; destinations: Destination[] }) {
  const params = useSearchParams();
  const initialDestination = params.get("destination") ?? "";

  const [filters, setFilters] = useState<PackageFilters>({
    destinationId: initialDestination,
    duration: "any",
    budget: "any",
    sort: "recommended",
  });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const results = useMemo(() => filterPackages(packages, filters), [packages, filters]);
  const shown = paginate(results, PAGE_SIZE, visible);
  const activeCount = [filters.destinationId, filters.duration !== "any" ? "d" : "", filters.budget !== "any" ? "b" : ""].filter(Boolean).length;
  const reset = () => setFilters({ destinationId: "", duration: "any", budget: "any", sort: "recommended" });

  const update = (patch: Partial<PackageFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setVisible(PAGE_SIZE);
  };

  const filtersNode = (
    <>
      <Select
        label="Destination"
        value={filters.destinationId}
        onChange={(e) => update({ destinationId: e.target.value })}
        options={[{ value: "", label: "All destinations" }, ...destinations.map((d) => ({ value: d.id, label: d.name }))]}
      />
      <Select
        label="Duration"
        value={filters.duration}
        onChange={(e) => update({ duration: e.target.value as PackageFilters["duration"] })}
        options={[
          { value: "any", label: "Any length" },
          { value: "short", label: "Up to 3 nights" },
          { value: "medium", label: "4 to 6 nights" },
          { value: "long", label: "7+ nights" },
        ]}
      />
      <Select
        label="Budget"
        value={filters.budget}
        onChange={(e) => update({ budget: e.target.value as PackageFilters["budget"] })}
        options={[
          { value: "any", label: "Any budget" },
          { value: "budget", label: "Good value" },
          { value: "mid", label: "Mid-range" },
          { value: "luxury", label: "Luxury" },
        ]}
      />
    </>
  );

  return (
    <FilterLayout
      filters={filtersNode}
      activeCount={activeCount}
      onReset={reset}
      toolbar={
        <>
          <p className="hidden text-sm text-slate-600 sm:block" aria-live="polite">
            <span className="font-semibold text-slate-900">{results.length}</span> packages
          </p>
          <Select
            label=""
            aria-label="Sort packages"
            className="w-56"
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as PackageFilters["sort"] })}
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
          title="No packages match these filters"
          description="Try another destination or a different budget."
          action={
            <Button variant="outline" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
          <LoadMore shown={shown.length} total={results.length} noun="packages" onLoadMore={() => setVisible((v) => v + PAGE_SIZE)} />
        </>
      )}
    </FilterLayout>
  );
}
