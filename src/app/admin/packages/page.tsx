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
interface Pkg {
  id: string;
  slug: string;
  title: string;
  status: string;
  budgetTier: string;
  durationDays: number;
  durationNights: number;
  basePrice: string;
  currency: string;
  destinations: { id: string; name: string }[];
  upcomingDepartureCount: number;
  cover: { url: string } | null;
}

const emptyForm = {
  slug: "",
  title: "",
  overview: "",
  durationNights: 3,
  durationDays: 4,
  budgetTier: "MID",
  pricingBasis: "PER_PERSON",
  currency: "EGP",
  basePrice: 3000,
  maxTravellers: 6,
  cancellationPolicyId: "",
  destinationId: "",
};

export default function AdminPackagesPage() {
  const { notify } = useAdminToast();
  const { t } = useAdminI18n();
  const router = useRouter();
  const [items, setItems] = useState<Pkg[] | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<{ items: Pkg[] }>("/admin/packages", { pageSize: 50 })
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
      const rest: Partial<typeof form> = { ...form };
      delete rest.destinationId;
      await adminApi.post("/admin/packages", {
        ...rest,
        durationNights: Number(form.durationNights),
        durationDays: Number(form.durationDays),
        basePrice: Number(form.basePrice),
        maxTravellers: Number(form.maxTravellers),
        destinationIds: [form.destinationId],
        itinerary: [{ day: 1, title: "Arrival", description: form.overview || "Package begins" }],
      });
      notify("success", "Package created as draft");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create package");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await adminApi.patch(`/admin/packages/${id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  const columns: DataTableColumn<Pkg>[] = [
    { key: "thumb", header: "", render: (p) => <Thumbnail src={p.cover ? mediaUrl(p.cover.url) : null} alt={p.title} /> },
    { key: "title", header: "Package", sortValue: (p) => p.title, render: (p) => <span className="font-medium text-slate-800">{p.title}</span> },
    { key: "destination", header: "Destination", sortValue: (p) => p.destinations[0]?.name ?? "", render: (p) => p.destinations.map((d) => d.name).join(", ") },
    { key: "duration", header: "Duration", sortValue: (p) => p.durationDays, render: (p) => `${p.durationDays}d / ${p.durationNights}n` },
    { key: "price", header: "Starting price", sortValue: (p) => Number(p.basePrice), render: (p) => `${p.basePrice} ${p.currency}` },
    { key: "departures", header: "Departures", sortValue: (p) => p.upcomingDepartureCount, render: (p) => p.upcomingDepartureCount },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <RowActions
          actions={catalogRowActions({
            status: p.status,
            entityLabel: "package",
            detailHref: () => router.push(`/admin/packages/${p.id}`),
            onSetStatus: (status) => setStatus(p.id, status),
            t,
          })}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Packages" description="Multi-day travel packages and departures." action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New package"}</PrimaryButton>} />

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
            <Field label="Budget tier">
              <select value={form.budgetTier} onChange={(e) => setForm({ ...form, budgetTier: e.target.value })} className={inputClass}>
                {["BUDGET", "MID", "LUXURY"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Pricing basis">
              <select value={form.pricingBasis} onChange={(e) => setForm({ ...form, pricingBasis: e.target.value })} className={inputClass}>
                {["PER_PERSON", "PER_ROOM", "PER_PACKAGE"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Nights">
              <input type="number" min={1} value={form.durationNights} onChange={(e) => setForm({ ...form, durationNights: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Days">
              <input type="number" min={1} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Base price (EGP)">
              <input type="number" min={0} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max travellers">
              <input type="number" min={1} value={form.maxTravellers} onChange={(e) => setForm({ ...form, maxTravellers: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Overview">
                <textarea required value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} className={inputClass} rows={3} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create package"}
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
            rowKey={(p) => p.id}
            searchableText={(p) => `${p.title} ${p.destinations.map((d) => d.name).join(" ")}`}
            searchPlaceholder="Search packages…"
            emptyTitle="No packages yet"
            onRowClick={(p) => router.push(`/admin/packages/${p.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
