"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Eye, MessageCircle, Phone, X, XCircle } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import RowActions from "@/components/admin/RowActions";

type InquiryStatus = "NEW" | "CONTACTED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const STATUSES: ("" | InquiryStatus)[] = ["", "NEW", "CONTACTED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const ALL_STATUSES: InquiryStatus[] = ["NEW", "CONTACTED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const QUICK_STATUSES: InquiryStatus[] = ["CONTACTED", "IN_PROGRESS", "CLOSED"];

/** Public route prefixes used to link an inquiry back to the service it's about. Transfers has no
 *  public detail page (it's a booking-form flow), so it's deliberately absent — its name still
 *  shows, just without a link. */
const PRODUCT_PATHS: Record<string, string> = {
  HOTEL: "/hotels/",
  TOUR: "/tours/",
  CAR: "/cars/",
  PACKAGE: "/packages/",
  CONFERENCE_EVENT: "/conferences-events/",
};

interface InquiryRow {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  message: string;
  productType: string | null;
  productId: string | null;
  serviceName: string | null;
  serviceSlug: string | null;
  locale: string;
  source: string;
  status: InquiryStatus;
  internalNotes: string | null;
  createdAt: string;
}
interface StatusHistoryEntry {
  occurredAt: string;
  actor: string;
  status: string;
  notesChanged: boolean;
}
interface InquiryDetail extends InquiryRow {
  details: Record<string, string> | null;
  customerId: string | null;
  statusHistory: StatusHistoryEntry[];
}
interface ListResponse {
  items: InquiryRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

function serviceHref(row: { productType: string | null; serviceSlug: string | null }): string | null {
  if (!row.productType || !row.serviceSlug) return null;
  const base = PRODUCT_PATHS[row.productType];
  return base ? `${base}${row.serviceSlug}` : null;
}

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

function statusLabel(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function InquiryDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { notify } = useAdminToast();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<InquiryStatus>("NEW");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<InquiryDetail>(`/admin/inquiries/${id}`)
      .then((r) => {
        setInquiry(r);
        setStatus(r.status);
        setNotes(r.internalNotes ?? "");
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load inquiry"));
  }
  useEffect(load, [id]);

  async function quickSetStatus(next: InquiryStatus) {
    try {
      await adminApi.patch(`/admin/inquiries/${id}`, { status: next });
      notify("success", `Marked as ${statusLabel(next).toLowerCase()}`);
      load();
      onChanged();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update inquiry");
    }
  }

  async function save() {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/inquiries/${id}`, { status, internalNotes: notes });
      notify("success", "Inquiry updated");
      load();
      onChanged();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update inquiry");
    } finally {
      setSaving(false);
    }
  }

  const href = inquiry ? serviceHref(inquiry) : null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{inquiry?.name ?? "…"}</h2>
            {inquiry?.email ? <p className="text-sm text-slate-500">{inquiry.email}</p> : null}
            {inquiry?.phone ? <p className="text-sm text-slate-500">{inquiry.phone}</p> : null}
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error ? <ErrorState message={error} /> : null}
        {!error && !inquiry ? <LoadingState /> : null}

        {inquiry ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <a
                href={`tel:${inquiry.phone}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand-400 hover:text-brand-700"
              >
                <Phone size={14} /> Call customer
              </a>
              <a
                href={waLink(inquiry.phone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:border-emerald-400"
              >
                <MessageCircle size={14} /> Open WhatsApp
              </a>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">About</p>
              {inquiry.serviceName ? (
                href ? (
                  <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-medium text-brand-700 hover:underline">
                    {inquiry.productType?.replace(/_/g, " ")}: {inquiry.serviceName}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-slate-700">
                    {inquiry.productType?.replace(/_/g, " ")}: {inquiry.serviceName}
                  </p>
                )
              ) : (
                <p className="mt-1 text-sm text-slate-500">General enquiry (not tied to a specific service)</p>
              )}
            </div>

            {inquiry.details && Object.keys(inquiry.details).length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requested dates / requirements</p>
                <dl className="mt-1 space-y-1 text-sm text-slate-700">
                  {Object.entries(inquiry.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</p>
              <div className="mt-1 rounded-md bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">{inquiry.message || "(no message)"}</div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_STATUSES.filter((s) => s !== inquiry.status).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => quickSetStatus(s)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand-400 hover:text-brand-700"
                  >
                    Mark as {statusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as InquiryStatus)} className={inputClass}>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
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

            {inquiry.statusHistory.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status history</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-500">
                  {inquiry.statusHistory.map((h, i) => (
                    <li key={i}>
                      {new Date(h.occurredAt).toLocaleString()} — {h.actor} set status to {statusLabel(h.status)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminInquiriesPage() {
  const { notify } = useAdminToast();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | InquiryStatus>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  async function quickSetStatus(id: string, next: InquiryStatus) {
    try {
      await adminApi.patch(`/admin/inquiries/${id}`, { status: next });
      notify("success", `Marked as ${statusLabel(next).toLowerCase()}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update inquiry");
    }
  }

  const columns: DataTableColumn<InquiryRow>[] = [
    {
      key: "name",
      header: "From",
      render: (r) => (
        <div>
          <p className="font-medium text-slate-800">{r.name}</p>
          <p className="text-xs text-slate-400">{r.phone}</p>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (r) =>
        r.serviceName ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{r.productType?.replace(/_/g, " ")}</p>
            <p className="text-slate-700">{r.serviceName}</p>
          </div>
        ) : (
          <span className="text-slate-400">General</span>
        ),
    },
    { key: "message", header: "Message", render: (r) => <span className="line-clamp-2 text-slate-600">{r.message || "—"}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", header: "Received", sortValue: (r) => r.createdAt, render: (r) => new Date(r.createdAt).toLocaleString() },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <RowActions
          actions={[
            { key: "view", label: "View", icon: Eye, onClick: () => setSelectedId(r.id) },
            { key: "call", label: "Call customer", icon: Phone, onClick: () => { window.location.href = `tel:${r.phone}`; } },
            { key: "whatsapp", label: "Open WhatsApp", icon: MessageCircle, onClick: () => window.open(waLink(r.phone), "_blank") },
            { key: "contacted", label: "Mark as Contacted", icon: CheckCircle2, hidden: r.status === "CONTACTED", onClick: () => quickSetStatus(r.id, "CONTACTED") },
            { key: "inprogress", label: "Mark as In Progress", icon: Clock, hidden: r.status === "IN_PROGRESS", onClick: () => quickSetStatus(r.id, "IN_PROGRESS") },
            { key: "closed", label: "Mark as Closed", icon: XCircle, hidden: r.status === "CLOSED", onClick: () => quickSetStatus(r.id, "CLOSED") },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Customer Inquiries" description="Request-a-Quote and contact-form enquiries, linked back to the service they're about." />

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
                {s ? statusLabel(s) : "All statuses"}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      {error ? <ErrorState message={error} /> : null}
      {!error ? (
        <Card>
          <DataTable
            columns={columns}
            rows={data?.items ?? null}
            rowKey={(r) => r.id}
            emptyTitle="No inquiries match this filter"
            page={data?.meta.page ?? page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
            onRowClick={(r) => setSelectedId(r.id)}
          />
        </Card>
      ) : null}

      {selectedId ? <InquiryDrawer id={selectedId} onClose={() => setSelectedId(null)} onChanged={load} /> : null}
    </div>
  );
}
