"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, PageHeader, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";

interface TourOption {
  id: string;
  title: string;
}
interface SessionRow {
  id: string;
  tourId: string;
  tourTitle: string;
  startsAt: string;
  capacity: number;
  heldUnits: number;
  bookedUnits: number;
  remaining: number;
  status: string;
}

const emptyCreate = { tourId: "", startsAt: "", capacity: 20 };
const STATUSES = ["OPEN", "CLOSED", "CANCELLED"];

/** The standalone, cross-tour "Tour Sessions" table — every departure, across every tour, in one
 *  place. Creation still requires picking a tour, but reuses the same nested
 *  `/admin/tours/:tourId/sessions` endpoints the per-tour page already calls. */
export default function AdminTourSessionsIndexPage() {
  const { notify } = useAdminToast();
  const [items, setItems] = useState<SessionRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tours, setTours] = useState<TourOption[]>([]);
  const [tourFilter, setTourFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCreate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(() => {
    adminApi
      .get<{ items: SessionRow[]; meta: { totalPages: number } }>("/admin/tour-sessions", {
        page,
        pageSize: 20,
        ...(tourFilter ? { tourId: tourFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(q ? { q } : {}),
      })
      .then((r) => {
        setItems(r.items);
        setTotalPages(r.meta.totalPages);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load tour sessions"));
  }, [page, tourFilter, statusFilter, q]);

  useEffect(load, [load]);
  useEffect(() => {
    adminApi.get<{ items: TourOption[] }>("/admin/tours", { pageSize: 50 }).then((r) => setTours(r.items));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post(`/admin/tours/${form.tourId}/sessions`, {
        startsAt: new Date(form.startsAt).toISOString(),
        capacity: Number(form.capacity),
      });
      notify("success", "Session created");
      setForm(emptyCreate);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create session");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(row: SessionRow, status: string) {
    try {
      await adminApi.patch(`/admin/tours/${row.tourId}/sessions/${row.id}/status`, { status });
      notify("success", `Status set to ${status}`);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  async function setCapacity(row: SessionRow, capacity: number) {
    try {
      await adminApi.patch(`/admin/tours/${row.tourId}/sessions/${row.id}/capacity`, { capacity });
      notify("success", "Capacity updated");
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update capacity");
    }
  }

  const columns: DataTableColumn<SessionRow>[] = [
    { key: "tour", header: "Tour", sortValue: (r) => r.tourTitle, render: (r) => <span className="font-medium text-slate-800">{r.tourTitle}</span> },
    { key: "startsAt", header: "Date / time", sortValue: (r) => r.startsAt, render: (r) => new Date(r.startsAt).toLocaleString() },
    { key: "capacity", header: "Capacity", sortValue: (r) => r.capacity, render: (r) => r.capacity },
    { key: "held", header: "Held", sortValue: (r) => r.heldUnits, render: (r) => r.heldUnits },
    { key: "sold", header: "Sold", sortValue: (r) => r.bookedUnits, render: (r) => r.bookedUnits },
    { key: "remaining", header: "Remaining", sortValue: (r) => r.remaining, render: (r) => r.remaining },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            min={0}
            defaultValue={r.capacity}
            onBlur={(e) => {
              const next = Number(e.target.value);
              if (next !== r.capacity) void setCapacity(r, next);
            }}
            className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs"
            title="Edit capacity"
          />
          {r.status === "OPEN" && (
            <button onClick={() => setStatus(r, "CLOSED")} className="text-xs font-medium text-slate-500 hover:underline">
              Close
            </button>
          )}
          {r.status === "CLOSED" && (
            <button onClick={() => setStatus(r, "OPEN")} className="text-xs font-medium text-brand-700 hover:underline">
              Reopen
            </button>
          )}
          {r.status !== "CANCELLED" && r.bookedUnits === 0 && (
            <button onClick={() => setStatus(r, "CANCELLED")} className="text-xs font-medium text-red-600 hover:underline">
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tour Sessions"
        description="Every departure across every tour, in one table."
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New session"}</PrimaryButton>}
      />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-3">
            <Field label="Tour">
              <select required value={form.tourId} onChange={(e) => setForm({ ...form, tourId: e.target.value })} className={inputClass}>
                <option value="">Select…</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Starts at">
              <input type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Capacity">
              <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create session"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <Field label="Search">
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Tour title…" className={inputClass} />
        </Field>
        <Field label="Tour">
          <select
            value={tourFilter}
            onChange={(e) => {
              setTourFilter(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All tours</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
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
          <DataTable columns={columns} rows={items} rowKey={(r) => r.id} emptyTitle="No tour sessions found" page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
