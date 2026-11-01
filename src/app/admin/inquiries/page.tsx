"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, PageHeader, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import RowActions from "@/components/admin/RowActions";
import { Eye } from "lucide-react";

type InquiryStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface InquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  productType: string | null;
  productId: string | null;
  locale: string;
  source: string;
  status: InquiryStatus;
  internalNotes: string | null;
  createdAt: string;
}
interface ListResponse {
  items: InquiryRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

const STATUSES: ("" | InquiryStatus)[] = ["", "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function InquiryDrawer({ inquiry, onClose, onSaved }: { inquiry: InquiryRow; onClose: () => void; onSaved: () => void }) {
  const { notify } = useAdminToast();
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [notes, setNotes] = useState(inquiry.internalNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/inquiries/${inquiry.id}`, { status, internalNotes: notes });
      notify("success", "Inquiry updated");
      onSaved();
      onClose();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update inquiry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{inquiry.name}</h2>
            <p className="text-sm text-slate-500">{inquiry.email}</p>
            {inquiry.phone && <p className="text-sm text-slate-500">{inquiry.phone}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {inquiry.productType && (
            <p className="text-xs text-slate-500">
              About: {inquiry.productType} ({inquiry.productId})
            </p>
          )}
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">{inquiry.message}</div>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as InquiryStatus)} className={inputClass}>
              {(["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"] as InquiryStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Internal notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={4} />
          </Field>
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default function AdminInquiriesPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | InquiryStatus>("NEW");
  const [selected, setSelected] = useState<InquiryRow | null>(null);

  function load() {
    adminApi
      .get<ListResponse>("/admin/inquiries", { page, status: status || undefined })
      .then((r) => {
        setError(null);
        setData(r);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load inquiries"));
  }
  useEffect(load, [page, status]);

  const columns: DataTableColumn<InquiryRow>[] = [
    { key: "name", header: "From", render: (r) => (
      <div>
        <p className="font-medium text-slate-800">{r.name}</p>
        <p className="text-xs text-slate-400">{r.email}</p>
      </div>
    ) },
    { key: "message", header: "Message", render: (r) => <span className="line-clamp-2 text-slate-600">{r.message}</span> },
    { key: "product", header: "About", render: (r) => (r.productType ? r.productType : "General") },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", header: "Received", sortValue: (r) => r.createdAt, render: (r) => new Date(r.createdAt).toLocaleString() },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => <RowActions actions={[{ key: "view", label: "View", icon: Eye, onClick: () => setSelected(r) }]} />,
    },
  ];

  return (
    <div>
      <PageHeader title="Customer Inquiries" description="Contact-form submissions and Request-a-Quote enquiries." />

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as "" | InquiryStatus);
            }}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? s.replace("_", " ") : "All statuses"}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      {error && <ErrorState message={error} />}
      {!error && (
        <Card>
          <DataTable
            columns={columns}
            rows={data?.items ?? null}
            rowKey={(r) => r.id}
            emptyTitle="No inquiries match this filter"
            page={data?.meta.page ?? page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
            onRowClick={(r) => setSelected(r)}
          />
        </Card>
      )}

      {selected && <InquiryDrawer inquiry={selected} onClose={() => setSelected(null)} onSaved={load} />}
    </div>
  );
}
