import { Car, Hotel, Tour, TravelPackage } from "@/data/types";

export type HotelSort = "recommended" | "price-asc" | "price-desc" | "rating" | "stars";
export type TourSort = "recommended" | "price-asc" | "price-desc" | "rating";
export type CarSort = "recommended" | "price-asc" | "price-desc";
export type PackageSort = "recommended" | "price-asc" | "price-desc";

export interface HotelFilters {
  destinationId: string;
  maxPrice: number;
  stars: number[];
  minGuestRating: number;
  amenities: string[];
  propertyTypes: string[];
  sort: HotelSort;
}

export interface TourFilters {
  destinationId: string;
  categories: string[];
  maxPrice: number;
  durations: ("short" | "half" | "full")[];
  minRating: number;
  sort: TourSort;
}

export interface CarFilters {
  categories: string[];
  maxPrice: number;
  transmission: "any" | "Automatic" | "Manual";
  minPassengers: number;
  minBags: number;
  airConditioning: boolean;
  brands: string[];
  sort: CarSort;
}

export interface PackageFilters {
  destinationId: string;
  duration: "any" | "short" | "medium" | "long";
  budget: "any" | "budget" | "mid" | "luxury";
  sort: PackageSort;
}

export const hotelPriceCap = 10000;
export const tourPriceCap = 2000;
export const carPriceCap = 2500;
export const packagePriceCap = 30000;

export function filterHotels(items: Hotel[], f: HotelFilters): Hotel[] {
  const result = items.filter(
    (h) =>
      (!f.destinationId || h.destinationId === f.destinationId) &&
      h.pricePerNight <= f.maxPrice &&
      (f.stars.length === 0 || f.stars.includes(h.starRating)) &&
      h.guestRating >= f.minGuestRating &&
      f.amenities.every((a) => h.amenities.includes(a)) &&
      (f.propertyTypes.length === 0 || f.propertyTypes.includes(h.propertyType))
  );
  return sortBy(result, f.sort, {
    "price-asc": (h) => h.pricePerNight,
    "price-desc": (h) => -h.pricePerNight,
    rating: (h) => -h.guestRating,
    stars: (h) => -h.starRating,
  });
}

export function filterTours(items: Tour[], f: TourFilters): Tour[] {
  const result = items.filter((t) => {
    const durationOk =
      f.durations.length === 0 ||
      f.durations.some((d) =>
        d === "short" ? t.durationHours <= 3 : d === "half" ? t.durationHours > 3 && t.durationHours <= 6 : t.durationHours > 6
      );
    // CONTACT_FOR_PRICE items have no price to compare against a price slider — a filter the
    // visitor set along a dimension that simply doesn't apply to them must never hide them.
    const priceOk = t.startingPrice === null || t.startingPrice <= f.maxPrice;
    return (
      (!f.destinationId || t.destinationId === f.destinationId) &&
      (f.categories.length === 0 || f.categories.includes(t.category)) &&
      priceOk &&
      durationOk &&
      t.rating >= f.minRating
    );
  });
  return sortBy(result, f.sort, {
    "price-asc": (t) => t.startingPrice ?? Infinity,
    "price-desc": (t) => -(t.startingPrice ?? Infinity),
    rating: (t) => -t.rating,
  });
}

export function filterCars(items: Car[], f: CarFilters): Car[] {
  const result = items.filter(
    (c) =>
      (f.categories.length === 0 || f.categories.includes(c.category)) &&
      (c.pricePerDay === null || c.pricePerDay <= f.maxPrice) &&
      (f.transmission === "any" || c.transmission === f.transmission) &&
      c.passengers >= f.minPassengers &&
      c.bags >= f.minBags &&
      (!f.airConditioning || c.airConditioning) &&
      (f.brands.length === 0 || f.brands.includes(c.brand))
  );
  return sortBy(result, f.sort, {
    "price-asc": (c) => c.pricePerDay ?? Infinity,
    "price-desc": (c) => -(c.pricePerDay ?? Infinity),
  });
}

export function filterPackages(items: TravelPackage[], f: PackageFilters): TravelPackage[] {
  const result = items.filter((p) => {
    const durationOk =
      f.duration === "any" ||
      (f.duration === "short" && p.durationNights <= 3) ||
      (f.duration === "medium" && p.durationNights > 3 && p.durationNights <= 6) ||
      (f.duration === "long" && p.durationNights > 6);
    return (
      (!f.destinationId || p.destinationIds.includes(f.destinationId)) &&
      durationOk &&
      (f.budget === "any" || p.budgetTier === f.budget)
    );
  });
  return sortBy(result, f.sort, {
    "price-asc": (p) => p.startingPrice ?? Infinity,
    "price-desc": (p) => -(p.startingPrice ?? Infinity),
  });
}

function sortBy<T>(items: T[], sort: string, keys: Record<string, (item: T) => number>): T[] {
  const key = keys[sort];
  if (!key) return items;
  return [...items].sort((a, b) => key(a) - key(b));
}

export function paginate<T>(items: T[], pageSize: number, visibleCount: number): T[] {
  return items.slice(0, Math.max(pageSize, visibleCount));
}
