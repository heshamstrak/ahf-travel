"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { Card, ErrorState, Field, inputClass, PageHeader, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import RowActions from "@/components/admin/RowActions";

interface CustomerRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  bookingCount: number;
}
interface ListResponse {
  items: CustomerRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQ(qInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    adminApi
      .get<ListResponse>("/admin/customers", { page, search: q || undefined })
      .then((r) => {
        setError(null);
        setData(r);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load customers"));
  }, [page, q]);

  const columns: DataTableColumn<CustomerRow>[] = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <div>
          <p className="font-medium text-slate-800">
            {c.firstName} {c.lastName}
          </p>
          <p className="text-xs text-slate-400">{c.email}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (c) => c.phone ?? "—" },
    { key: "verified", header: "Email verified", render: (c) => (c.emailVerifiedAt ? "Yes" : "No") },
    { key: "bookings", header: "Bookings", sortValue: (c) => c.bookingCount, render: (c) => c.bookingCount },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
    { key: "createdAt", header: "Joined", sortValue: (c) => c.createdAt, render: (c) => new Date(c.createdAt).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => <RowActions actions={[{ key: "view", label: "View", icon: Eye, onClick: () => router.push(`/admin/customers/${c.id}`) }]} />,
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" description="Registered customer accounts and their booking history." />

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <Field label="Search">
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Name or email…" className={`${inputClass} w-64`} />
        </Field>
      </Card>

      {error && <ErrorState message={error} />}
      {!error && (
        <Card>
          <DataTable
            columns={columns}
            rows={data?.items ?? null}
            rowKey={(c) => c.id}
            emptyTitle="No customers match this search"
            page={data?.meta.page ?? page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
            onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
