"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError, mediaUrl } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, PageHeader, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn, Thumbnail } from "@/components/admin/DataTable";
import RowActions from "@/components/admin/RowActions";
import { catalogRowActions } from "@/components/admin/catalogActions";

type PricingMode = "FIXED_PRICE" | "CONTACT_FOR_PRICE";

interface ConferenceEventRow {
  id: string;
  slug: string;
  name: string;
  venue: string | null;
  organizerName: string | null;
  status: string;
  pricingMode: PricingMode;
  basePrice: string | null;
  currency: string | null;
  upcomingSessionCount: number;
  cover: { url: string } | null;
}

const emptyForm = {
  slug: "",
  name: "",
  description: "",
  venue: "",
  organizerName: "",
  pricingMode: "FIXED_PRICE" as PricingMode,
  basePrice: 5000,
  currency: "EGP",
};

export default function AdminConferenceEventsPage() {
  const { notify } = useAdminToast();
  const router = useRouter();
  const [items, setItems] = useState<ConferenceEventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<{ items: ConferenceEventRow[] }>("/admin/conference-events", { pageSize: 50 })
      .then((r) => {
        setError(null);
        setItems(r.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/conference-events", {
        slug: form.slug,
        name: form.name,
        description: form.description,
        venue: form.venue || undefined,
        organizerName: form.organizerName || undefined,
        pricingMode: form.pricingMode,
        ...(form.pricingMode === "FIXED_PRICE" ? { basePrice: Number(form.basePrice), currency: form.currency } : {}),
      });
      notify("success", "Conference/event created as draft");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await adminApi.patch(`/admin/conference-events/${id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  const columns: DataTableColumn<ConferenceEventRow>[] = [
    { key: "thumb", header: "", render: (r) => <Thumbnail src={r.cover ? mediaUrl(r.cover.url) : null} alt={r.name} /> },
    { key: "name", header: "Name", sortValue: (r) => r.name, render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: "venue", header: "Venue", render: (r) => r.venue ?? "—" },
    { key: "organizer", header: "Organizer", render: (r) => r.organizerName ?? "—" },
    {
      key: "price",
      header: "Price",
      render: (r) => (r.pricingMode === "FIXED_PRICE" && r.basePrice ? `${r.basePrice} ${r.currency}` : "Contact for price"),
    },
    { key: "sessions", header: "Upcoming sessions", sortValue: (r) => r.upcomingSessionCount, render: (r) => r.upcomingSessionCount },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <RowActions
          actions={catalogRowActions({
            status: r.status,
            entityLabel: "conference/event",
            detailHref: () => router.push(`/admin/conferences-events/${r.id}`),
            onSetStatus: (status) => setStatus(r.id, status),
          })}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Conferences & Events"
        description="Corporate events, conferences and group bookings."
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New conference/event"}</PrimaryButton>}
      />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" hint="Lowercase letters, numbers and hyphens only">
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="cairo-travel-summit-2026" />
            </Field>
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Venue" hint="Optional">
              <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Organizer" hint="Optional">
              <input value={form.organizerName} onChange={(e) => setForm({ ...form, organizerName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Pricing">
              <select value={form.pricingMode} onChange={(e) => setForm({ ...form, pricingMode: e.target.value as PricingMode })} className={inputClass}>
                <option value="FIXED_PRICE">Fixed price</option>
                <option value="CONTACT_FOR_PRICE">Contact for price</option>
              </select>
            </Field>
            {form.pricingMode === "FIXED_PRICE" && (
              <Field label="Base price (EGP)">
                <input type="number" min={0} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} className={inputClass} />
              </Field>
            )}
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={3} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {error && <ErrorState message={error} />}
      {!error && (
        <Card>
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(r) => r.id}
            searchableText={(r) => `${r.name} ${r.venue ?? ""} ${r.organizerName ?? ""}`}
            searchPlaceholder="Search conferences & events…"
            emptyTitle="No conferences or events yet"
            onRowClick={(r) => router.push(`/admin/conferences-events/${r.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
