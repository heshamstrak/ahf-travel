"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, TagListInput } from "@/components/admin/ui";
import ImageManager from "@/components/admin/ImageManager";

interface CarModel {
  id: string;
  slug: string;
  brand: string;
  name: string;
  status: string;
  category: string;
  transmission: string;
  hasAirConditioning: boolean;
  passengers: number;
  bags: number;
  doors: number;
  includedKmPerDay: number;
  fuelPolicy: string;
  minDriverAge: number;
  pricePerDay: string;
  depositAmount: string;
  currency: string;
  coverage: string[];
  rentalConditions: string[];
  pickupNotes: string | null;
  cancellationPolicyId: string;
}
interface Policy {
  id: string;
  name: string;
}
interface Location {
  id: string;
  name: string;
}
interface InventoryRow {
  date: string;
  totalUnits: number;
  bookedUnits: number;
  heldUnits: number;
  blockedUnits: number;
}

const CATEGORIES = ["ECONOMY", "COMPACT", "SUV", "PREMIUM_SUV", "LUXURY"];
const TRANSMISSIONS = ["AUTOMATIC", "MANUAL"];

interface CarPatch {
  brand?: string;
  name?: string;
  category?: string;
  transmission?: string;
  hasAirConditioning?: boolean;
  passengers?: number;
  bags?: number;
  doors?: number;
  includedKmPerDay?: number;
  fuelPolicy?: string;
  minDriverAge?: number;
  pricePerDay?: number;
  depositAmount?: number;
  coverage?: string[];
  rentalConditions?: string[];
  pickupNotes?: string;
  cancellationPolicyId?: string;
}

function InventoryPanel({ carModelId, locations }: { carModelId: string; locations: Location[] }) {
  const { notify } = useAdminToast();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [totalUnits, setTotalUnits] = useState(3);
  const [rows, setRows] = useState<InventoryRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  async function view() {
    if (!locationId || !range.startDate || !range.endDate) return;
    try {
      const data = await adminApi.get<InventoryRow[]>(`/admin/cars/${carModelId}/inventory`, { locationId, from: range.startDate, to: range.endDate });
      setRows(data);
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to load inventory");
    }
  }

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.put(`/admin/cars/${carModelId}/inventory`, { locationId, startDate: range.startDate, endDate: range.endDate, totalUnits: Number(totalUnits) });
      notify("success", "Inventory updated");
      view();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update inventory");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-md bg-slate-50 p-3">
        <Field label="Branch">
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={`${inputClass} w-48`}>
            {locations.length === 0 ? <option value="">No branches yet</option> : null}
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start date">
          <input type="date" required value={range.startDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} className={`${inputClass} w-40`} />
        </Field>
        <Field label="End date">
          <input type="date" required value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} className={`${inputClass} w-40`} />
        </Field>
        <Field label="Total vehicles/day">
          <input type="number" min={0} value={totalUnits} onChange={(e) => setTotalUnits(Number(e.target.value))} className={`${inputClass} w-32`} />
        </Field>
        <PrimaryButton type="submit" disabled={saving || !locationId}>
          {saving ? "Saving…" : "Apply"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={view}>
          View current
        </SecondaryButton>
      </form>
      <p className="text-xs text-slate-400">Rejected automatically if the new total would fall below vehicles already held, booked or blocked on any date in range.</p>
      {rows && (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Booked</th>
                <th className="px-3 py-2">Held</th>
                <th className="px-3 py-2">Blocked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-slate-400">
                    No inventory set for this range yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.date}>
                    <td className="px-3 py-2">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{r.totalUnits}</td>
                    <td className="px-3 py-2">{r.bookedUnits}</td>
                    <td className="px-3 py-2">{r.heldUnits}</td>
                    <td className="px-3 py-2">{r.blockedUnits}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminCarDetailPage() {
  const params = useParams<{ id: string }>();
  const { notify } = useAdminToast();
  const [car, setCar] = useState<CarModel | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [editForm, setEditForm] = useState<CarPatch>({});
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<CarModel>(`/admin/cars/${params.id}`)
      .then((r) => {
        setError(null);
        setCar(r);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load car model"));
  }
  useEffect(() => {
    load();
    adminApi.get<{ items: Policy[] }>("/admin/cancellation-policies", { pageSize: 50 }).then((r) => setPolicies(r.items));
    adminApi.get<{ items: Location[] }>("/admin/locations", { type: "CAR_BRANCH", pageSize: 50 }).then((r) => setLocations(r.items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function setStatus(status: string) {
    try {
      await adminApi.patch(`/admin/cars/${params.id}/status`, { status });
      notify("success", `Car model ${status.toLowerCase()}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  async function remove() {
    try {
      await adminApi.delete(`/admin/cars/${params.id}`);
      notify("success", "Car model archived");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete (it may have active bookings)");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.patch(`/admin/cars/${params.id}`, editForm);
      notify("success", "Car model updated");
      setShowEdit(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update car model");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!car) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${car.brand} ${car.name}`}
        description={`${car.category} · ${car.transmission} · ${car.pricePerDay} ${car.currency}/day`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={car.status} />
            {car.status !== "PUBLISHED" ? <SecondaryButton onClick={() => setStatus("PUBLISHED")}>Publish</SecondaryButton> : <SecondaryButton onClick={() => setStatus("DRAFT")}>Unpublish</SecondaryButton>}
            <SecondaryButton
              onClick={() => {
                setEditForm({});
                setShowEdit((v) => !v);
              }}
            >
              {showEdit ? "Close" : "Edit details"}
            </SecondaryButton>
            <SecondaryButton onClick={() => setShowImages((v) => !v)}>{showImages ? "Hide images" : "Images"}</SecondaryButton>
            <SecondaryButton onClick={() => setShowInventory((v) => !v)}>{showInventory ? "Hide inventory" : "Inventory"}</SecondaryButton>
            <ConfirmButton label="Delete" confirmLabel="Archive this car model?" onConfirm={remove} />
          </div>
        }
      />

      {showEdit && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Edit car model</h2>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-3">
            <Field label="Brand">
              <input defaultValue={car.brand} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Model name">
              <input defaultValue={car.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Category">
              <select defaultValue={car.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Transmission">
              <select defaultValue={car.transmission} onChange={(e) => setEditForm({ ...editForm, transmission: e.target.value })} className={inputClass}>
                {TRANSMISSIONS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Air conditioning">
              <select defaultValue={car.hasAirConditioning ? "yes" : "no"} onChange={(e) => setEditForm({ ...editForm, hasAirConditioning: e.target.value === "yes" })} className={inputClass}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Cancellation policy">
              <select defaultValue={car.cancellationPolicyId} onChange={(e) => setEditForm({ ...editForm, cancellationPolicyId: e.target.value })} className={inputClass}>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Passengers">
              <input type="number" min={1} defaultValue={car.passengers} onChange={(e) => setEditForm({ ...editForm, passengers: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Bags">
              <input type="number" min={0} defaultValue={car.bags} onChange={(e) => setEditForm({ ...editForm, bags: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Doors">
              <input type="number" min={1} defaultValue={car.doors} onChange={(e) => setEditForm({ ...editForm, doors: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Included km/day">
              <input type="number" min={0} defaultValue={car.includedKmPerDay} onChange={(e) => setEditForm({ ...editForm, includedKmPerDay: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Fuel policy">
              <input defaultValue={car.fuelPolicy} onChange={(e) => setEditForm({ ...editForm, fuelPolicy: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Min driver age">
              <input type="number" min={18} defaultValue={car.minDriverAge} onChange={(e) => setEditForm({ ...editForm, minDriverAge: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Price per day (EGP)">
              <input type="number" min={0} defaultValue={car.pricePerDay} onChange={(e) => setEditForm({ ...editForm, pricePerDay: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Deposit (EGP)">
              <input type="number" min={0} defaultValue={car.depositAmount} onChange={(e) => setEditForm({ ...editForm, depositAmount: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Pickup notes" hint="Optional">
                <textarea defaultValue={car.pickupNotes ?? ""} onChange={(e) => setEditForm({ ...editForm, pickupNotes: e.target.value })} className={inputClass} rows={2} />
              </Field>
            </div>
            <div className="grid gap-4 sm:col-span-3 sm:grid-cols-2">
              <Field label="Coverage">
                <TagListInput values={editForm.coverage ?? car.coverage} onChange={(coverage) => setEditForm({ ...editForm, coverage })} placeholder="Collision damage waiver, …" />
              </Field>
              <Field label="Rental conditions">
                <TagListInput values={editForm.rentalConditions ?? car.rentalConditions} onChange={(rentalConditions) => setEditForm({ ...editForm, rentalConditions })} />
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
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Car images</h2>
          <ImageManager ownerType="CAR_MODEL" ownerId={car.id} />
        </Card>
      )}

      {showInventory && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Inventory by branch</h2>
          <InventoryPanel carModelId={car.id} locations={locations} />
        </Card>
      )}
    </div>
  );
}
