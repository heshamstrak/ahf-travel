"use client";

import { useEffect, useState } from "react";
import type { BookingView } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { cancelBooking, getBooking, listMyBookings } from "@/services/bookings.service";

export async function findBooking(reference: string, email?: string): Promise<BookingView | null> {
  return getBooking(reference, email);
}

/** Signed-in only — guests have no persistent identity to list bookings by (see GET /bookings/mine). */
export function useMyBookings() {
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    setError(null);
    listMyBookings()
      .then(setBookings)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your bookings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(reload);
  }, []);

  const cancel = async (reference: string, reason?: string) => {
    const updated = await cancelBooking(reference, { reason });
    setBookings((prev) => prev.map((b) => (b.reference === reference ? updated : b)));
  };

  return { bookings, loading, error, cancel, reload };
}
