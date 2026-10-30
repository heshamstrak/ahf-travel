"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError, mediaUrl } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, PageHeader, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn, Thumbnail } from "@/components/admin/DataTable";

interface Destination {
  id: string;
  name: string;
}
interface Hotel {
  id: string;
  slug: string;
  name: string;
  status: string;
  starRating: number;
  propertyType: string;
  destinationName: string;
  roomCount: number;
  updatedAt: string;
  cover: { url: string } | null;
}

const emptyForm = {
  slug: "",
  name: "",
  destinationId: "",
  propertyType: "HOTEL",
  starRating: 4,
  addressLine: "",
  description: "",
  checkInTime: "14:00",
  checkOutTime: "12:00",
};

export default function AdminHotelsPage() {
  const { notify } = useAdminToast();
  const router = useRouter();
  const [items, setItems] = useState<Hotel[] | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<{ items: Hotel[] }>("/admin/hotels", { pageSize: 50 })
      .then((r) => {
        setError(null);
        setItems(r.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  }
  useEffect(load, []);
  useEffect(() => {
    adminApi.get<{ items: Destination[] }>("/admin/destinations", { pageSize: 50 }).then((r) => setDestinations(r.items));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/hotels", { ...form, starRating: Number(form.starRating) });
      notify("success", "Hotel created as draft");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create hotel");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await adminApi.patch(`/admin/hotels/${id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  const columns: DataTableColumn<Hotel>[] = [
    { key: "thumb", header: "", render: (h) => <Thumbnail src={h.cover ? mediaUrl(h.cover.url) : null} alt={h.name} /> },
    { key: "name", header: "Hotel", sortValue: (h) => h.name, render: (h) => <span className="font-medium text-slate-800">{h.name}</span> },
    { key: "destination", header: "Destination", sortValue: (h) => h.destinationName, render: (h) => h.destinationName },
    { key: "propertyType", header: "Type", sortValue: (h) => h.propertyType, render: (h) => h.propertyType },
    { key: "starRating", header: "Stars", sortValue: (h) => h.starRating, render: (h) => `${h.starRating}★` },
    { key: "roomCount", header: "Rooms", sortValue: (h) => h.roomCount, render: (h) => h.roomCount },
    { key: "status", header: "Status", render: (h) => <StatusBadge status={h.status} /> },
    { key: "updatedAt", header: "Updated", sortValue: (h) => h.updatedAt, render: (h) => new Date(h.updatedAt).toLocaleDateString() },
    {
      key: "actions",
      header: "Actions",
      render: (h) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {h.status !== "PUBLISHED" ? (
            <button onClick={() => setStatus(h.id, "PUBLISHED")} className="text-xs font-medium text-brand-700 hover:underline">
              Publish
            </button>
          ) : (
            <button onClick={() => setStatus(h.id, "DRAFT")} className="text-xs font-medium text-slate-500 hover:underline">
              Unpublish
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Hotels" description="Properties, rooms, rate plans and inventory." action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New hotel"}</PrimaryButton>} />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug">
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
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
            <Field label="Property type">
              <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className={inputClass}>
                {["HOTEL", "RESORT", "APARTMENT", "VILLA"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Star rating">
              <input type="number" min={1} max={5} value={form.starRating} onChange={(e) => setForm({ ...form, starRating: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Address">
              <input required value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Check-in time">
              <input required value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} className={inputClass} placeholder="14:00" />
            </Field>
            <Field label="Check-out time">
              <input required value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} className={inputClass} placeholder="12:00" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={3} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create hotel"}
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
            rowKey={(h) => h.id}
            searchableText={(h) => `${h.name} ${h.destinationName} ${h.propertyType}`}
            searchPlaceholder="Search hotels…"
            emptyTitle="No hotels yet"
            onRowClick={(h) => router.push(`/admin/hotels/${h.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
