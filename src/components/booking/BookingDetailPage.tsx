"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer, XCircle } from "lucide-react";
import type { BookingView, PaymentView } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { getBooking, cancelBooking, listBookingPayments } from "@/services/bookings.service";
import { isCancellable } from "@/lib/booking-status";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonBlock } from "@/components/ui/LoadingSkeleton";
import BookingDetailView from "./BookingDetailView";

export default function BookingDetailPage({ reference, email }: { reference: string; email?: string }) {
  const [booking, setBooking] = useState<BookingView | null | undefined>(undefined);
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const load = () => {
    Promise.all([getBooking(reference, email), listBookingPayments(reference, email).catch(() => [])]).then(([b, p]) => {
      setBooking(b);
      setPayments(p);
    });
  };

  useEffect(() => {
    Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, email]);

  if (booking === undefined) {
    return (
      <div className="space-y-6" aria-busy="true">
        <SkeletonBlock className="h-64 w-full" />
        <SkeletonBlock className="h-96 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <EmptyState
        title="Booking not found"
        description={`We could not find a booking with reference ${reference}.`}
        action={
          <Button href="/my-bookings" variant="outline">
            Back to My Bookings
          </Button>
        }
      />
    );
  }

  const cancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await cancelBooking(reference, { email });
      setBooking(updated);
      setConfirming(false);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : "Could not cancel this booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My Bookings", href: "/my-bookings" }, { label: booking.reference }]} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer size={15} /> Download voucher
          </Button>
          {isCancellable(booking.status) ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              <XCircle size={15} /> Cancel booking
            </button>
          ) : null}
        </div>
      </div>

      <BookingDetailView booking={booking} payments={payments} email={email} onPaymentCompleted={load} />

      <Link href="/my-bookings" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft size={16} /> All bookings
      </Link>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Cancel this booking?"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={cancelling}>
              Keep booking
            </Button>
            <Button onClick={cancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Yes, cancel booking"}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm text-slate-700">
          <p>This will release your held inventory and cannot be undone.</p>
          {cancelError ? <p className="rounded-xl bg-red-50 p-3 text-red-700">{cancelError}</p> : null}
        </div>
      </Modal>
    </>
  );
}
