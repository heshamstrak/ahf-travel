import { Tour } from "@/data/types";
import { serverGet, serverGetOrNull } from "@/lib/api/server";
import { api } from "@/lib/api/client";
import type { Page, TourDetail, TourSessionOffer, TourSummary } from "@/lib/api/types";
import { FALLBACK_IMAGE } from "@/lib/api/images";
import { addDays, businessToday } from "@/lib/dates";

const MAX_SESSION_WINDOW_DAYS = 90;

function toTour(t: TourSummary | TourDetail): Tour {
  const images = "images" in t ? t.images.map((i) => i.url) : t.image ? [t.image.url] : [];
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    category: t.category,
    destinationId: t.destination.id,
    location: t.destination.name,
    image: images[0] ?? FALLBACK_IMAGE,
    gallery: images.length > 0 ? images : [FALLBACK_IMAGE],
    duration: `${Math.round(t.durationMinutes / 60)}h`,
    durationHours: Math.round((t.durationMinutes / 60) * 10) / 10,
    rating: Number(t.rating.average ?? 0),
    reviewCount: t.rating.reviewCount,
    languages: t.languages,
    maxGroupSize: t.maxGroupSize,
    startingPrice: Number(t.fromPricePerPerson.amount),
    overview: "overview" in t ? t.overview : "",
    highlights: "highlights" in t ? t.highlights : [],
    itinerary: "itinerary" in t ? t.itinerary.map((i) => ({ time: i.time, title: i.title, description: i.description })) : [],
    included: "included" in t ? t.included : [],
    excluded: "excluded" in t ? t.excluded : [],
    meetingPoint: t.meetingPoint,
    importantInfo: "importantInfo" in t ? t.importantInfo : [],
    cancellationPolicy: "cancellationPolicy" in t ? t.cancellationPolicy.description : "",
    // Real, bookable sessions are fetched separately (getTourSessions) — these two fields are
    // unused by the rewritten booking widget but kept populated so the Tour type stays intact.
    availableDates: [],
    startTimes: [],
  };
}

export async function getTours(): Promise<Tour[]> {
  const page = await serverGet<Page<TourSummary>>("/tours", { pageSize: 48 });
  return page.items.map(toTour);
}

export async function getTourById(id: string): Promise<Tour | null> {
  const detail = await serverGetOrNull<TourDetail>(`/tours/${id}`);
  return detail ? toTour(detail) : null;
}

/** Real, bookable departures for this tour, each with its own id (the quote/booking productId),
 *  start time and remaining seats. Client-side only (called from the booking widget). Defaults to
 *  the full allowed 90-day window so the date/session picker always has real upcoming options. */
export async function getTourSessions(tourId: string, participants?: number): Promise<TourSessionOffer[]> {
  // Inclusive of both endpoints, so the window spans exactly MAX_SESSION_WINDOW_DAYS calendar days.
  const from = businessToday();
  const to = addDays(from, MAX_SESSION_WINDOW_DAYS - 1);
  return api.get<TourSessionOffer[]>(`/tours/${tourId}/sessions`, { from, to, participants });
}
