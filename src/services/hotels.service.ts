import { Hotel, HotelPropertyType, Room } from "@/data/types";
import { serverGet, serverGetOrNull } from "@/lib/api/server";
import type { HotelDetail, HotelSummary, Page, PublicRoom } from "@/lib/api/types";
import { FALLBACK_IMAGE } from "@/lib/api/images";

const PROPERTY_TYPE_LABEL: Record<string, HotelPropertyType> = {
  HOTEL: "Hotel",
  RESORT: "Resort",
  APARTMENT: "Apartment",
  VILLA: "Villa",
};

function toHotel(h: HotelSummary | HotelDetail): Hotel {
  const images = "images" in h ? h.images.map((i) => i.url) : h.image ? [h.image.url] : [];
  return {
    id: h.id,
    slug: h.slug,
    name: h.name,
    destinationId: h.destination.id,
    location: h.destination.name,
    propertyType: PROPERTY_TYPE_LABEL[h.propertyType] ?? "Hotel",
    image: images[0] ?? FALLBACK_IMAGE,
    gallery: images.length > 0 ? images : [FALLBACK_IMAGE],
    description: "description" in h ? h.description : "",
    starRating: h.starRating,
    guestRating: Number(h.guestRating.average ?? 0),
    reviewCount: h.guestRating.reviewCount,
    amenities: h.amenities,
    pricePerNight: Number(h.fromPricePerNight?.amount ?? 0),
    priceAvailable: h.fromPricePerNight !== null,
    cancellationPolicy: "Cancellation terms vary by rate plan — see room options for details.",
  };
}

/** The backend's own search/filter/sort/pagination (Milestone 2), not a client-side re-filter of
 *  a bulk fetch — query params map 1:1 onto GET /hotels. */
export interface HotelSearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  stars?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function searchHotels(params: HotelSearchParams = {}): Promise<{ items: Hotel[]; total: number; totalPages: number }> {
  const page = await serverGet<Page<HotelSummary>>("/hotels", { ...params, pageSize: params.pageSize ?? 48 });
  return { items: page.items.map(toHotel), total: page.meta.total, totalPages: page.meta.totalPages };
}

export async function getHotels(): Promise<Hotel[]> {
  return (await searchHotels()).items;
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const detail = await serverGetOrNull<HotelDetail>(`/hotels/${id}`);
  return detail ? toHotel(detail) : null;
}

/** Each (room × rate plan) pair becomes one sellable "Room" entry, id = rate plan id — exactly the
 *  productId the quote API expects for a HOTEL selection. A room with three rate plans (flexible,
 *  non-refundable, breakfast-included…) shows as three options, which is also the more honest
 *  representation: price and refundability genuinely differ per rate plan, not per physical room. */
export async function getRoomsForHotel(hotelId: string): Promise<Room[]> {
  const rooms = await serverGet<PublicRoom[]>(`/hotels/${hotelId}/rooms`);
  const out: Room[] = [];
  for (const room of rooms) {
    const image = room.images[0]?.url ?? FALLBACK_IMAGE;
    for (const rate of room.ratePlans) {
      out.push({
        id: rate.id,
        hotelId,
        name: `${room.name} — ${rate.name}`,
        image,
        capacity: room.maxAdults + room.maxChildren,
        bedType: room.bedType,
        sizeSqm: room.sizeSqm ?? 0,
        amenities: room.features,
        pricePerNight: Number(rate.basePricePerNight),
        refundable: rate.isRefundable,
      });
    }
  }
  return out;
}
