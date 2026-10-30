import { Car, CarTransmission } from "@/data/types";
import { serverGet, serverGetOrNull } from "@/lib/api/server";
import type { CarDetail, CarSummary, Page } from "@/lib/api/types";
import { FALLBACK_IMAGE } from "@/lib/api/images";

const TRANSMISSION_LABEL: Record<string, CarTransmission> = {
  AUTOMATIC: "Automatic",
  MANUAL: "Manual",
};

function toCar(c: CarSummary | CarDetail): Car {
  const images = "images" in c ? c.images.map((i) => i.url) : c.image ? [c.image.url] : [];
  return {
    id: c.id,
    name: c.name,
    brand: c.brand,
    category: c.category,
    image: images[0] ?? FALLBACK_IMAGE,
    gallery: images.length > 0 ? images : [FALLBACK_IMAGE],
    passengers: c.passengers,
    bags: c.bags,
    doors: c.doors,
    transmission: TRANSMISSION_LABEL[c.transmission] ?? "Automatic",
    airConditioning: c.hasAirConditioning,
    pricePerDay: Number(c.pricePerDay.amount),
    mileageIncluded: "includedKmPerDay" in c ? `${c.includedKmPerDay} km/day` : "",
    fuelPolicy: "fuelPolicy" in c ? c.fuelPolicy : "",
    depositEGP: "deposit" in c ? Number(c.deposit.amount) : 0,
    insurance: "coverage" in c ? c.coverage : [],
    rentalConditions: "rentalConditions" in c ? c.rentalConditions : [],
    pickupInfo: "pickupNotes" in c ? (c.pickupNotes ?? "") : "",
  };
}

export interface CarSearchParams {
  pickupDate?: string;
  dropoffDate?: string;
  driverAge?: number;
  categories?: string[];
  transmission?: string;
  minPassengers?: number;
  minBags?: number;
  airConditioning?: boolean;
  brands?: string[];
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function searchCars(params: CarSearchParams = {}): Promise<{ items: Car[]; total: number; totalPages: number }> {
  const page = await serverGet<Page<CarSummary>>("/cars", { ...params, pageSize: params.pageSize ?? 48 });
  return { items: page.items.map(toCar), total: page.meta.total, totalPages: page.meta.totalPages };
}

export async function getCars(): Promise<Car[]> {
  return (await searchCars()).items;
}

export async function getCarById(id: string): Promise<Car | null> {
  const detail = await serverGetOrNull<CarDetail>(`/cars/${id}`);
  return detail ? toCar(detail) : null;
}
