"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, EyeOff } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Badge, Card, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, TagListInput } from "@/components/admin/ui";
import ImageManager from "@/components/admin/ImageManager";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import RowActions from "@/components/admin/RowActions";

interface VehicleClass {
  id: string;
  code: string;
  name: string;
  passengersMax: number;
  luggageMax: number;
  features: string[];
  isActive: boolean;
}
interface Location {
  id: string;
  name: string;
}
interface TransferRate {
  id: string;
  amount: string;
  currency: string;
  durationMinutes: number;
  isActive: boolean;
  isDevPlaceholder: boolean;
  origin: { name: string };
  destination: { name: string };
  vehicleClass: { name: string };
}
interface CapacityRow {
  date: string;
  totalUnits: number;
  bookedUnits: number;
  heldUnits: number;
}

const VEHICLE_TYPES = ["SEDAN", "SUV", "PREMIUM", "VAN", "MINIBUS"];
const emptyVehicleForm = { code: "SEDAN", name: "", passengersMax: 3, luggageMax: 2 };
const emptyRateForm = { originLocationId: "", destinationLocationId: "", vehicleClassId: "", amount: 300, currency: "EGP", durationMinutes: 45, validFrom: new Date().toISOString().slice(0, 10) };

function CapacityPanel({ vehicleClassId }: { vehicleClassId: string }) {
  const { notify } = useAdminToast();
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [totalUnits, setTotalUnits] = useState(5);
  const [rows, setRows] = useState<CapacityRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  async function view() {
    if (!range.startDate || !range.endDate) return;
    try {
      setRows(await adminApi.get<CapacityRow[]>(`/admin/transfer-vehicle-classes/${vehicleClassId}/capacity`, { from: range.startDate, to: range.endDate }));
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to load capacity");
    }
  }

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.put(`/admin/transfer-vehicle-classes/${vehicleClassId}/capacity`, { startDate: range.startDate, endDate: range.endDate, totalUnits: Number(totalUnits) });
      notify("success", "Capacity updated");
      view();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update capacity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-md bg-slate-50 p-3">
        <Field label="Start date">
          <input type="date" required value={range.startDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} className={`${inputClass} w-40`} />
        </Field>
        <Field label="End date">
          <input type="date" required value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} className={`${inputClass} w-40`} />
        </Field>
        <Field label="Vehicles/day">
          <input type="number" min={0} value={totalUnits} onChange={(e) => setTotalUnits(Number(e.target.value))} className={`${inputClass} w-28`} />
        </Field>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Apply"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={view}>
          View current
        </SecondaryButton>
      </form>
      {rows && (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Booked</th>
                <th className="px-3 py-2">Held</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-slate-400">
                    No capacity set for this range yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.date}>
                    <td className="px-3 py-2">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{r.totalUnits}</td>
                    <td className="px-3 py-2">{r.bookedUnits}</td>
                    <td className="px-3 py-2">{r.heldUnits}</td>
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

function VehicleClassCard({ vc, onChanged }: { vc: VehicleClass; onChanged: () => void }) {
  const { notify } = useAdminToast();
  const [section, setSection] = useState<"none" | "edit" | "images" | "capacity">("none");
  const [editForm, setEditForm] = useState({ name: vc.name, passengersMax: vc.passengersMax, luggageMax: vc.luggageMax, features: vc.features, isActive: vc.isActive });
  const [saving, setSaving] = useState(false);
  const toggle = (s: typeof section) => setSection((cur) => (cur === s ? "none" : s));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.patch(`/admin/transfer-vehicle-classes/${vc.id}`, editForm);
      notify("success", "Vehicle class updated");
      setSection("none");
      onChanged();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update vehicle class");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-800">{vc.name}</p>
          <p className="text-xs text-slate-400">
            {vc.passengersMax} pax · {vc.luggageMax} bags
          </p>
        </div>
        <Badge tone={vc.isActive ? "success" : "neutral"}>{vc.isActive ? "Active" : "Inactive"}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <SecondaryButton className="px-2 py-1 text-xs" onClick={() => toggle("edit")}>
          {section === "edit" ? "Close" : "Edit"}
        </SecondaryButton>
        <SecondaryButton className="px-2 py-1 text-xs" onClick={() => toggle("images")}>
          {section === "images" ? "Hide images" : "Images"}
        </SecondaryButton>
        <SecondaryButton className="px-2 py-1 text-xs" onClick={() => toggle("capacity")}>
          {section === "capacity" ? "Hide capacity" : "Capacity"}
        </SecondaryButton>
      </div>

      {section === "edit" && (
        <form onSubmit={save} className="mt-3 space-y-3 rounded-md bg-slate-50 p-3">
          <Field label="Name">
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max passengers">
              <input type="number" min={1} value={editForm.passengersMax} onChange={(e) => setEditForm({ ...editForm, passengersMax: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max luggage">
              <input type="number" min={0} value={editForm.luggageMax} onChange={(e) => setEditForm({ ...editForm, luggageMax: Number(e.target.value) })} className={inputClass} />
            </Field>
          </div>
          <Field label="Features">
            <TagListInput values={editForm.features} onChange={(features) => setEditForm({ ...editForm, features })} placeholder="AC, WiFi, child seat on request…" />
          </Field>
          <Field label="Active">
            <select value={editForm.isActive ? "yes" : "no"} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "yes" })} className={inputClass}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </PrimaryButton>
        </form>
      )}
      {section === "images" && (
        <div className="mt-3">
          <ImageManager ownerType="TRANSFER_VEHICLE_CLASS" ownerId={vc.id} />
        </div>
      )}
      {section === "capacity" && (
        <div className="mt-3">
          <CapacityPanel vehicleClassId={vc.id} />
        </div>
      )}
    </Card>
  );
}

export default function AdminTransfersPage() {
  const { notify } = useAdminToast();
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[] | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [rates, setRates] = useState<TransferRate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [showRateForm, setShowRateForm] = useState(false);
  const [form, setForm] = useState(emptyRateForm);
  const [saving, setSaving] = useState(false);

  function loadVehicleClasses() {
    adminApi.get<VehicleClass[]>("/admin/transfer-vehicle-classes").then(setVehicleClasses);
  }
  function loadRates() {
    adminApi
      .get<{ items: TransferRate[] }>("/admin/transfer-rates", { pageSize: 50 })
      .then((r) => {
        setError(null);
        setRates(r.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  }
  useEffect(() => {
    loadVehicleClasses();
    loadRates();
    adminApi.get<{ items: Location[] }>("/admin/locations", { pageSize: 50 }).then((r) => setLocations(r.items));
  }, []);

  async function createVehicleClass(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/transfer-vehicle-classes", { ...vehicleForm, passengersMax: Number(vehicleForm.passengersMax), luggageMax: Number(vehicleForm.luggageMax) });
      notify("success", "Vehicle class created");
      setVehicleForm(emptyVehicleForm);
      setShowVehicleForm(false);
      loadVehicleClasses();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create vehicle class");
    } finally {
      setSaving(false);
    }
  }

  async function createRate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/transfer-rates", { ...form, amount: Number(form.amount), durationMinutes: Number(form.durationMinutes) });
      notify("success", "Transfer rate created");
      setForm(emptyRateForm);
      setShowRateForm(false);
      loadRates();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create rate");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await adminApi.patch(`/admin/transfer-rates/${id}`, { isActive: !isActive });
      notify("success", !isActive ? "Rate activated" : "Rate deactivated");
      loadRates();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update rate");
    }
  }

  const rateColumns: DataTableColumn<TransferRate>[] = [
    {
      key: "route",
      header: "Route",
      sortValue: (r) => `${r.origin.name} ${r.destination.name}`,
      render: (r) => (
        <span className="font-medium text-slate-800">
          {r.origin.name} → {r.destination.name}
        </span>
      ),
    },
    { key: "vehicle", header: "Vehicle class", sortValue: (r) => r.vehicleClass.name, render: (r) => r.vehicleClass.name },
    { key: "amount", header: "Amount", sortValue: (r) => Number(r.amount), render: (r) => `${r.amount} ${r.currency}${r.isDevPlaceholder ? " (dev placeholder)" : ""}` },
    { key: "duration", header: "Duration", sortValue: (r) => r.durationMinutes, render: (r) => `${r.durationMinutes} min` },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.isActive ? "PUBLISHED" : "DRAFT"} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <RowActions
          actions={[
            r.isActive
              ? { key: "deactivate", label: "Deactivate", icon: EyeOff, onClick: () => toggleActive(r.id, r.isActive) }
              : { key: "activate", label: "Activate", icon: BadgeCheck, onClick: () => toggleActive(r.id, r.isActive) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Transfers" description="Vehicle classes, routes and rates." />

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Vehicle classes</h2>
          <PrimaryButton onClick={() => setShowVehicleForm((v) => !v)}>{showVehicleForm ? "Close" : "New vehicle class"}</PrimaryButton>
        </div>
        {showVehicleForm && (
          <form onSubmit={createVehicleClass} className="mb-4 grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-4">
            <Field label="Type code">
              <select value={vehicleForm.code} onChange={(e) => setVehicleForm({ ...vehicleForm, code: e.target.value })} className={inputClass}>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Name">
              <input required value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Max passengers">
              <input type="number" min={1} value={vehicleForm.passengersMax} onChange={(e) => setVehicleForm({ ...vehicleForm, passengersMax: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max luggage">
              <input type="number" min={0} value={vehicleForm.luggageMax} onChange={(e) => setVehicleForm({ ...vehicleForm, luggageMax: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-4">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create vehicle class"}
              </PrimaryButton>
            </div>
          </form>
        )}
        {vehicleClasses === null ? (
          <LoadingState />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vehicleClasses.map((vc) => (
              <VehicleClassCard key={vc.id} vc={vc} onChanged={loadVehicleClasses} />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Routes & rates</h2>
          <PrimaryButton onClick={() => setShowRateForm((v) => !v)}>{showRateForm ? "Close" : "New rate"}</PrimaryButton>
        </div>
        {showRateForm && (
          <form onSubmit={createRate} className="mb-4 grid gap-4 rounded-md border border-slate-200 p-3 sm:grid-cols-3">
            <Field label="Origin">
              <select required value={form.originLocationId} onChange={(e) => setForm({ ...form, originLocationId: e.target.value })} className={inputClass}>
                <option value="">Select…</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Destination">
              <select required value={form.destinationLocationId} onChange={(e) => setForm({ ...form, destinationLocationId: e.target.value })} className={inputClass}>
                <option value="">Select…</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vehicle class">
              <select required value={form.vehicleClassId} onChange={(e) => setForm({ ...form, vehicleClassId: e.target.value })} className={inputClass}>
                <option value="">Select…</option>
                {(vehicleClasses ?? []).map((vc) => (
                  <option key={vc.id} value={vc.id}>
                    {vc.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount (EGP)">
              <input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Duration (minutes)">
              <input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Valid from">
              <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create rate"}
              </PrimaryButton>
            </div>
          </form>
        )}

        {error && <ErrorState message={error} />}
        {!error && (
          <DataTable
            columns={rateColumns}
            rows={rates}
            rowKey={(r) => r.id}
            searchableText={(r) => `${r.origin.name} ${r.destination.name} ${r.vehicleClass.name}`}
            searchPlaceholder="Search routes…"
            emptyTitle="No transfer rates yet"
          />
        )}
      </Card>
    </div>
  );
}
