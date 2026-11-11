"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, EyeOff, Pencil, Trash2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, PageHeader, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import RowActions, { RowAction } from "@/components/admin/RowActions";

interface Destination {
  id: string;
  name: string;
}
interface LocationRow {
  id: string;
  type: string;
  code: string | null;
  name: string;
  status: string;
  destination: { id: string; name: string };
}

const TYPES = ["AIRPORT", "CAR_BRANCH", "ZONE"];
const emptyForm = { type: "AIRPORT", code: "", name: "", destinationId: "" };

export default function AdminLocationsPage() {
  const { notify } = useAdminToast();
  const [items, setItems] = useState<LocationRow[] | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<{ items: LocationRow[] }>("/admin/locations", { pageSize: 50 })
      .then((r) => {
        setError(null);
        setItems(r.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load locations"));
  }
  useEffect(load, []);
  useEffect(() => {
    adminApi.get<{ items: Destination[] }>("/admin/destinations", { pageSize: 50 }).then((r) => setDestinations(r.items));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/locations", { ...form, code: form.code || undefined });
      notify("success", "Location created");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create location");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    try {
      await adminApi.patch(`/admin/locations/${id}`, { name: editName });
      notify("success", "Location updated");
      setEditing(null);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update location");
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await adminApi.patch(`/admin/locations/${id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  async function remove(id: string) {
    try {
      await adminApi.delete(`/admin/locations/${id}`);
      notify("success", "Location deleted");
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete (it may be in use)");
    }
  }

  const columns: DataTableColumn<LocationRow>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (l) => l.name,
      render: (l) =>
        editing === l.id ? (
          <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} onClick={(e) => e.stopPropagation()} />
        ) : (
          <span className="font-medium text-slate-800">
            {l.name} {l.code && <span className="text-xs text-slate-400">({l.code})</span>}
          </span>
        ),
    },
    { key: "destination", header: "Destination", sortValue: (l) => l.destination.name, render: (l) => l.destination.name },
    { key: "type", header: "Location type", sortValue: (l) => l.type, render: (l) => l.type.replace(/_/g, " ") },
    { key: "status", header: "Status", render: (l) => <StatusBadge status={l.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (l) => {
        if (editing === l.id) {
          return (
            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => saveEdit(l.id)} className="text-xs font-medium text-brand-700 hover:underline">
                Save
              </button>
              <button onClick={() => setEditing(null)} className="text-xs font-medium text-slate-500 hover:underline">
                Cancel
              </button>
            </div>
          );
        }
        const actions: RowAction[] = [
          {
            key: "edit",
            label: "Edit",
            icon: Pencil,
            onClick: () => {
              setEditing(l.id);
              setEditName(l.name);
            },
          },
          l.status !== "PUBLISHED"
            ? { key: "publish", label: "Publish", icon: BadgeCheck, onClick: () => setStatus(l.id, "PUBLISHED") }
            : { key: "unpublish", label: "Unpublish", icon: EyeOff, onClick: () => setStatus(l.id, "DRAFT") },
          {
            key: "delete",
            label: "Delete",
            icon: Trash2,
            tone: "danger",
            confirmTitle: "Delete this location?",
            confirmMessage: "This permanently removes it. Locations already referenced by a car or transfer rate cannot be deleted.",
            onClick: () => remove(l.id),
          },
        ];
        return <RowActions actions={actions} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Airports, car rental branches and transfer zones — the pick-up/drop-off points cars and transfers are priced and booked against."
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New location"}</PrimaryButton>}
      />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
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
            <Field label="Code" hint="e.g. IATA code for an airport. Optional.">
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputClass} maxLength={10} />
            </Field>
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create location"}
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
            rowKey={(l) => l.id}
            searchableText={(l) => `${l.name} ${l.destination.name} ${l.type}`}
            searchPlaceholder="Search locations…"
            emptyTitle="No locations yet"
          />
        </Card>
      )}
    </div>
  );
}
