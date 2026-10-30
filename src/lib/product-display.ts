import type { QuoteProductType } from "@/lib/api/types";
import { formatDate } from "@/lib/dates";

/** Shared across the quote breakdown (checkout) and booking views (My Bookings, booking detail,
 *  success page) — both read the exact same backend-authored "product" snapshot shape. */
export function productTitle(productType: QuoteProductType, product: Record<string, unknown>): string {
  switch (productType) {
    case "HOTEL":
      return (product.hotel as { name?: string } | undefined)?.name ?? "Hotel stay";
    case "TOUR":
      return (product.tour as { title?: string } | undefined)?.title ?? "Tour";
    case "CAR":
      return (product.car as { name?: string } | undefined)?.name ?? "Car rental";
    case "TRANSFER": {
      const origin = (product.origin as { name?: string } | undefined)?.name ?? "Pick-up";
      const destination = (product.destination as { name?: string } | undefined)?.name ?? "Drop-off";
      return `${origin} → ${destination}`;
    }
    case "PACKAGE":
      return (product.package as { title?: string } | undefined)?.title ?? "Package";
    default:
      return "Booking";
  }
}

export function productSubtitle(productType: QuoteProductType, product: Record<string, unknown>): string {
  switch (productType) {
    case "HOTEL": {
      const room = product.room as { name?: string } | undefined;
      const ratePlan = product.ratePlan as { name?: string } | undefined;
      return [room?.name, ratePlan?.name].filter(Boolean).join(" — ");
    }
    case "TOUR": {
      const session = product.session as { startsAt?: string } | undefined;
      return session?.startsAt ? new Date(session.startsAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "";
    }
    case "CAR": {
      const loc = product.pickupLocation as { name?: string } | undefined;
      return loc?.name ? `Pick-up at ${loc.name}` : "";
    }
    case "TRANSFER": {
      const vehicleClass = product.vehicleClass as { name?: string } | undefined;
      return vehicleClass?.name ?? "";
    }
    case "PACKAGE": {
      const departure = product.departure as { startsOn?: string } | undefined;
      return departure?.startsOn ? `Starts ${formatDate(departure.startsOn)}` : "";
    }
    default:
      return "";
  }
}
