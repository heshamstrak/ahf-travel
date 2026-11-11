import { PackageDay, TravelPackage } from "@/data/types";
import { serverGet, serverGetOrNull } from "@/lib/api/server";
import { api } from "@/lib/api/client";
import type { DepartureOffer, Page, PackageDetail, PackageSummary } from "@/lib/api/types";
import { FALLBACK_IMAGE } from "@/lib/api/images";
import { addDays, businessToday } from "@/lib/dates";

const MAX_DEPARTURE_WINDOW_DAYS = 365;

function toItinerary(items: { day: number; title: string; description: string }[]): PackageDay[] {
  return items.map((i) => ({ day: i.day, title: i.title, description: i.description }));
}

function toPackage(p: PackageSummary | PackageDetail): TravelPackage {
  const images = "images" in p ? p.images.map((i) => i.url) : p.image ? [p.image.url] : [];
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    destinationIds: p.destinations.map((d) => d.id),
    cities: p.destinations.map((d) => d.name),
    image: images[0] ?? FALLBACK_IMAGE,
    gallery: images.length > 0 ? images : [FALLBACK_IMAGE],
    duration: `${p.durationDays} days / ${p.durationNights} nights`,
    durationNights: p.durationNights,
    budgetTier: p.budgetTier.toLowerCase() as TravelPackage["budgetTier"],
    overview: "overview" in p ? p.overview : "",
    hotel: "components" in p ? p.components.hotel ?? { name: "", stars: 0, description: "" } : { name: "", stars: 0, description: "" },
    toursIncluded: "components" in p ? p.components.tours : [],
    transfersIncluded: "components" in p ? p.components.transfers : [],
    itinerary: "itinerary" in p ? toItinerary(p.itinerary) : [],
    included: "included" in p ? p.included : [],
    excluded: "excluded" in p ? p.excluded : [],
    pricingMode: p.pricingMode,
    startingPrice: p.startingPrice ? Number(p.startingPrice.amount) : null,
    availableDates: [],
  };
}

export interface PackageSearchParams {
  destination?: string;
  duration?: "any" | "short" | "medium" | "long";
  budget?: "any" | "budget" | "mid" | "luxury";
  date?: string;
  travellers?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function searchPackages(params: PackageSearchParams = {}): Promise<{ items: TravelPackage[]; total: number; totalPages: number }> {
  const page = await serverGet<Page<PackageSummary>>("/packages", { ...params, pageSize: params.pageSize ?? 48 });
  return { items: page.items.map(toPackage), total: page.meta.total, totalPages: page.meta.totalPages };
}

export async function getPackages(): Promise<TravelPackage[]> {
  return (await searchPackages()).items;
}

export async function getPackageById(id: string): Promise<TravelPackage | null> {
  const detail = await serverGetOrNull<PackageDetail>(`/packages/${id}`);
  return detail ? toPackage(detail) : null;
}

/** Real, bookable departures, each with its own id (the quote/booking productId — packageDepartureId)
 *  and remaining traveller capacity. Client-side only (booking widget). Defaults to the full allowed
 *  365-day window. */
export async function getPackageDepartures(packageId: string, travellers?: number): Promise<DepartureOffer[]> {
  // Inclusive of both endpoints, so the window spans exactly MAX_DEPARTURE_WINDOW_DAYS calendar days.
  const from = businessToday();
  const to = addDays(from, MAX_DEPARTURE_WINDOW_DAYS - 1);
  return api.get<DepartureOffer[]>(`/packages/${packageId}/departures`, { from, to, travellers });
}
