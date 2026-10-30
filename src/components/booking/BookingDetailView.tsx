import type { BookingView, PaymentView } from "@/lib/api/types";
import { formatDate } from "@/lib/dates";
import { formatExact } from "@/lib/currency";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE, PAYMENT_STATE_LABEL, PAYMENT_STATUS_LABEL, PRODUCT_TYPE_LABEL } from "@/lib/booking-status";
import { productSubtitle, productTitle } from "@/lib/product-display";
import PaymentPanel from "./PaymentPanel";

interface BookingDetailViewProps {
  booking: BookingView;
  payments: PaymentView[];
  /** Guest email, required to let a guest resubmit or complete payment from this page. */
  email?: string;
  onPaymentCompleted: () => void;
}

export default function BookingDetailView({ booking, payments, email, onPaymentCompleted }: BookingDetailViewProps) {
  const item = booking.items[0];
  const title = item ? productTitle(item.productType, item.product) : booking.reference;
  const subtitle = item ? productSubtitle(item.productType, item.product) : "";
  const latestPayment = payments[0] ?? null;
  const needsPayment = booking.status === "PENDING_PAYMENT" && (!latestPayment || latestPayment.status === "REJECTED");

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {item ? <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{PRODUCT_TYPE_LABEL[item.productType]}</span> : null}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BOOKING_STATUS_STYLE[booking.status]}`}>{BOOKING_STATUS_LABEL[booking.status]}</span>
          </div>
          <h1 className="font-display text-2xl font-medium text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
          <p className="text-sm text-slate-500">
            Booking reference <span className="font-mono font-semibold text-slate-800">{booking.reference}</span>
          </p>
        </section>

        {item ? (
          <Section title="Dates & travellers">
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Starts" value={formatDate(item.startsAt)} />
              <Field label="Ends" value={formatDate(item.endsAt)} />
              <Field label="Quantity" value={String(item.quantity)} />
              {item.adults !== null ? <Field label="Adults" value={String(item.adults)} /> : null}
              {item.children !== null && item.children > 0 ? <Field label="Children" value={String(item.children)} /> : null}
            </dl>
          </Section>
        ) : null}

        <Section title="Customer details">
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <Field label="Name" value={`${booking.customer.firstName} ${booking.customer.lastName}`} />
            <Field label="Email" value={booking.customer.email} />
            <Field label="Phone" value={booking.customer.phone} />
            <Field label="Country" value={booking.customer.countryCode} />
            {booking.specialRequests ? <Field label="Special requests" value={booking.specialRequests} /> : null}
          </dl>
        </Section>

        {booking.cancelledAt ? (
          <Section title="Cancellation">
            <p className="text-sm text-slate-700">Cancelled on {formatDate(booking.cancelledAt)}.</p>
            {booking.cancelReason ? <p className="mt-1 text-sm text-slate-500">Reason: {booking.cancelReason}</p> : null}
          </Section>
        ) : null}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-medium text-slate-900">Price breakdown</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row label="Subtotal" amount={booking.totals.subtotal} currency={booking.totals.currency} />
            {Number(booking.totals.tax) > 0 ? <Row label="Tax" amount={booking.totals.tax} currency={booking.totals.currency} /> : null}
            {Number(booking.totals.fee) > 0 ? <Row label="Service fee" amount={booking.totals.fee} currency={booking.totals.currency} /> : null}
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-display text-xl font-semibold text-slate-900">{formatExact(booking.totals.total, booking.totals.currency)}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-medium text-slate-900">Payment</h2>
          <p className="mt-3 text-sm font-semibold text-slate-900">{PAYMENT_STATUS_LABEL[booking.paymentStatus]}</p>
          {latestPayment ? (
            <p className="mt-1 text-sm text-slate-600">
              {latestPayment.method === "CASH" ? "Cash" : latestPayment.method === "INSTAPAY" ? "InstaPay" : latestPayment.method} — {PAYMENT_STATE_LABEL[latestPayment.status]}
            </p>
          ) : null}
        </section>

        {needsPayment ? (
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-medium text-slate-900">{latestPayment?.status === "REJECTED" ? "Resubmit payment" : "Complete payment"}</h2>
            <PaymentPanel booking={booking} email={email} rejectionReason={latestPayment?.status === "REJECTED" ? latestPayment.rejectionReason : null} onCompleted={onPaymentCompleted} />
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-display text-lg font-medium text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function Row({ label, amount, currency }: { label: string; amount: string; currency: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-medium text-slate-900">{formatExact(amount, currency)}</dd>
    </div>
  );
}
