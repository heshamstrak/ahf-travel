"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError, mediaUrl } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, PageHeader, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn, Thumbnail } from "@/components/admin/DataTable";
import RowActions from "@/components/admin/RowActions";
import { catalogRowActions } from "@/components/admin/catalogActions";
import { useAdminI18n } from "@/lib/admin/i18n";

interface Destination {
  id: string;
  name: string;
}
interface Policy {
  id: string;
  name: string;
}
interface Tour {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string;
  durationMinutes: number;
  pricePerPerson: string;
  currency: string;
  destinationName: string;
  upcomingSessionCount: number;
  cover: { url: string } | null;
}

const emptyForm = {
  slug: "",
  title: "",
  category: "SIGHTSEEING",
  destinationId: "",
  meetingPoint: "",
  durationMinutes: 180,
  maxGroupSize: 15,
  currency: "EGP",
  pricePerPerson: 500,
  overview: "",
  cancellationPolicyId: "",
};

export default function AdminToursPage() {
  const { notify } = useAdminToast();
  const { t } = useAdminI18n();
  const router = useRouter();
  const [items, setItems] = useState<Tour[] | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<{ items: Tour[] }>("/admin/tours", { pageSize: 50 })
      .then((r) => {
        setError(null);
        setItems(r.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  }
  useEffect(load, []);
  useEffect(() => {
    adminApi.get<{ items: Destination[] }>("/admin/destinations", { pageSize: 50 }).then((r) => setDestinations(r.items));
    adminApi.get<{ items: Policy[] }>("/admin/cancellation-policies", { pageSize: 50 }).then((r) => setPolicies(r.items));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/tours", {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        maxGroupSize: Number(form.maxGroupSize),
        pricePerPerson: Number(form.pricePerPerson),
        itinerary: [{ offsetMinutes: 0, title: "Start", description: form.overview || "Tour begins" }],
      });
      notify("success", "Tour created as draft");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create tour");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await adminApi.patch(`/admin/tours/${id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  const columns: DataTableColumn<Tour>[] = [
    { key: "thumb", header: "", render: (t) => <Thumbnail src={t.cover ? mediaUrl(t.cover.url) : null} alt={t.title} /> },
    { key: "title", header: "Tour", sortValue: (t) => t.title, render: (t) => <span className="font-medium text-slate-800">{t.title}</span> },
    { key: "destination", header: "Destination", sortValue: (t) => t.destinationName, render: (t) => t.destinationName },
    { key: "duration", header: "Duration", sortValue: (t) => t.durationMinutes, render: (t) => `${Math.round(t.durationMinutes / 60)}h` },
    { key: "price", header: "Starting price", sortValue: (t) => Number(t.pricePerPerson), render: (t) => `${t.pricePerPerson} ${t.currency}` },
    { key: "sessions", header: "Upcoming sessions", sortValue: (t) => t.upcomingSessionCount, render: (t) => t.upcomingSessionCount },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <RowActions
          actions={catalogRowActions({
            status: row.status,
            entityLabel: "tour",
            detailHref: () => router.push(`/admin/tours/${row.id}`),
            onSetStatus: (status) => setStatus(row.id, status),
            t,
          })}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Tours" description="Experiences, sessions and pricing." action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New tour"}</PrimaryButton>} />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug">
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Title">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Destination">
              <select required value={form.destinationId} onChange={(e) => setForm({ ...form, destinationId: e.target.value })} className={inputClass}>
                <option value="">Select…</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cancellation policy">
              <select required value={form.cancellationPolicyId} onChange={(e) => setForm({ ...form, cancellationPolicyId: e.target.value })} className={inputClass}>
                <option value="">Select…</option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                {["HISTORY_CULTURE", "DINING_ENTERTAINMENT", "WATER_ACTIVITIES", "SIGHTSEEING"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Meeting point">
              <input required value={form.meetingPoint} onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Duration (minutes)">
              <input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max group size">
              <input type="number" min={1} value={form.maxGroupSize} onChange={(e) => setForm({ ...form, maxGroupSize: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Price per person (EGP)">
              <input type="number" min={0} value={form.pricePerPerson} onChange={(e) => setForm({ ...form, pricePerPerson: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Overview">
                <textarea required value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} className={inputClass} rows={3} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create tour"}
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
            rowKey={(t) => t.id}
            searchableText={(t) => `${t.title} ${t.destinationName} ${t.category}`}
            searchPlaceholder="Search tours…"
            emptyTitle="No tours yet"
            onRowClick={(t) => router.push(`/admin/tours/${t.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
