"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton, SecondaryButton, StatusBadge } from "@/components/admin/ui";
import ImageManager from "@/components/admin/ImageManager";

type PricingMode = "FIXED_PRICE" | "CONTACT_FOR_PRICE";

interface ConferenceEvent {
  id: string;
  slug: string;
  name: string;
  description: string;
  venue: string | null;
  organizerName: string | null;
  status: string;
  pricingMode: PricingMode;
  basePrice: string | null;
  currency: string | null;
}
interface Session {
  id: string;
  startsAt: string;
  capacity: number;
  heldSeats: number;
  bookedSeats: number;
  status: string;
}

interface Patch {
  name?: string;
  description?: string;
  venue?: string;
  organizerName?: string;
  pricingMode?: PricingMode;
  basePrice?: number;
  currency?: string;
}

export default function AdminConferenceEventDetailPage() {
  const params = useParams<{ id: string }>();
  const { notify } = useAdminToast();
  const [item, setItem] = useState<ConferenceEvent | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({ startsAt: "", capacity: 50 });
  const [showEdit, setShowEdit] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [editForm, setEditForm] = useState<Patch>({});
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<ConferenceEvent & { sessions: Session[] }>(`/admin/conference-events/${params.id}`)
      .then((r) => {
        setError(null);
        setItem(r);
        setSessions(r.sessions);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  }
  useEffect(load, [params.id]);

  async function setItemStatus(status: string) {
    try {
      await adminApi.patch(`/admin/conference-events/${params.id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  async function remove() {
    try {
      await adminApi.delete(`/admin/conference-events/${params.id}`);
      notify("success", "Archived");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete (it may have active bookings)");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.patch(`/admin/conference-events/${params.id}`, editForm);
      notify("success", "Updated");
      setShowEdit(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.post(`/admin/conference-events/${params.id}/sessions`, {
        startsAt: new Date(newSession.startsAt).toISOString(),
        capacity: Number(newSession.capacity),
      });
      notify("success", "Session created");
      setNewSession({ startsAt: "", capacity: 50 });
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create session");
    }
  }

  async function setSessionStatus(sessionId: string, status: string) {
    try {
      await adminApi.patch(`/admin/conference-events/${params.id}/sessions/${sessionId}/status`, { status });
      notify("success", `Session ${status.toLowerCase()}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update session");
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!item) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        description={item.pricingMode === "FIXED_PRICE" ? `${item.basePrice} ${item.currency}` : "Contact for price"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            {item.status !== "PUBLISHED" ? <SecondaryButton onClick={() => setItemStatus("PUBLISHED")}>Publish</SecondaryButton> : <SecondaryButton onClick={() => setItemStatus("DRAFT")}>Unpublish</SecondaryButton>}
            <SecondaryButton
              onClick={() => {
                setEditForm({});
                setShowEdit((v) => !v);
              }}
            >
              {showEdit ? "Close" : "Edit details"}
            </SecondaryButton>
            <SecondaryButton onClick={() => setShowImages((v) => !v)}>{showImages ? "Hide images" : "Images"}</SecondaryButton>
            <ConfirmButton label="Delete" confirmLabel="Archive this conference/event?" onConfirm={remove} />
          </div>
        }
      />

      {showEdit && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Edit details</h2>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-3">
            <Field label="Name">
              <input defaultValue={item.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Venue">
              <input defaultValue={item.venue ?? ""} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Organizer">
              <input defaultValue={item.organizerName ?? ""} onChange={(e) => setEditForm({ ...editForm, organizerName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Pricing">
              <select defaultValue={item.pricingMode} onChange={(e) => setEditForm({ ...editForm, pricingMode: e.target.value as PricingMode })} className={inputClass}>
                <option value="FIXED_PRICE">Fixed price</option>
                <option value="CONTACT_FOR_PRICE">Contact for price</option>
              </select>
            </Field>
            <Field label="Base price (EGP)" hint="Only applies when pricing is Fixed price">
              <input type="number" min={0} defaultValue={item.basePrice ?? ""} onChange={(e) => setEditForm({ ...editForm, basePrice: Number(e.target.value), currency: "EGP" })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Description">
                <textarea defaultValue={item.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputClass} rows={3} />
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
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Images</h2>
          <ImageManager ownerType="CONFERENCE_EVENT" ownerId={item.id} />
        </Card>
      )}

      <Card>
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Sessions</h2>
        </div>
        <form onSubmit={createSession} className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-5">
          <Field label="Starts at">
            <input type="datetime-local" required value={newSession.startsAt} onChange={(e) => setNewSession({ ...newSession, startsAt: e.target.value })} className={`${inputClass} w-56`} />
          </Field>
          <Field label="Capacity">
            <input type="number" min={1} value={newSession.capacity} onChange={(e) => setNewSession({ ...newSession, capacity: Number(e.target.value) })} className={`${inputClass} w-28`} />
          </Field>
          <PrimaryButton type="submit">Add session</PrimaryButton>
        </form>
        <div className="divide-y divide-slate-100">
          {sessions.length === 0 && <p className="p-5 text-sm text-slate-400">No sessions scheduled yet.</p>}
          {sessions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{new Date(s.startsAt).toLocaleString()}</p>
                <p className="text-xs text-slate-400">
                  {s.heldSeats} held · {s.bookedSeats} booked · {s.capacity} capacity
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                {s.status === "OPEN" && (
                  <SecondaryButton onClick={() => setSessionStatus(s.id, "CLOSED")}>Close</SecondaryButton>
                )}
                {s.status === "CLOSED" && (
                  <SecondaryButton onClick={() => setSessionStatus(s.id, "OPEN")}>Reopen</SecondaryButton>
                )}
                {s.status !== "CANCELLED" && s.bookedSeats === 0 && (
                  <ConfirmButton label="Cancel" confirmLabel="Cancel this session?" onConfirm={() => setSessionStatus(s.id, "CANCELLED")} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
