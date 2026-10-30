"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi, ApiError } from "@/lib/admin/api";
import { Card, ErrorState, inputClass, LoadingState, PageHeader, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";

interface BookingRow {
  id: string;
  reference: string;
  status: string;
  paymentStatus: string;
  total: string;
  currency: string;
  customerEmail: string;
  productTypes: string[];
  createdAt: string;
}
interface ListResponse {
  items: BookingRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

const STATUSES = ["", "PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED", "EXPIRED"];
const PRODUCT_TYPES = ["", "HOTEL", "TOUR", "CAR", "TRANSFER", "PACKAGE"];

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminBookingsPageInner />
    </Suspense>
  );
}

function AdminBookingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reference, setReference] = useState(searchParams.get("reference") ?? "");
  const [status, setStatus] = useState("");
  const [productType, setProductType] = useState("");

  useEffect(() => {
    adminApi
      .get<ListResponse>("/admin/bookings", { page, reference: reference || undefined, status: status || undefined, productType: productType || undefined })
      .then((r) => {
        setError(null);
        setData(r);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load bookings"));
  }, [page, reference, status, productType]);

  const columns: DataTableColumn<BookingRow>[] = [
    { key: "reference", header: "Reference", render: (b) => <span className="font-medium text-brand-700">{b.reference}</span> },
    { key: "customer", header: "Customer", render: (b) => <span className="text-slate-600">{b.customerEmail}</span> },
    { key: "product", header: "Product", render: (b) => <span className="text-slate-600">{b.productTypes.join(", ")}</span> },
    { key: "status", header: "Status", render: (b) => <StatusBadge status={b.status} /> },
    { key: "payment", header: "Payment", render: (b) => <StatusBadge status={b.paymentStatus} /> },
    { key: "total", header: "Total", sortValue: (b) => Number(b.total), render: (b) => <span className="font-medium text-slate-800">{b.total} {b.currency}</span> },
    { key: "createdAt", header: "Created", sortValue: (b) => b.createdAt, render: (b) => new Date(b.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="Bookings" description="Every booking, searchable and filterable." />

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Reference</label>
          <input
            value={reference}
            onChange={(e) => {
              setPage(1);
              setReference(e.target.value);
            }}
            placeholder="EB-..."
            className={`${inputClass} w-48`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className={`${inputClass} w-44`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || "Any status"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Product</label>
          <select
            value={productType}
            onChange={(e) => {
              setPage(1);
              setProductType(e.target.value);
            }}
            className={`${inputClass} w-40`}
          >
            {PRODUCT_TYPES.map((p) => (
              <option key={p} value={p}>
                {p || "Any product"}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {error && <ErrorState message={error} />}
      {!error && (
        <Card>
          <DataTable
            columns={columns}
            rows={data?.items ?? null}
            rowKey={(b) => b.id}
            emptyTitle="No bookings match these filters"
            page={data?.meta.page ?? page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
            onRowClick={(b) => router.push(`/admin/bookings/${b.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
