import type { Metadata } from "next";
import BookingDetailPage from "@/components/booking/BookingDetailPage";

export const metadata: Metadata = { title: "Booking details", robots: { index: false, follow: false } };

export default async function MyBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { id } = await params;
  const { email } = await searchParams;
  return (
    <div className="mx-auto max-w-8xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <BookingDetailPage reference={id} email={email} />
    </div>
  );
}
