"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, TagListInput } from "@/components/admin/ui";
import ImageManager from "@/components/admin/ImageManager";

interface Hotel {
  id: string;
  name: string;
  status: string;
  starRating: number;
  propertyType: string;
  addressLine: string;
  latitude: string | null;
  longitude: string | null;
  description: string;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
}
interface Room {
  id: string;
  code: string;
  name: string;
  status: string;
  bedType: string;
  baseOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  sizeSqm: number | null;
  features: string[];
}
interface Policy {
  id: string;
  name: string;
}
interface HotelPatch {
  name?: string;
  propertyType?: string;
  starRating?: number;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  checkInTime?: string;
  checkOutTime?: string;
  amenities?: string[];
}
interface RatePlan {
  id: string;
  code: string;
  name: string;
  mealPlan: string;
  isRefundable: boolean;
  currency: string;
  basePricePerNight: string;
  extraAdultPerNight: string | null;
  extraChildPerNight: string | null;
  status: string;
  cancellationPolicyId: string;
}

const emptyRoom = { code: "", name: "", bedType: "Queen", baseOccupancy: 2, maxAdults: 2, maxChildren: 0, sizeSqm: 25 };
const emptyInventory = { startDate: "", endDate: "", totalUnits: 5 };
const MEAL_PLANS = ["ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "FULL_BOARD", "ALL_INCLUSIVE"];
const PROPERTY_TYPES = ["HOTEL", "RESORT", "APARTMENT", "VILLA"];

function RatePlansPanel({ hotelId, roomId, policies }: { hotelId: string; roomId: string; policies: Policy[] }) {
  const { notify } = useAdminToast();
  const [plans, setPlans] = useState<RatePlan[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const emptyPlanForm = { code: "", name: "", mealPlan: "ROOM_ONLY", isRefundable: true, cancellationPolicyId: policies[0]?.id ?? "", currency: "EGP", basePricePerNight: 2000, extraAdultPerNight: 0, extraChildPerNight: 0 };
  const [form, setForm] = useState(emptyPlanForm);
  const [editForm, setEditForm] = useState<Partial<RatePlan>>({});

  function load() {
    adminApi
      .get<RatePlan[]>(`/admin/hotels/${hotelId}/rooms/${roomId}/rate-plans`)
      .then(setPlans)
      .catch(() => setPlans([]));
  }
  useEffect(load, [hotelId, roomId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.post(`/admin/hotels/${hotelId}/rooms/${roomId}/rate-plans`, {
        ...form,
        basePricePerNight: Number(form.basePricePerNight),
        extraAdultPerNight: Number(form.extraAdultPerNight) || undefined,
        extraChildPerNight: Number(form.extraChildPerNight) || undefined,
      });
      notify("success", "Rate plan created");
      setForm(emptyPlanForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create rate plan");
    }
  }

  async function saveEdit(planId: string) {
    try {
      await adminApi.patch(`/admin/hotels/${hotelId}/rooms/${roomId}/rate-plans/${planId}`, editForm);
      notify("success", "Rate plan updated");
      setEditing(null);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update rate plan");
    }
  }

  async function setPlanStatus(planId: string, status: string) {
    try {
      await adminApi.patch(`/admin/hotels/${hotelId}/rooms/${roomId}/rate-plans/${planId}/status`, { status });
      notify("success", `Rate plan ${status.toLowerCase()}`);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update status");
    }
  }

  if (plans === null) return <LoadingState label="Loading rate plans…" />;

  return (
    <div className="space-y-3 rounded-md bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rate plans</h3>
        <SecondaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New rate plan"}</SecondaryButton>
      </div>

      {showForm && (
        <form onSubmit={create} className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-3">
          <Field label="Code">
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Meal plan">
            <select value={form.mealPlan} onChange={(e) => setForm({ ...form, mealPlan: e.target.value })} className={inputClass}>
              {MEAL_PLANS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Refundable">
            <select value={form.isRefundable ? "yes" : "no"} onChange={(e) => setForm({ ...form, isRefundable: e.target.value === "yes" })} className={inputClass}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
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
          <Field label="Base price/night (EGP)">
            <input type="number" min={0} value={form.basePricePerNight} onChange={(e) => setForm({ ...form, basePricePerNight: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Extra adult/night" hint="Optional">
            <input type="number" min={0} value={form.extraAdultPerNight} onChange={(e) => setForm({ ...form, extraAdultPerNight: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Extra child/night" hint="Optional">
            <input type="number" min={0} value={form.extraChildPerNight} onChange={(e) => setForm({ ...form, extraChildPerNight: Number(e.target.value) })} className={inputClass} />
          </Field>
          <div className="sm:col-span-3">
            <PrimaryButton type="submit">Create rate plan</PrimaryButton>
          </div>
        </form>
      )}

      {plans.length === 0 && !showForm ? (
        <p className="text-xs text-slate-400">No rate plans yet — a room needs at least one published rate plan to be bookable.</p>
      ) : (
        <div className="space-y-2">
          {plans.map((p) => (
            <div key={p.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
              {editing === p.id ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="Name">
                    <input value={editForm.name ?? p.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="Base price/night">
                    <input type="number" value={editForm.basePricePerNight ?? p.basePricePerNight} onChange={(e) => setEditForm({ ...editForm, basePricePerNight: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="Meal plan">
                    <select value={editForm.mealPlan ?? p.mealPlan} onChange={(e) => setEditForm({ ...editForm, mealPlan: e.target.value })} className={inputClass}>
                      {MEAL_PLANS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="flex items-end gap-2 sm:col-span-3">
                    <PrimaryButton onClick={() => saveEdit(p.id)}>Save</PrimaryButton>
                    <SecondaryButton onClick={() => setEditing(null)}>Cancel</SecondaryButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">
                      {p.name} <span className="text-xs text-slate-400">({p.code})</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.mealPlan} · {p.isRefundable ? "Refundable" : "Non-refundable"} · {p.basePricePerNight} {p.currency}/night
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <SecondaryButton onClick={() => setEditing(p.id)}>Edit</SecondaryButton>
                    {p.status !== "PUBLISHED" ? <SecondaryButton onClick={() => setPlanStatus(p.id, "PUBLISHED")}>Publish</SecondaryButton> : <SecondaryButton onClick={() => setPlanStatus(p.id, "DRAFT")}>Unpublish</SecondaryButton>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomRow({ hotelId, room, policies, onChanged }: { hotelId: string; room: Room; policies: Policy[]; onChanged: () => void }) {
  const { notify } = useAdminToast();
  const [section, setSection] = useState<"none" | "inventory" | "edit" | "images" | "rates">("none");
  const [inv, setInv] = useState(emptyInventory);
  const [savingInv, setSavingInv] = useState(false);
  const [editForm, setEditForm] = useState({ name: room.name, bedType: room.bedType, baseOccupancy: room.baseOccupancy, maxAdults: room.maxAdults, maxChildren: room.maxChildren, sizeSqm: room.sizeSqm ?? 0, features: room.features });
  const [saving, setSaving] = useState(false);

  const toggle = (s: typeof section) => setSection((cur) => (cur === s ? "none" : s));

  async function setStatus(status: string) {
    try {
      await adminApi.patch(`/admin/hotels/${hotelId}/rooms/${room.id}/status`, { status });
      notify("success", `Room ${status.toLowerCase()}`);
      onChanged();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update room");
    }
  }

  async function remove() {
    try {
      await adminApi.delete(`/admin/hotels/${hotelId}/rooms/${room.id}`);
      notify("success", "Room archived");
      onChanged();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete (it may have active bookings)");
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.patch(`/admin/hotels/${hotelId}/rooms/${room.id}`, { ...editForm, sizeSqm: editForm.sizeSqm || undefined });
      notify("success", "Room updated");
      setSection("none");
      onChanged();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update room");
    } finally {
      setSaving(false);
    }
  }

  async function setInventory(e: React.FormEvent) {
    e.preventDefault();
    setSavingInv(true);
    try {
      await adminApi.put(`/admin/hotels/${hotelId}/rooms/${room.id}/inventory`, { ...inv, totalUnits: Number(inv.totalUnits) });
      notify("success", "Inventory updated");
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update inventory");
    } finally {
      setSavingInv(false);
    }
  }

  return (
    <div className="border-b border-slate-100 px-5 py-3 text-sm last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-800">
            {room.name} <span className="text-xs text-slate-400">({room.code})</span>
          </p>
          <p className="text-xs text-slate-400">
            Base occupancy {room.baseOccupancy} · max {room.maxAdults} adults
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={room.status} />
          {room.status !== "PUBLISHED" ? <SecondaryButton onClick={() => setStatus("PUBLISHED")}>Publish</SecondaryButton> : <SecondaryButton onClick={() => setStatus("DRAFT")}>Unpublish</SecondaryButton>}
          <SecondaryButton onClick={() => toggle("edit")}>{section === "edit" ? "Close" : "Edit"}</SecondaryButton>
          <SecondaryButton onClick={() => toggle("images")}>{section === "images" ? "Hide images" : "Images"}</SecondaryButton>
          <SecondaryButton onClick={() => toggle("rates")}>{section === "rates" ? "Hide rates" : "Rate plans"}</SecondaryButton>
          <SecondaryButton onClick={() => toggle("inventory")}>{section === "inventory" ? "Hide inventory" : "Inventory"}</SecondaryButton>
          <ConfirmButton label="Delete" confirmLabel="Archive this room?" onConfirm={remove} />
        </div>
      </div>

      {section === "edit" && (
        <form onSubmit={saveEdit} className="mt-3 grid gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
          <Field label="Name">
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Bed type">
            <input value={editForm.bedType} onChange={(e) => setEditForm({ ...editForm, bedType: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Size (sqm)">
            <input type="number" min={0} value={editForm.sizeSqm} onChange={(e) => setEditForm({ ...editForm, sizeSqm: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Base occupancy">
            <input type="number" min={1} value={editForm.baseOccupancy} onChange={(e) => setEditForm({ ...editForm, baseOccupancy: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Max adults">
            <input type="number" min={1} value={editForm.maxAdults} onChange={(e) => setEditForm({ ...editForm, maxAdults: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Max children">
            <input type="number" min={0} value={editForm.maxChildren} onChange={(e) => setEditForm({ ...editForm, maxChildren: Number(e.target.value) })} className={inputClass} />
          </Field>
          <div className="sm:col-span-3">
            <Field label="Features">
              <TagListInput values={editForm.features} onChange={(features) => setEditForm({ ...editForm, features })} placeholder="Balcony, Nile view, …" />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save room"}
            </PrimaryButton>
          </div>
        </form>
      )}

      {section === "images" && (
        <div className="mt-3">
          <ImageManager ownerType="ROOM" ownerId={room.id} />
        </div>
      )}

      {section === "rates" && (
        <div className="mt-3">
          <RatePlansPanel hotelId={hotelId} roomId={room.id} policies={policies} />
        </div>
      )}

      {section === "inventory" && (
        <form onSubmit={setInventory} className="mt-3 flex flex-wrap items-end gap-3 rounded-md bg-slate-50 p-3">
          <Field label="Start date">
            <input type="date" required value={inv.startDate} onChange={(e) => setInv({ ...inv, startDate: e.target.value })} className={`${inputClass} w-40`} />
          </Field>
          <Field label="End date">
            <input type="date" required value={inv.endDate} onChange={(e) => setInv({ ...inv, endDate: e.target.value })} className={`${inputClass} w-40`} />
          </Field>
          <Field label="Total rooms/night">
            <input type="number" min={0} required value={inv.totalUnits} onChange={(e) => setInv({ ...inv, totalUnits: Number(e.target.value) })} className={`${inputClass} w-32`} />
          </Field>
          <PrimaryButton type="submit" disabled={savingInv}>
            {savingInv ? "Saving…" : "Apply"}
          </PrimaryButton>
          <p className="w-full text-xs text-slate-400">Rejected automatically if the new total would fall below rooms already held, sold or blocked on any date in range.</p>
        </form>
      )}
    </div>
  );
}

export default function AdminHotelDetailPage() {
  const params = useParams<{ id: string }>();
  const { notify } = useAdminToast();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [editForm, setEditForm] = useState<HotelPatch>({});
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<Hotel & { rooms: Room[] }>(`/admin/hotels/${params.id}`)
      .then((r) => {
        setError(null);
        setHotel(r);
        setRooms(r.rooms);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load hotel"));
  }
  useEffect(() => {
    load();
    adminApi.get<{ items: Policy[] }>("/admin/cancellation-policies", { pageSize: 50 }).then((r) => setPolicies(r.items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function setHotelStatus(status: string) {
    try {
      await adminApi.patch(`/admin/hotels/${params.id}/status`, { status });
      notify("success", `Hotel ${status.toLowerCase()}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update hotel");
    }
  }

  async function deleteHotel() {
    try {
      await adminApi.delete(`/admin/hotels/${params.id}`);
      notify("success", "Hotel archived");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete (it may have active bookings)");
    }
  }

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post(`/admin/hotels/${params.id}/rooms`, { ...roomForm, sizeSqm: roomForm.sizeSqm || undefined });
      notify("success", "Room created");
      setRoomForm(emptyRoom);
      setShowRoomForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create room");
    } finally {
      setSaving(false);
    }
  }

  async function saveHotel(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.patch(`/admin/hotels/${params.id}`, editForm);
      notify("success", "Hotel updated");
      setShowEdit(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update hotel");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!hotel) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={hotel.name}
        description={`${hotel.starRating}★ ${hotel.propertyType.toLowerCase()} · ${hotel.addressLine}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={hotel.status} />
            {hotel.status !== "PUBLISHED" ? <SecondaryButton onClick={() => setHotelStatus("PUBLISHED")}>Publish</SecondaryButton> : <SecondaryButton onClick={() => setHotelStatus("DRAFT")}>Unpublish</SecondaryButton>}
            <SecondaryButton
              onClick={() => {
                setEditForm({});
                setShowEdit((v) => !v);
              }}
            >
              {showEdit ? "Close" : "Edit details"}
            </SecondaryButton>
            <SecondaryButton onClick={() => setShowImages((v) => !v)}>{showImages ? "Hide images" : "Images"}</SecondaryButton>
            <ConfirmButton label="Delete hotel" confirmLabel="Archive this hotel?" onConfirm={deleteHotel} />
          </div>
        }
      />

      {showEdit && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Edit hotel details</h2>
          <form onSubmit={saveHotel} className="grid gap-4 sm:grid-cols-3">
            <Field label="Name">
              <input defaultValue={hotel.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Property type">
              <select defaultValue={hotel.propertyType} onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })} className={inputClass}>
                {PROPERTY_TYPES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Star rating">
              <input type="number" min={1} max={5} defaultValue={hotel.starRating} onChange={(e) => setEditForm({ ...editForm, starRating: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Address">
              <input defaultValue={hotel.addressLine} onChange={(e) => setEditForm({ ...editForm, addressLine: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Check-in time">
              <input defaultValue={hotel.checkInTime} onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })} className={inputClass} placeholder="14:00" />
            </Field>
            <Field label="Check-out time">
              <input defaultValue={hotel.checkOutTime} onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })} className={inputClass} placeholder="12:00" />
            </Field>
            <Field label="Latitude" hint="Optional">
              <input type="number" step="any" defaultValue={hotel.latitude ?? ""} onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} />
            </Field>
            <Field label="Longitude" hint="Optional">
              <input type="number" step="any" defaultValue={hotel.longitude ?? ""} onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Description">
                <textarea defaultValue={hotel.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputClass} rows={3} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Amenities">
                <TagListInput values={editForm.amenities ?? hotel.amenities} onChange={(amenities) => setEditForm({ ...editForm, amenities })} placeholder="Pool, Spa, Free WiFi, …" />
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
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Hotel images</h2>
          <ImageManager ownerType="HOTEL" ownerId={hotel.id} />
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Rooms</h2>
          <PrimaryButton onClick={() => setShowRoomForm((v) => !v)}>{showRoomForm ? "Close" : "New room"}</PrimaryButton>
        </div>
        {showRoomForm && (
          <form onSubmit={createRoom} className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-3">
            <Field label="Code">
              <input required value={roomForm.code} onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Name">
              <input required value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Bed type">
              <input required value={roomForm.bedType} onChange={(e) => setRoomForm({ ...roomForm, bedType: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Base occupancy">
              <input type="number" min={1} value={roomForm.baseOccupancy} onChange={(e) => setRoomForm({ ...roomForm, baseOccupancy: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max adults">
              <input type="number" min={1} value={roomForm.maxAdults} onChange={(e) => setRoomForm({ ...roomForm, maxAdults: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max children">
              <input type="number" min={0} value={roomForm.maxChildren} onChange={(e) => setRoomForm({ ...roomForm, maxChildren: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create room"}
              </PrimaryButton>
            </div>
          </form>
        )}
        {rooms.map((room) => (
          <RoomRow key={room.id} hotelId={params.id} room={room} policies={policies} onChanged={load} />
        ))}
      </Card>
    </div>
  );
}
