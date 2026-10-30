"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton, SecondaryButton, StatusBadge } from "@/components/admin/ui";
import ImageManager from "@/components/admin/ImageManager";

interface Destination {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  countryCode: string;
  description: string | null;
  isFeatured: boolean;
  sortOrder: number;
  status: string;
}
interface DestinationPatch {
  name?: string;
  nameAr?: string;
  countryCode?: string;
  description?: string;
  isFeatured?: boolean;
  sortOrder?: number;
}

export default function AdminDestinationDetailPage() {
  const params = useParams<{ id: string }>();
  const { notify } = useAdminToast();
  const [dest, setDest] = useState<Destination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<DestinationPatch>({});
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<Destination>(`/admin/destinations/${params.id}`)
      .then((r) => {
        setError(null);
        setDest(r);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load destination"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function setStatus(status: string) {
    try {
      await adminApi.patch(`/admin/destinations/${params.id}/status`, { status });
      notify("success", `Destination ${status.toLowerCase()}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  async function remove() {
    try {
      await adminApi.delete(`/admin/destinations/${params.id}`);
      notify("success", "Destination archived");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.patch(`/admin/destinations/${params.id}`, editForm);
      notify("success", "Destination updated");
      setShowEdit(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update destination");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!dest) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={dest.name}
        description={`${dest.slug} · ${dest.countryCode}${dest.isFeatured ? " · Featured" : ""}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={dest.status} />
            {dest.status !== "PUBLISHED" ? <SecondaryButton onClick={() => setStatus("PUBLISHED")}>Publish</SecondaryButton> : <SecondaryButton onClick={() => setStatus("DRAFT")}>Unpublish</SecondaryButton>}
            <SecondaryButton
              onClick={() => {
                setEditForm({});
                setShowEdit((v) => !v);
              }}
            >
              {showEdit ? "Close" : "Edit details"}
            </SecondaryButton>
            <ConfirmButton label="Delete" confirmLabel="Archive this destination?" onConfirm={remove} />
          </div>
        }
      />

      {showEdit && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Edit destination</h2>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-3">
            <Field label="Name">
              <input defaultValue={dest.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Name (Arabic)" hint="Optional">
              <input defaultValue={dest.nameAr ?? ""} onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Country code">
              <input defaultValue={dest.countryCode} maxLength={2} onChange={(e) => setEditForm({ ...editForm, countryCode: e.target.value.toUpperCase() })} className={inputClass} />
            </Field>
            <Field label="Sort order">
              <input type="number" min={0} defaultValue={dest.sortOrder} onChange={(e) => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Featured on homepage">
              <select defaultValue={dest.isFeatured ? "yes" : "no"} onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.value === "yes" })} className={inputClass}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
            <div className="sm:col-span-3">
              <Field label="Description" hint="Optional">
                <textarea defaultValue={dest.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputClass} rows={3} />
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

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Destination images</h2>
        <ImageManager ownerType="DESTINATION" ownerId={dest.id} />
      </Card>
    </div>
  );
}
