"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CalendarClock, Car, Hotel, Map, Package, PauseCircle, TimerOff, Wallet, Bus, XCircle } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { Card, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/admin/ui";
import { BarLineChart, DonutBreakdown } from "@/components/admin/Charts";
import KpiCard from "@/components/admin/KpiCard";

interface DashboardData {
  bookings: { total: number; confirmed: number; pending: number; cancelled: number; expired: number; today: number };
  catalogue: { hotels: number; tours: number; cars: number; transfers: number; packages: number };
  payments: { pendingInstapayVerifications: number; outstandingCashCollections: { count: number; amount: string } };
  financials: { confirmedBookingValue: string; collectedRevenue: string; currency: string };
  recentBookings: { id: string; reference: string; status: string; paymentStatus: string; total: string; currency: string; customerEmail: string; createdAt: string }[];
  pendingPaymentReviews: { id: string; bookingId: string; amount: string; currency: string; transferReference: string | null; proofSubmittedAt: string | null }[];
}
interface Analytics {
  currency: string;
  bookingsOverTime: { date: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  categoryBreakdown: { productType: string; count: number }[];
  revenueOverTime: { date: string; amount: string }[];
  paymentMethodBreakdown: { cash: string; instapay: string };
}

type RangeKey = "today" | "7d" | "30d" | "custom";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function rangeFor(key: RangeKey, customFrom: string, customTo: string): { from: string; to: string } {
  const today = new Date();
  if (key === "today") return { from: isoDate(today), to: isoDate(today) };
  if (key === "7d") return { from: isoDate(new Date(today.getTime() - 6 * 86_400_000)), to: isoDate(today) };
  if (key === "30d") return { from: isoDate(new Date(today.getTime() - 29 * 86_400_000)), to: isoDate(today) };
  return { from: customFrom, to: customTo };
}
function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState<RangeKey>("7d");
  const [customFrom, setCustomFrom] = useState(() => isoDate(new Date(Date.now() - 6 * 86_400_000)));
  const [customTo, setCustomTo] = useState(() => isoDate(new Date()));

  useEffect(() => {
    adminApi
      .get<DashboardData>("/admin/dashboard")
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load dashboard"));
  }, []);

  useEffect(() => {
    const { from, to } = rangeFor(rangeKey, customFrom, customTo);
    if (!from || !to) return;
    Promise.resolve()
      .then(() => {
        setAnalytics(null);
        setAnalyticsError(null);
        return adminApi.get<Analytics>("/admin/dashboard/analytics", { from, to });
      })
      .then(setAnalytics)
      .catch((e) => setAnalyticsError(e instanceof ApiError ? e.message : "Failed to load analytics"));
  }, [rangeKey, customFrom, customTo]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Dashboard" description="Live figures straight from the database." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total bookings" value={data.bookings.total} icon={CalendarCheck} />
        <KpiCard label="Today" value={data.bookings.today} icon={CalendarClock} />
        <KpiCard label="Confirmed" value={data.bookings.confirmed} icon={CalendarCheck} />
        <KpiCard label="Pending" value={data.bookings.pending} icon={PauseCircle} />
        <KpiCard label="Cancelled" value={data.bookings.cancelled} icon={XCircle} />
        <KpiCard label="Expired" value={data.bookings.expired} icon={TimerOff} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Hotels" value={data.catalogue.hotels} icon={Hotel} />
        <KpiCard label="Tours" value={data.catalogue.tours} icon={Map} />
        <KpiCard label="Cars" value={data.catalogue.cars} icon={Car} />
        <KpiCard label="Transfer routes" value={data.catalogue.transfers} icon={Bus} />
        <KpiCard label="Packages" value={data.catalogue.packages} icon={Package} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <KpiCard
          label="Confirmed booking value"
          value={`${data.financials.confirmedBookingValue} ${data.financials.currency}`}
          icon={Wallet}
        />
        <KpiCard
          label="Revenue actually collected"
          value={`${data.financials.collectedRevenue} ${data.financials.currency}`}
          icon={Wallet}
        />
        <KpiCard
          label={`Outstanding cash (${data.payments.outstandingCashCollections.count} booking${data.payments.outstandingCashCollections.count === 1 ? "" : "s"})`}
          value={`${data.payments.outstandingCashCollections.amount} ${data.financials.currency}`}
          icon={Wallet}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">Analytics</h2>
        <div className="flex flex-wrap items-center gap-2">
          {(["today", "7d", "30d", "custom"] as RangeKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setRangeKey(k)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${rangeKey === k ? "bg-brand-700 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {k === "today" ? "Today" : k === "7d" ? "7 Days" : k === "30d" ? "30 Days" : "Custom"}
            </button>
          ))}
          {rangeKey === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            </>
          )}
        </div>
      </div>

      {analyticsError && <ErrorState message={analyticsError} />}
      {!analyticsError && !analytics && <LoadingState />}
      {!analyticsError && analytics && (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Bookings over time</h3>
            <BarLineChart points={analytics.bookingsOverTime.map((p) => ({ label: shortDate(p.date), value: p.count }))} />
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Revenue collected over time ({analytics.currency})</h3>
            <BarLineChart points={analytics.revenueOverTime.map((p) => ({ label: shortDate(p.date), value: Number(p.amount) }))} color="#c9962c" formatValue={(v) => v.toLocaleString("en-US")} />
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Booking status distribution</h3>
            <DonutBreakdown segments={analytics.statusDistribution.map((s) => ({ label: s.status.replace(/_/g, " "), value: s.count }))} />
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Bookings by product category</h3>
            <DonutBreakdown segments={analytics.categoryBreakdown.map((c) => ({ label: c.productType, value: c.count }))} />
          </Card>
          <Card className="p-5 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Cash vs InstaPay (collected revenue)</h3>
            <DonutBreakdown
              segments={[
                { label: "Cash", value: Number(analytics.paymentMethodBreakdown.cash) },
                { label: "InstaPay", value: Number(analytics.paymentMethodBreakdown.instapay) },
              ]}
            />
          </Card>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Recent bookings</h2>
            <Link href="/admin/bookings" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentBookings.length === 0 && <p className="p-5 text-sm text-slate-400">No bookings yet.</p>}
            {data.recentBookings.map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-800">{b.reference}</p>
                  <p className="text-xs text-slate-400">{b.customerEmail}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={b.status} />
                  <p className="mt-1 text-xs text-slate-500">
                    {b.total} {b.currency}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Pending InstaPay reviews ({data.payments.pendingInstapayVerifications})</h2>
            <Link href="/admin/payments" className="text-xs font-medium text-brand-600 hover:underline">
              Review
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.pendingPaymentReviews.length === 0 && <p className="p-5 text-sm text-slate-400">Nothing waiting for review.</p>}
            {data.pendingPaymentReviews.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{p.transferReference ?? "—"}</p>
                  <p className="text-xs text-slate-400">{p.proofSubmittedAt ? new Date(p.proofSubmittedAt).toLocaleString() : ""}</p>
                </div>
                <p className="font-medium text-slate-700">
                  {p.amount} {p.currency}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
