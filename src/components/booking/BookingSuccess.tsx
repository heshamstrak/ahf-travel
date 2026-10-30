"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Printer, Search } from "lucide-react";
import type { BookingView, PaymentView } from "@/lib/api/types";
import { formatExact } from "@/lib/currency";
import { PAYMENT_STATUS_LABEL } from "@/lib/booking-status";
import Button from "@/components/ui/Button";
import { getBooking, listBookingPayments } from "@/services/bookings.service";
import BookingDetailView from "./BookingDetailView";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonBlock } from "@/components/ui/LoadingSkeleton";

export default function BookingSuccess() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "";
  const email = params.get("email") ?? undefined;
  const [booking, setBooking] = useState<BookingView | null | undefined>(undefined);
  const [payments, setPayments] = useState<PaymentView[]>([]);

  const load = () => {
    Promise.all([getBooking(ref, email), listBookingPayments(ref, email).catch(() => [])]).then(([b, p]) => {
      setBooking(b);
      setPayments(p);
    });
  };

  useEffect(() => {
    Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, email]);

  if (booking === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-32 sm:px-6" aria-busy="true">
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-80 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-32 sm:px-6">
        <EmptyState
          title="We could not find that booking"
          description="Check the reference in your confirmation email, or view all your bookings."
          icon={<Search size={24} />}
          action={
            <div className="flex gap-3">
              <Button href="/my-bookings">My Bookings</Button>
              <Button href="/" variant="outline">
                Back to Home
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const isPaid = booking.paymentStatus === "PAID";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 px-6 py-12 text-center text-white sm:px-12">
        <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-gold-300">
            <CheckCircle2 size={34} />
          </span>
          <h1 className="mt-5 font-display text-3xl font-medium sm:text-4xl">Your booking is confirmed</h1>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            A confirmation has been sent to {booking.customer.email}. Keep your reference handy for check-in.
          </p>
          <div className="mx-auto mt-8 inline-flex flex-col items-center rounded-2xl bg-white/10 px-8 py-4 backdrop-blur-sm">
            <span className="text-xs uppercase tracking-widest text-brand-200">Booking reference</span>
            <span className="font-mono text-2xl font-semibold tracking-wider">{booking.reference}</span>
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-brand-100">{isPaid ? "Total paid" : "Total due"}</p>
            <span className="font-display text-3xl font-semibold">{formatExact(booking.totals.total, booking.totals.currency)}</span>
            <span className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold ${isPaid ? "bg-emerald-400/20 text-emerald-100" : "bg-gold-400/20 text-gold-100"}`}>
              {PAYMENT_STATUS_LABEL[booking.paymentStatus]}
            </span>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href={`/my-bookings/${booking.reference}${email ? `?email=${encodeURIComponent(email)}` : ""}`} variant="primary">
              View Booking
            </Button>
            <Button href="/" variant="ghost">
              Back to Home
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-10 flex justify-end">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline">
          <Printer size={16} /> Print or save voucher
        </button>
      </div>

      <div className="mt-4">
        <BookingDetailView booking={booking} payments={payments} email={email} onPaymentCompleted={load} />
      </div>
    </div>
  );
}
