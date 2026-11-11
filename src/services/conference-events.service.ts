import { ConferenceEvent } from "@/data/types";
import { serverGet, serverGetOrNull } from "@/lib/api/server";
import { api } from "@/lib/api/client";
import type { ConferenceEventDetail, ConferenceEventSessionOffer, ConferenceEventSummary, Page } from "@/lib/api/types";
import { FALLBACK_IMAGE } from "@/lib/api/images";
import { addDays, businessToday } from "@/lib/dates";

const MAX_SESSION_WINDOW_DAYS = 365;

function toConferenceEvent(c: ConferenceEventSummary | ConferenceEventDetail): ConferenceEvent {
  const images = "images" in c ? c.images.map((i) => i.url) : c.image ? [c.image.url] : [];
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    venue: c.venue ?? "",
    organizerName: c.organizerName ?? "",
    image: images[0] ?? FALLBACK_IMAGE,
    gallery: images.length > 0 ? images : [FALLBACK_IMAGE],
    description: "description" in c ? c.description : "",
    pricingMode: c.pricingMode,
    startingPrice: c.startingPrice ? Number(c.startingPrice.amount) : null,
  };
}

export async function getConferenceEvents(): Promise<ConferenceEvent[]> {
  const page = await serverGet<Page<ConferenceEventSummary>>("/conference-events", { pageSize: 48 });
  return page.items.map(toConferenceEvent);
}

export async function getConferenceEventById(idOrSlug: string): Promise<ConferenceEvent | null> {
  const detail = await serverGetOrNull<ConferenceEventDetail>(`/conference-events/${idOrSlug}`);
  return detail ? toConferenceEvent(detail) : null;
}

/** Real, bookable sessions for this conference/event, client-side only (booking widget). Defaults
 *  to the full allowed 365-day window so the date picker always has real upcoming options. */
export async function getConferenceEventSessions(idOrSlug: string): Promise<ConferenceEventSessionOffer[]> {
  const from = businessToday();
  const to = addDays(from, MAX_SESSION_WINDOW_DAYS - 1);
  return api.get<ConferenceEventSessionOffer[]>(`/conference-events/${idOrSlug}/sessions`, { from, to });
}
