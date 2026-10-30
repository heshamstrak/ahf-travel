"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError, mediaUrl } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, PageHeader, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn, Thumbnail } from "@/components/admin/DataTable";

interface Destination {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  status: string;
  isFeatured: boolean;
  relatedProductCount: number;
  cover: { url: string } | null;
}

const emptyForm = { slug: "", name: "", countryCode: "EG", description: "" };

export default function AdminDestinationsPage() {
  const { notify } = useAdminToast();
  const router = useRouter();
  const [items, setItems] = useState<Destination[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<{ items: Destination[] }>("/admin/destinations", { pageSize: 50 })
      .then((r) => setItems(r.items))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/destinations", form);
      notify("success", "Destination created as draft");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create destination");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await adminApi.patch(`/admin/destinations/${id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  const columns: DataTableColumn<Destination>[] = [
    { key: "thumb", header: "", render: (d) => <Thumbnail src={d.cover ? mediaUrl(d.cover.url) : null} alt={d.name} /> },
    { key: "name", header: "Name", sortValue: (d) => d.name, render: (d) => <span className="font-medium text-slate-800">{d.name}{d.isFeatured ? " ★" : ""}</span> },
    { key: "slug", header: "Slug", sortValue: (d) => d.slug, render: (d) => d.slug },
    { key: "related", header: "Related products", sortValue: (d) => d.relatedProductCount, render: (d) => d.relatedProductCount },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {d.status !== "PUBLISHED" ? (
            <button onClick={() => setStatus(d.id, "PUBLISHED")} className="text-xs font-medium text-brand-700 hover:underline">
              Publish
            </button>
          ) : (
            <button onClick={() => setStatus(d.id, "DRAFT")} className="text-xs font-medium text-slate-500 hover:underline">
              Unpublish
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Destinations" description="Cities and regions shown across the catalogue." action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New destination"}</PrimaryButton>} />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug">
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="cairo" />
            </Field>
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Country code">
              <input required value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value.toUpperCase() })} className={inputClass} maxLength={2} />
            </Field>
            <Field label="Description" hint="Optional">
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create destination"}
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
            rowKey={(d) => d.id}
            searchableText={(d) => `${d.name} ${d.slug}`}
            searchPlaceholder="Search destinations…"
            emptyTitle="No destinations yet"
            onRowClick={(d) => router.push(`/admin/destinations/${d.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
