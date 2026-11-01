"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/admin/api";
import { Card, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/admin/ui";

interface BookingSummary {
  id: string;
  reference: string;
  status: string;
  paymentStatus: string;
  totals: { total: { amount: string }; currency: string };
  createdAt: string;
}
interface CustomerDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  countryCode: string | null;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  bookings: BookingSummary[];
  bookingsMeta: { total: number };
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .get<CustomerDetail>(`/admin/customers/${params.id}`)
      .then((r) => {
        setError(null);
        setCustomer(r);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load customer"));
  }, [params.id]);

  if (error) return <ErrorState message={error} />;
  if (!customer) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        description={customer.email}
        action={<StatusBadge status={customer.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{customer.phone ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email verified</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{customer.emailVerifiedAt ? "Yes" : "No"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Member since</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{new Date(customer.createdAt).toLocaleDateString()}</p>
        </Card>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Recent bookings ({customer.bookingsMeta.total})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {customer.bookings.length === 0 && <p className="p-5 text-sm text-slate-400">No bookings yet.</p>}
          {customer.bookings.map((b) => (
            <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50">
              <div>
                <p className="font-medium text-slate-800">{b.reference}</p>
                <p className="text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={b.status} />
                <p className="mt-1 text-xs text-slate-500">
                  {b.totals.total.amount} {b.totals.currency}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
