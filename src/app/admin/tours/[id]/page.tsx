"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, TagListInput } from "@/components/admin/ui";
import ImageManager from "@/components/admin/ImageManager";

type PricingMode = "FIXED_PRICE" | "CONTACT_FOR_PRICE";

interface ItineraryStep {
  offsetMinutes: number;
  title: string;
  description: string;
}
interface Tour {
  id: string;
  title: string;
  status: string;
  category: string;
  meetingPoint: string;
  durationMinutes: number;
  maxGroupSize: number;
  languages: string[];
  pricePerPerson: string;
  currency: string;
  pricingMode: PricingMode;
  overview: string;
  highlights: string[];
  included: string[];
  excluded: string[];
  importantInfo: string[];
  itinerary: ItineraryStep[];
  cancellationPolicyId: string;
}
interface Session {
  id: string;
  startsAt: string;
  capacity: number;
  heldUnits: number;
  bookedUnits: number;
  status: string;
}
interface Policy {
  id: string;
  name: string;
}

const CATEGORIES = ["HISTORY_CULTURE", "DINING_ENTERTAINMENT", "WATER_ACTIVITIES", "SIGHTSEEING"];

interface TourPatch {
  title?: string;
  category?: string;
  meetingPoint?: string;
  durationMinutes?: number;
  maxGroupSize?: number;
  languages?: string[];
  pricePerPerson?: number;
  pricingMode?: PricingMode;
  overview?: string;
  highlights?: string[];
  included?: string[];
  excluded?: string[];
  importantInfo?: string[];
  itinerary?: ItineraryStep[];
  cancellationPolicyId?: string;
}

function ItineraryEditor({ steps, onChange }: { steps: ItineraryStep[]; onChange: (next: ItineraryStep[]) => void }) {
  const add = () => onChange([...steps, { offsetMinutes: 0, title: "", description: "" }]);
  const update = (i: number, patch: Partial<ItineraryStep>) => onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[100px_1fr_1fr_auto]">
          <Field label="Offset (min)">
            <input type="number" min={0} value={step.offsetMinutes} onChange={(e) => update(i, { offsetMinutes: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Title">
            <input value={step.title} onChange={(e) => update(i, { title: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Description">
            <input value={step.description} onChange={(e) => update(i, { description: e.target.value })} className={inputClass} />
          </Field>
          <div className="flex items-end">
            <button type="button" onClick={() => remove(i)} className="rounded-md p-2 text-red-500 hover:bg-red-50" aria-label="Remove step">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <SecondaryButton type="button" onClick={add}>
        <Plus size={14} /> Add step
      </SecondaryButton>
    </div>
  );
}

export default function AdminTourDetailPage() {
  const params = useParams<{ id: string }>();
  const { notify } = useAdminToast();
  const [tour, setTour] = useState<Tour | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({ startsAt: "", capacity: 10 });
  const [capacityDrafts, setCapacityDrafts] = useState<Record<string, number>>({});
  const [showEdit, setShowEdit] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [editForm, setEditForm] = useState<TourPatch>({});
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<Tour & { sessions: Session[] }>(`/admin/tours/${params.id}`)
      .then((r) => {
        setError(null);
        setTour(r);
        setSessions(r.sessions);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load tour"));
  }
  useEffect(() => {
    load();
    adminApi.get<{ items: Policy[] }>("/admin/cancellation-policies", { pageSize: 50 }).then((r) => setPolicies(r.items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function setTourStatus(status: string) {
    try {
      await adminApi.patch(`/admin/tours/${params.id}/status`, { status });
      notify("success", `Tour ${status.toLowerCase()}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update tour");
    }
  }

  async function deleteTour() {
    try {
      await adminApi.delete(`/admin/tours/${params.id}`);
      notify("success", "Tour archived");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete (it may have active bookings)");
    }
  }

  async function saveTour(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.patch(`/admin/tours/${params.id}`, editForm);
      notify("success", "Tour updated");
      setShowEdit(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update tour");
    } finally {
      setSaving(false);
    }
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.post(`/admin/tours/${params.id}/sessions`, { startsAt: new Date(newSession.startsAt).toISOString(), capacity: Number(newSession.capacity) });
      notify("success", "Session created");
      setNewSession({ startsAt: "", capacity: 10 });
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create session");
    }
  }

  async function applyCapacity(sessionId: string) {
    const capacity = capacityDrafts[sessionId];
    if (capacity === undefined) return;
    try {
      await adminApi.patch(`/admin/tours/${params.id}/sessions/${sessionId}/capacity`, { capacity });
      notify("success", "Capacity updated");
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Capacity cannot go below seats already held or booked");
    }
  }

  async function setSessionStatus(sessionId: string, status: string) {
    try {
      await adminApi.patch(`/admin/tours/${params.id}/sessions/${sessionId}/status`, { status });
      notify("success", `Session ${status.toLowerCase()}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update session");
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!tour) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tour.title}
        description={`${tour.category.replace(/_/g, " ")} · ${tour.pricingMode === "FIXED_PRICE" ? `${tour.pricePerPerson} ${tour.currency}/person` : "Contact for price"}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={tour.status} />
            {tour.status !== "PUBLISHED" ? <SecondaryButton onClick={() => setTourStatus("PUBLISHED")}>Publish</SecondaryButton> : <SecondaryButton onClick={() => setTourStatus("DRAFT")}>Unpublish</SecondaryButton>}
            <SecondaryButton
              onClick={() => {
                setEditForm({});
                setShowEdit((v) => !v);
              }}
            >
              {showEdit ? "Close" : "Edit details"}
            </SecondaryButton>
            <SecondaryButton onClick={() => setShowImages((v) => !v)}>{showImages ? "Hide images" : "Images"}</SecondaryButton>
            <ConfirmButton label="Delete tour" confirmLabel="Archive this tour?" onConfirm={deleteTour} />
          </div>
        }
      />

      {showEdit && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Edit tour details</h2>
          <form onSubmit={saveTour} className="grid gap-4 sm:grid-cols-3">
            <Field label="Title">
              <input defaultValue={tour.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Category">
              <select defaultValue={tour.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Meeting point">
              <input defaultValue={tour.meetingPoint} onChange={(e) => setEditForm({ ...editForm, meetingPoint: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Duration (minutes)">
              <input type="number" min={1} defaultValue={tour.durationMinutes} onChange={(e) => setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Max group size">
              <input type="number" min={1} defaultValue={tour.maxGroupSize} onChange={(e) => setEditForm({ ...editForm, maxGroupSize: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Pricing">
              <select defaultValue={tour.pricingMode} onChange={(e) => setEditForm({ ...editForm, pricingMode: e.target.value as PricingMode })} className={inputClass}>
                <option value="FIXED_PRICE">Fixed price</option>
                <option value="CONTACT_FOR_PRICE">Contact for price</option>
              </select>
            </Field>
            <Field label="Price per person (EGP)" hint="Only applies when pricing is Fixed price">
              <input type="number" min={0} defaultValue={tour.pricePerPerson} onChange={(e) => setEditForm({ ...editForm, pricePerPerson: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Cancellation policy">
              <select defaultValue={tour.cancellationPolicyId} onChange={(e) => setEditForm({ ...editForm, cancellationPolicyId: e.target.value })} className={inputClass}>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-3">
              <Field label="Languages">
                <TagListInput values={editForm.languages ?? tour.languages} onChange={(languages) => setEditForm({ ...editForm, languages })} placeholder="English, Arabic, …" />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Overview">
                <textarea defaultValue={tour.overview} onChange={(e) => setEditForm({ ...editForm, overview: e.target.value })} className={inputClass} rows={3} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Highlights">
                <TagListInput values={editForm.highlights ?? tour.highlights} onChange={(highlights) => setEditForm({ ...editForm, highlights })} />
              </Field>
            </div>
            <div className="sm:col-span-3 grid gap-4 sm:grid-cols-3">
              <Field label="Included">
                <TagListInput values={editForm.included ?? tour.included} onChange={(included) => setEditForm({ ...editForm, included })} />
              </Field>
              <Field label="Excluded">
                <TagListInput values={editForm.excluded ?? tour.excluded} onChange={(excluded) => setEditForm({ ...editForm, excluded })} />
              </Field>
              <Field label="Important info">
                <TagListInput values={editForm.importantInfo ?? tour.importantInfo} onChange={(importantInfo) => setEditForm({ ...editForm, importantInfo })} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Itinerary">
                <ItineraryEditor steps={editForm.itinerary ?? tour.itinerary} onChange={(itinerary) => setEditForm({ ...editForm, itinerary })} />
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
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Tour images</h2>
          <ImageManager ownerType="TOUR" ownerId={tour.id} />
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
          {sessions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{new Date(s.startsAt).toLocaleString()}</p>
                <p className="text-xs text-slate-400">
                  {s.heldUnits} held · {s.bookedUnits} booked · {s.capacity} capacity
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                <input
                  type="number"
                  min={0}
                  defaultValue={s.capacity}
                  onChange={(e) => setCapacityDrafts((d) => ({ ...d, [s.id]: Number(e.target.value) }))}
                  className={`${inputClass} w-20`}
                />
                <SecondaryButton onClick={() => applyCapacity(s.id)}>Set capacity</SecondaryButton>
                {s.status !== "CLOSED" ? <SecondaryButton onClick={() => setSessionStatus(s.id, "CLOSED")}>Close</SecondaryButton> : <SecondaryButton onClick={() => setSessionStatus(s.id, "OPEN")}>Reopen</SecondaryButton>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
