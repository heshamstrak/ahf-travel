"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, LoadingState, PageHeader, SecondaryButton, StatusBadge } from "@/components/admin/ui";

interface BookingDetail {
  id: string;
  reference: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  currency: string;
  totals: { subtotal: string; discount: string; surcharge: string; fee: string; tax: string; total: string };
  customer: { firstName: string; lastName: string; email: string; phone: string; countryCode: string; isGuest: boolean };
  specialRequests: string | null;
  holdExpiresAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  items: { productType: string; startsAt: string; endsAt: string; quantity: number; status: string; unitPrice: string; lineTotal: string; product: Record<string, unknown> }[];
  payments: { id: string; method: string; status: string; amount: string; currency: string; transferReference: string | null; createdAt: string }[];
  history: { action: string; actorType: string; actorEmail: string | null; occurredAt: string }[];
}

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useAdminToast();
  const [data, setData] = useState<BookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminApi
      .get<BookingDetail>(`/admin/bookings/${params.id}`)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load booking"));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function cancel() {
    try {
      await adminApi.post(`/admin/bookings/${params.id}/cancel`, {});
      notify("success", "Booking cancelled");
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to cancel booking");
    }
  }

  async function markCashCollected(paymentId: string) {
    try {
      await adminApi.post(`/admin/payments/${paymentId}/cash-collected`);
      notify("success", "Cash recorded as collected");
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to record collection");
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const cancellable = data.status === "PENDING_PAYMENT";

  return (
    <div>
      <PageHeader
        title={data.reference}
        description={`Created ${new Date(data.createdAt).toLocaleString()}`}
        action={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => router.push("/admin/bookings")}>Back to list</SecondaryButton>
            {cancellable && <ConfirmButton label="Cancel booking" confirmLabel="Cancel this booking?" onConfirm={cancel} />}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={data.status} />
              <StatusBadge status={data.paymentStatus} />
              {data.paymentMethod && <StatusBadge status={data.paymentMethod} />}
            </div>
            {data.cancelReason && <p className="mt-3 text-sm text-slate-500">Cancel reason: {data.cancelReason}</p>}
            {data.holdExpiresAt && data.status === "PENDING_PAYMENT" && (
              <p className="mt-3 text-sm text-amber-700">Hold expires {new Date(data.holdExpiresAt).toLocaleString()}</p>
            )}
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-800">Items</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{item.productType}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(item.startsAt).toLocaleDateString()} – {new Date(item.endsAt).toLocaleDateString()} · qty {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={item.status} />
                    <p className="mt-1 text-xs text-slate-500">{item.lineTotal}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-800">Payments</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.payments.length === 0 && <p className="px-5 py-4 text-sm text-slate-400">No payment attempts yet.</p>}
              {data.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{p.method}</p>
                    {p.transferReference && <p className="text-xs text-slate-400">Ref: {p.transferReference}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    {p.method === "CASH" && p.status === "PENDING" && (
                      <ConfirmButton label="Mark collected" confirmLabel="Record this cash as collected?" tone="neutral" onConfirm={() => markCashCollected(p.id)} />
                    )}
                    <div>
                      <StatusBadge status={p.status} />
                      <p className="mt-1 text-xs text-slate-500">
                        {p.amount} {p.currency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-800">History</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2 text-xs text-slate-600">
                  <span>{h.action}</span>
                  <span className="text-slate-400">
                    {h.actorType}
                    {h.actorEmail ? ` · ${h.actorEmail}` : ""} · {new Date(h.occurredAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Customer</h2>
            <p className="text-sm text-slate-700">
              {data.customer.firstName} {data.customer.lastName} {data.customer.isGuest && <span className="text-xs text-slate-400">(guest)</span>}
            </p>
            <p className="text-sm text-slate-500">{data.customer.email}</p>
            <p className="text-sm text-slate-500">{data.customer.phone}</p>
            {data.specialRequests && <p className="mt-3 text-xs text-slate-500">“{data.specialRequests}”</p>}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Pricing breakdown</h2>
            <dl className="space-y-1 text-sm">
              {(["subtotal", "discount", "surcharge", "fee", "tax"] as const).map((k) => (
                <div key={k} className="flex justify-between text-slate-600">
                  <dt className="capitalize">{k}</dt>
                  <dd>{data.totals[k]}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900">
                <dt>Total</dt>
                <dd>
                  {data.totals.total} {data.currency}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
