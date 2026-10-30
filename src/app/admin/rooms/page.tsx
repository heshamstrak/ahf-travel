"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { adminApi, ApiError, mediaUrl } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, Field, inputClass, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, TagListInput } from "@/components/admin/ui";
import DataTable, { DataTableColumn, Thumbnail } from "@/components/admin/DataTable";
import ImageManager from "@/components/admin/ImageManager";

interface HotelOption {
  id: string;
  name: string;
}
interface RoomRow {
  id: string;
  hotelId: string;
  hotelName: string;
  code: string;
  name: string;
  bedType: string;
  maxAdults: number;
  maxChildren: number;
  ratePlanCount: number;
  status: string;
  updatedAt: string;
  cover: { url: string } | null;
  availabilityToday: { total: number; held: number; sold: number; free: number } | null;
}

const emptyCreate = { hotelId: "", code: "", name: "", bedType: "Queen", baseOccupancy: 2, maxAdults: 2, maxChildren: 0, sizeSqm: 25, features: [] as string[] };
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

/** The standalone, cross-hotel "Hotel Rooms" table — every room, across every hotel, in one place.
 *  Creation still requires picking a hotel (rooms belong to one), but that's a UI convenience over
 *  the same nested `/admin/hotels/:hotelId/rooms` endpoints the per-hotel page already uses — no
 *  business logic is duplicated here. */
export default function AdminRoomsIndexPage() {
  const { notify } = useAdminToast();
  const [items, setItems] = useState<RoomRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [hotelFilter, setHotelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCreate);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<RoomRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(() => {
    adminApi
      .get<{ items: RoomRow[]; meta: { totalPages: number } }>("/admin/rooms", {
        page,
        pageSize: 20,
        ...(hotelFilter ? { hotelId: hotelFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(q ? { q } : {}),
      })
      .then((r) => {
        setItems(r.items);
        setTotalPages(r.meta.totalPages);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load rooms"));
  }, [page, hotelFilter, statusFilter, q]);

  useEffect(load, [load]);
  useEffect(() => {
    adminApi.get<{ items: HotelOption[] }>("/admin/hotels", { pageSize: 50 }).then((r) => setHotels(r.items));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post(`/admin/hotels/${form.hotelId}/rooms`, {
        code: form.code,
        name: form.name,
        bedType: form.bedType,
        baseOccupancy: Number(form.baseOccupancy),
        maxAdults: Number(form.maxAdults),
        maxChildren: Number(form.maxChildren),
        sizeSqm: Number(form.sizeSqm),
        features: form.features,
      });
      notify("success", "Room created as draft");
      setForm(emptyCreate);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create room");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(room: RoomRow, status: string) {
    try {
      await adminApi.patch(`/admin/hotels/${room.hotelId}/rooms/${room.id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
      if (editing?.id === room.id) setEditing({ ...editing, status });
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  async function remove(room: RoomRow) {
    try {
      await adminApi.delete(`/admin/hotels/${room.hotelId}/rooms/${room.id}`);
      notify("success", "Room deleted");
      setEditing(null);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete room");
    }
  }

  const columns: DataTableColumn<RoomRow>[] = [
    { key: "thumb", header: "", render: (r) => <Thumbnail src={r.cover ? mediaUrl(r.cover.url) : null} alt={r.name} /> },
    { key: "name", header: "Room", sortValue: (r) => r.name, render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: "hotel", header: "Hotel", sortValue: (r) => r.hotelName, render: (r) => r.hotelName },
    { key: "capacity", header: "Capacity", sortValue: (r) => r.maxAdults, render: (r) => `${r.maxAdults} adults, ${r.maxChildren} children` },
    { key: "ratePlans", header: "Rate plans", sortValue: (r) => r.ratePlanCount, render: (r) => r.ratePlanCount },
    {
      key: "availability",
      header: "Today",
      render: (r) => (r.availabilityToday ? `${r.availabilityToday.free} free / ${r.availabilityToday.total}` : "—"),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {r.status !== "PUBLISHED" ? (
            <button onClick={() => setStatus(r, "PUBLISHED")} className="text-xs font-medium text-brand-700 hover:underline">
              Publish
            </button>
          ) : (
            <button onClick={() => setStatus(r, "DRAFT")} className="text-xs font-medium text-slate-500 hover:underline">
              Unpublish
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Hotel Rooms"
        description="Every room across every hotel, in one table."
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New room"}</PrimaryButton>}
      />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-3">
            <Field label="Hotel">
              <select required value={form.hotelId} onChange={(e) => setForm({ ...form, hotelId: e.target.value })} className={inputClass}>
                <option value="">Select…</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Room code">
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} placeholder="STD" />
            </Field>
            <Field label="Room name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Bed type">
              <input required value={form.bedType} onChange={(e) => setForm({ ...form, bedType: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Base occupancy">
              <input type="number" min={1} value={form.baseOccupancy} onChange={(e) => setForm({ ...form, baseOccupancy: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max adults">
              <input type="number" min={1} value={form.maxAdults} onChange={(e) => setForm({ ...form, maxAdults: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max children">
              <input type="number" min={0} value={form.maxChildren} onChange={(e) => setForm({ ...form, maxChildren: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Size (sqm)">
              <input type="number" min={1} value={form.sizeSqm} onChange={(e) => setForm({ ...form, sizeSqm: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Features" hint="Optional">
                <TagListInput values={form.features} onChange={(features) => setForm({ ...form, features })} placeholder="Balcony, Sea view…" />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create room"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <Field label="Search">
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Room or hotel name…" className={inputClass} />
        </Field>
        <Field label="Hotel">
          <select
            value={hotelFilter}
            onChange={(e) => {
              setHotelFilter(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All hotels</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      {error && <ErrorState message={error} />}
      {!error && (
        <Card>
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(r) => r.id}
            emptyTitle="No rooms found"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onRowClick={(r) => setEditing(r)}
          />
        </Card>
      )}

      {editing && <RoomDrawer room={editing} onClose={() => setEditing(null)} onSetStatus={setStatus} onDelete={remove} onSaved={load} />}
    </div>
  );
}

function RoomDrawer({
  room,
  onClose,
  onSetStatus,
  onDelete,
  onSaved,
}: {
  room: RoomRow;
  onClose: () => void;
  onSetStatus: (room: RoomRow, status: string) => void;
  onDelete: (room: RoomRow) => void;
  onSaved: () => void;
}) {
  const { notify } = useAdminToast();
  const [form, setForm] = useState({ name: room.name, bedType: room.bedType, maxAdults: room.maxAdults, maxChildren: room.maxChildren, features: [] as string[] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.get<{ features: string[] }>(`/admin/hotels/${room.hotelId}/rooms/${room.id}`).then((r) => setForm((f) => ({ ...f, features: r.features })));
  }, [room.hotelId, room.id]);

  async function save() {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/hotels/${room.hotelId}/rooms/${room.id}`, form);
      notify("success", "Room updated");
      onSaved();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update room");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{room.name}</h2>
            <p className="text-sm text-slate-500">
              {room.hotelName} ·{" "}
              <Link href={`/admin/hotels/${room.hotelId}`} className="text-brand-700 hover:underline">
                Manage rate plans &amp; inventory
              </Link>
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <StatusBadge status={room.status} />
          {room.status !== "PUBLISHED" ? (
            <SecondaryButton onClick={() => onSetStatus(room, "PUBLISHED")}>Publish</SecondaryButton>
          ) : (
            <SecondaryButton onClick={() => onSetStatus(room, "DRAFT")}>Unpublish</SecondaryButton>
          )}
          <ConfirmButton label="Delete room" confirmLabel="Delete this room?" onConfirm={() => onDelete(room)} />
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Bed type">
              <input value={form.bedType} onChange={(e) => setForm({ ...form, bedType: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Max adults">
              <input type="number" min={1} value={form.maxAdults} onChange={(e) => setForm({ ...form, maxAdults: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max children">
              <input type="number" min={0} value={form.maxChildren} onChange={(e) => setForm({ ...form, maxChildren: Number(e.target.value) })} className={inputClass} />
            </Field>
          </div>
          <Field label="Features">
            <TagListInput values={form.features} onChange={(features) => setForm({ ...form, features })} />
          </Field>
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </PrimaryButton>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Images</h3>
            <ImageManager ownerType="ROOM" ownerId={room.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
