"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError, mediaUrl } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, PageHeader, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn, Thumbnail } from "@/components/admin/DataTable";

interface Policy {
  id: string;
  name: string;
}
interface CarModel {
  id: string;
  slug: string;
  brand: string;
  name: string;
  status: string;
  category: string;
  transmission: string;
  passengers: number;
  pricePerDay: string;
  currency: string;
  cover: { url: string } | null;
}

const emptyForm = {
  slug: "",
  brand: "",
  name: "",
  category: "ECONOMY",
  transmission: "AUTOMATIC",
  passengers: 4,
  bags: 2,
  doors: 4,
  includedKmPerDay: 200,
  minDriverAge: 21,
  currency: "EGP",
  pricePerDay: 500,
  depositAmount: 1000,
  cancellationPolicyId: "",
};

export default function AdminCarsPage() {
  const { notify } = useAdminToast();
  const router = useRouter();
  const [items, setItems] = useState<CarModel[] | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<{ items: CarModel[] }>("/admin/cars", { pageSize: 50 })
      .then((r) => {
        setError(null);
        setItems(r.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  }
  useEffect(load, []);
  useEffect(() => {
    adminApi.get<{ items: Policy[] }>("/admin/cancellation-policies", { pageSize: 50 }).then((r) => setPolicies(r.items));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/cars", {
        ...form,
        passengers: Number(form.passengers),
        bags: Number(form.bags),
        doors: Number(form.doors),
        includedKmPerDay: Number(form.includedKmPerDay),
        minDriverAge: Number(form.minDriverAge),
        pricePerDay: Number(form.pricePerDay),
        depositAmount: Number(form.depositAmount),
      });
      notify("success", "Car model created as draft");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create car model");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await adminApi.patch(`/admin/cars/${id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  const columns: DataTableColumn<CarModel>[] = [
    { key: "thumb", header: "", render: (c) => <Thumbnail src={c.cover ? mediaUrl(c.cover.url) : null} alt={c.name} /> },
    { key: "name", header: "Brand / model", sortValue: (c) => `${c.brand} ${c.name}`, render: (c) => <span className="font-medium text-slate-800">{c.brand} {c.name}</span> },
    { key: "category", header: "Category", sortValue: (c) => c.category, render: (c) => c.category },
    { key: "transmission", header: "Transmission", sortValue: (c) => c.transmission, render: (c) => c.transmission },
    { key: "passengers", header: "Passengers", sortValue: (c) => c.passengers, render: (c) => c.passengers },
    { key: "price", header: "Starting price", sortValue: (c) => Number(c.pricePerDay), render: (c) => `${c.pricePerDay} ${c.currency}/day` },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {c.status !== "PUBLISHED" ? (
            <button onClick={() => setStatus(c.id, "PUBLISHED")} className="text-xs font-medium text-brand-700 hover:underline">
              Publish
            </button>
          ) : (
            <button onClick={() => setStatus(c.id, "DRAFT")} className="text-xs font-medium text-slate-500 hover:underline">
              Unpublish
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Cars" description="Rental fleet, categories and pricing." action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New car model"}</PrimaryButton>} />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-3">
            <Field label="Slug">
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Brand">
              <input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Model name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                {["ECONOMY", "COMPACT", "SUV", "PREMIUM_SUV", "LUXURY"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Transmission">
              <select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} className={inputClass}>
                {["AUTOMATIC", "MANUAL"].map((t) => (
                  <option key={t}>{t}</option>
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
            <Field label="Passengers">
              <input type="number" min={1} value={form.passengers} onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Bags">
              <input type="number" min={0} value={form.bags} onChange={(e) => setForm({ ...form, bags: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Doors">
              <input type="number" min={1} value={form.doors} onChange={(e) => setForm({ ...form, doors: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Included km/day">
              <input type="number" min={0} value={form.includedKmPerDay} onChange={(e) => setForm({ ...form, includedKmPerDay: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Min driver age">
              <input type="number" min={18} value={form.minDriverAge} onChange={(e) => setForm({ ...form, minDriverAge: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Price per day (EGP)">
              <input type="number" min={0} value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Deposit (EGP)">
              <input type="number" min={0} value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create car model"}
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
            rowKey={(c) => c.id}
            searchableText={(c) => `${c.brand} ${c.name} ${c.category}`}
            searchPlaceholder="Search cars…"
            emptyTitle="No car models yet"
            onRowClick={(c) => router.push(`/admin/cars/${c.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
