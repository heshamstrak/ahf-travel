import { Suspense } from "react";
import type { Metadata } from "next";
import BookingSuccess from "@/components/booking/BookingSuccess";

export const metadata: Metadata = { title: "Booking confirmed" };

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="pt-32" aria-busy="true" />}>
      <BookingSuccess />
    </Suspense>
  );
}
