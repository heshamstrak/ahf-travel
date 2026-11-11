"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, TagListInput } from "@/components/admin/ui";
import ImageManager from "@/components/admin/ImageManager";

type PricingMode = "FIXED_PRICE" | "CONTACT_FOR_PRICE";

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}
interface Pkg {
  id: string;
  title: string;
  status: string;
  overview: string;
  durationNights: number;
  durationDays: number;
  budgetTier: string;
  basePrice: string;
  currency: string;
  pricingMode: PricingMode;
  singleSupplement: string | null;
  childPrice: string | null;
  extraPersonPrice: string | null;
  minTravellers: number;
  maxTravellers: number;
  cancellationPolicyId: string;
  itinerary: ItineraryDay[];
  included: string[];
  excluded: string[];
  destinations: { id: string; name: string }[];
}
interface Departure {
  id: string;
  startsOn: string;
  capacity: number;
  heldTravellers: number;
  bookedTravellers: number;
  status: string;
}
interface Policy {
  id: string;
  name: string;
}
interface Destination {
  id: string;
  name: string;
}

const BUDGET_TIERS = ["BUDGET", "MID", "LUXURY"];

interface PackagePatch {
  title?: string;
  overview?: string;
  durationNights?: number;
  durationDays?: number;
  budgetTier?: string;
  basePrice?: number;
  pricingMode?: PricingMode;
  singleSupplement?: number;
  childPrice?: number;
  extraPersonPrice?: number;
  minTravellers?: number;
  maxTravellers?: number;
  cancellationPolicyId?: string;
  itinerary?: ItineraryDay[];
  included?: string[];
  excluded?: string[];
  destinationIds?: string[];
}

function ItineraryEditor({ days, onChange }: { days: ItineraryDay[]; onChange: (next: ItineraryDay[]) => void }) {
  const add = () => onChange([...days, { day: days.length + 1, title: "", description: "" }]);
  const update = (i: number, patch: Partial<ItineraryDay>) => onChange(days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const remove = (i: number) => onChange(days.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {days.map((d, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[80px_1fr_1fr_auto]">
          <Field label="Day">
            <input type="number" min={1} value={d.day} onChange={(e) => update(i, { day: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Title">
            <input value={d.title} onChange={(e) => update(i, { title: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Description">
            <input value={d.description} onChange={(e) => update(i, { description: e.target.value })} className={inputClass} />
          </Field>
          <div className="flex items-end">
            <button type="button" onClick={() => remove(i)} className="rounded-md p-2 text-red-500 hover:bg-red-50" aria-label="Remove day">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <SecondaryButton type="button" onClick={add}>
        <Plus size={14} /> Add day
      </SecondaryButton>
    </div>
  );
}

function DestinationPicker({ selected, options, onChange }: { selected: string[]; options: Destination[]; onChange: (next: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((d) => {
        const active = selected.includes(d.id);
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(active ? selected.filter((id) => id !== d.id) : [...selected, d.id])}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${active ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {d.name}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminPackageDetailPage() {
  const params = useParams<{ id: string }>();
  const { notify } = useAdminToast();
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newDeparture, setNewDeparture] = useState({ startsOn: "", capacity: 10 });
  const [capacityDrafts, setCapacityDrafts] = useState<Record<string, number>>({});
  const [showEdit, setShowEdit] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [editForm, setEditForm] = useState<PackagePatch>({});
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<Pkg & { departures: Departure[] }>(`/admin/packages/${params.id}`)
      .then((r) => {
        setError(null);
        setPkg(r);
        setDepartures(r.departures);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load package"));
  }
  useEffect(() => {
    load();
    adminApi.get<{ items: Policy[] }>("/admin/cancellation-policies", { pageSize: 50 }).then((r) => setPolicies(r.items));
    adminApi.get<{ items: Destination[] }>("/admin/destinations", { pageSize: 50 }).then((r) => setDestinations(r.items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function setPkgStatus(status: string) {
    try {
      await adminApi.patch(`/admin/packages/${params.id}/status`, { status });
      notify("success", `Package ${status.toLowerCase()}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update package");
    }
  }

  async function deletePkg() {
    try {
      await adminApi.delete(`/admin/packages/${params.id}`);
      notify("success", "Package archived");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete (it may have active bookings)");
    }
  }

  async function savePkg(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.patch(`/admin/packages/${params.id}`, editForm);
      notify("success", "Package updated");
      setShowEdit(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update package");
    } finally {
      setSaving(false);
    }
  }

  async function createDeparture(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.post(`/admin/packages/${params.id}/departures`, { startsOn: newDeparture.startsOn, capacity: Number(newDeparture.capacity) });
      notify("success", "Departure created");
      setNewDeparture({ startsOn: "", capacity: 10 });
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create departure");
    }
  }

  async function applyCapacity(departureId: string) {
    const capacity = capacityDrafts[departureId];
    if (capacity === undefined) return;
    try {
      await adminApi.patch(`/admin/packages/${params.id}/departures/${departureId}/capacity`, { capacity });
      notify("success", "Capacity updated");
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Capacity cannot go below places already held or booked");
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!pkg) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pkg.title}
        description={`${pkg.durationDays}d/${pkg.durationNights}n · ${pkg.budgetTier} · ${pkg.pricingMode === "FIXED_PRICE" ? `${pkg.basePrice} ${pkg.currency}` : "Contact for price"}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={pkg.status} />
            {pkg.status !== "PUBLISHED" ? <SecondaryButton onClick={() => setPkgStatus("PUBLISHED")}>Publish</SecondaryButton> : <SecondaryButton onClick={() => setPkgStatus("DRAFT")}>Unpublish</SecondaryButton>}
            <SecondaryButton
              onClick={() => {
                setEditForm({});
                setShowEdit((v) => !v);
              }}
            >
              {showEdit ? "Close" : "Edit details"}
            </SecondaryButton>
            <SecondaryButton onClick={() => setShowImages((v) => !v)}>{showImages ? "Hide images" : "Images"}</SecondaryButton>
            <ConfirmButton label="Delete package" confirmLabel="Archive this package?" onConfirm={deletePkg} />
          </div>
        }
      />

      {showEdit && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Edit package details</h2>
          <form onSubmit={savePkg} className="grid gap-4 sm:grid-cols-3">
            <Field label="Title">
              <input defaultValue={pkg.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Budget tier">
              <select defaultValue={pkg.budgetTier} onChange={(e) => setEditForm({ ...editForm, budgetTier: e.target.value })} className={inputClass}>
                {BUDGET_TIERS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Cancellation policy">
              <select defaultValue={pkg.cancellationPolicyId} onChange={(e) => setEditForm({ ...editForm, cancellationPolicyId: e.target.value })} className={inputClass}>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nights">
              <input type="number" min={1} defaultValue={pkg.durationNights} onChange={(e) => setEditForm({ ...editForm, durationNights: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Days">
              <input type="number" min={1} defaultValue={pkg.durationDays} onChange={(e) => setEditForm({ ...editForm, durationDays: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Pricing mode">
              <select defaultValue={pkg.pricingMode} onChange={(e) => setEditForm({ ...editForm, pricingMode: e.target.value as PricingMode })} className={inputClass}>
                <option value="FIXED_PRICE">Fixed price</option>
                <option value="CONTACT_FOR_PRICE">Contact for price</option>
              </select>
            </Field>
            <Field label="Base price (EGP)" hint="Only applies when pricing mode is Fixed price">
              <input type="number" min={0} defaultValue={pkg.basePrice} onChange={(e) => setEditForm({ ...editForm, basePrice: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Min travellers">
              <input type="number" min={1} defaultValue={pkg.minTravellers} onChange={(e) => setEditForm({ ...editForm, minTravellers: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max travellers">
              <input type="number" min={1} defaultValue={pkg.maxTravellers} onChange={(e) => setEditForm({ ...editForm, maxTravellers: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Single supplement" hint="Optional">
              <input type="number" min={0} defaultValue={pkg.singleSupplement ?? ""} onChange={(e) => setEditForm({ ...editForm, singleSupplement: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} />
            </Field>
            <Field label="Child price" hint="Optional">
              <input type="number" min={0} defaultValue={pkg.childPrice ?? ""} onChange={(e) => setEditForm({ ...editForm, childPrice: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} />
            </Field>
            <Field label="Extra person price" hint="Optional">
              <input type="number" min={0} defaultValue={pkg.extraPersonPrice ?? ""} onChange={(e) => setEditForm({ ...editForm, extraPersonPrice: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Overview">
                <textarea defaultValue={pkg.overview} onChange={(e) => setEditForm({ ...editForm, overview: e.target.value })} className={inputClass} rows={3} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Destinations">
                <DestinationPicker
                  selected={editForm.destinationIds ?? pkg.destinations.map((d) => d.id)}
                  options={destinations}
                  onChange={(destinationIds) => setEditForm({ ...editForm, destinationIds })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:col-span-3 sm:grid-cols-2">
              <Field label="Included">
                <TagListInput values={editForm.included ?? pkg.included} onChange={(included) => setEditForm({ ...editForm, included })} />
              </Field>
              <Field label="Excluded">
                <TagListInput values={editForm.excluded ?? pkg.excluded} onChange={(excluded) => setEditForm({ ...editForm, excluded })} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Itinerary">
                <ItineraryEditor days={editForm.itinerary ?? pkg.itinerary} onChange={(itinerary) => setEditForm({ ...editForm, itinerary })} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {showImages && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Package images</h2>
          <ImageManager ownerType="PACKAGE" ownerId={pkg.id} />
        </Card>
      )}

      <Card>
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Departures</h2>
        </div>
        <form onSubmit={createDeparture} className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-5">
          <Field label="Starts on">
            <input type="date" required value={newDeparture.startsOn} onChange={(e) => setNewDeparture({ ...newDeparture, startsOn: e.target.value })} className={`${inputClass} w-44`} />
          </Field>
          <Field label="Capacity">
            <input type="number" min={1} value={newDeparture.capacity} onChange={(e) => setNewDeparture({ ...newDeparture, capacity: Number(e.target.value) })} className={`${inputClass} w-28`} />
          </Field>
          <PrimaryButton type="submit">Add departure</PrimaryButton>
        </form>
        <div className="divide-y divide-slate-100">
          {departures.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{new Date(d.startsOn).toLocaleDateString()}</p>
                <p className="text-xs text-slate-400">
                  {d.heldTravellers} held · {d.bookedTravellers} booked · {d.capacity} capacity
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={d.status} />
                <input type="number" min={0} defaultValue={d.capacity} onChange={(e) => setCapacityDrafts((c) => ({ ...c, [d.id]: Number(e.target.value) }))} className={`${inputClass} w-20`} />
                <SecondaryButton onClick={() => applyCapacity(d.id)}>Set capacity</SecondaryButton>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
