import { api, ApiError } from "@/lib/api/client";
import type { BookingView, Page, PaymentView } from "@/lib/api/types";

/** The backend caps pageSize at 50 (MAX_PAGE_SIZE) for every paginated list endpoint. */
export async function listMyBookings(status?: string): Promise<BookingView[]> {
  const page = await api.get<Page<BookingView>>("/bookings/mine", { status, pageSize: 50 });
  return page.items;
}

export async function getBooking(idOrReference: string, email?: string): Promise<BookingView | null> {
  try {
    return await api.get<BookingView>(`/bookings/${idOrReference}`, email ? { email } : undefined);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function cancelBooking(idOrReference: string, opts: { email?: string; reason?: string } = {}): Promise<BookingView> {
  return api.post<BookingView>(`/bookings/${idOrReference}/cancel`, opts);
}

export async function listBookingPayments(idOrReference: string, email?: string): Promise<PaymentView[]> {
  return api.get<PaymentView[]>(`/bookings/${idOrReference}/payments`, email ? { email } : undefined);
}
