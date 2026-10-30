"use client";

import { useState } from "react";
import type { BookingStatus } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { BOOKING_STATUS_LABEL } from "@/lib/booking-status";
import { useMyBookings } from "./useBookings";
import BookingCard from "./BookingCard";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonBlock } from "@/components/ui/LoadingSkeleton";

const tabs: { key: "upcoming" | "completed" | "cancelled"; label: string; statuses: BookingStatus[] }[] = [
  { key: "upcoming", label: "Upcoming", statuses: ["PENDING_PAYMENT", "CONFIRMED"] },
  { key: "completed", label: "Completed", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED", "EXPIRED"] },
];

export default function MyBookingsView() {
  const { bookings, loading, error, cancel } = useMyBookings();
  const [tab, setTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const activeStatuses = tabs.find((t) => t.key === tab)!.statuses;
  const filtered = bookings.filter((b) => activeStatuses.includes(b.status));
  const target = bookings.find((b) => b.reference === pendingCancel) ?? null;

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancel(pendingCancel);
      setPendingCancel(null);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : "Could not cancel this booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div role="tablist" aria-label="Booking status" className="mb-8 flex flex-wrap gap-2 rounded-2xl bg-sand-100 p-1.5">
        {tabs.map((t) => {
          const count = bookings.filter((b) => t.statuses.includes(b.status)).length;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none sm:px-6 ${
                tab === t.key ? "bg-white text-brand-800 shadow-sm" : "text-slate-600 hover:text-brand-700"
              }`}
            >
              {t.label} <span className="ms-1 text-xs text-slate-400">({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <SkeletonBlock className="h-40 w-full" />
          <SkeletonBlock className="h-40 w-full" />
        </div>
      ) : error ? (
        <EmptyState title="Could not load your bookings" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${tab} bookings`}
          description={tab === "upcoming" ? "Ready for your next adventure? Explore hotels, tours and packages." : "Nothing to show here yet."}
          action={
            <Button href="/hotels" variant="outline">
              Explore Egypt
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {filtered.map((b) => (
            <BookingCard key={b.reference} booking={b} onCancel={setPendingCancel} />
          ))}
        </div>
      )}

      <Modal
        open={pendingCancel !== null}
        onClose={() => setPendingCancel(null)}
        title="Cancel this booking?"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPendingCancel(null)} disabled={cancelling}>
              Keep booking
            </Button>
            <Button onClick={confirmCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Yes, cancel booking"}
            </Button>
          </div>
        }
      >
        {target ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Reference <span className="font-mono font-semibold text-slate-900">{target.reference}</span> — status {BOOKING_STATUS_LABEL[target.status]}
            </p>
            {cancelError ? <p className="rounded-xl bg-red-50 p-3 text-red-700">{cancelError}</p> : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
