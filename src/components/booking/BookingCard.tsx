import { Printer, XCircle } from "lucide-react";
import type { BookingView } from "@/lib/api/types";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE, PRODUCT_TYPE_LABEL, isCancellable } from "@/lib/booking-status";
import { productTitle, productSubtitle } from "@/lib/product-display";
import { formatDateRange } from "@/lib/dates";
import { formatExact } from "@/lib/currency";
import Button from "@/components/ui/Button";

export default function BookingCard({ booking, onCancel }: { booking: BookingView; onCancel: (reference: string) => void }) {
  const item = booking.items[0];
  const title = item ? productTitle(item.productType, item.product) : booking.reference;
  const subtitle = item ? productSubtitle(item.productType, item.product) : "";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {item ? <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{PRODUCT_TYPE_LABEL[item.productType]}</span> : null}
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BOOKING_STATUS_STYLE[booking.status]}`}>{BOOKING_STATUS_LABEL[booking.status]}</span>
        <span className="ms-auto text-xs text-slate-500">Ref {booking.reference}</span>
      </div>
      <h2 className="mt-2 font-display text-lg font-medium text-slate-900">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      {item ? <p className="text-sm text-slate-500">{formatDateRange(item.startsAt, item.endsAt)}</p> : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="font-semibold text-slate-900">{formatExact(booking.totals.total, booking.totals.currency)}</span>
        <div className="flex flex-wrap gap-2">
          <Button href={`/my-bookings/${booking.reference}`} size="sm" variant="outline">
            View Details
          </Button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Printer size={15} /> Voucher
          </button>
          {isCancellable(booking.status) ? (
            <button
              type="button"
              onClick={() => onCancel(booking.reference)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <XCircle size={15} /> Cancel
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
