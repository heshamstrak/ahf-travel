"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, PageHeader, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";

interface Rule {
  hoursBeforeStart: number;
  refundPercent: number;
}
interface Policy {
  id: string;
  code: string;
  name: string;
  description: string;
  rules: Rule[];
}

const emptyForm = { code: "", name: "", description: "", rules: [{ hoursBeforeStart: 24, refundPercent: 100 }] as Rule[] };

function RulesEditor({ rules, onChange }: { rules: Rule[]; onChange: (next: Rule[]) => void }) {
  const add = () => onChange([...rules, { hoursBeforeStart: 0, refundPercent: 0 }]);
  const update = (i: number, patch: Partial<Rule>) => onChange(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(rules.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {rules.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <Field label="Hours before start">
            <input type="number" min={0} value={r.hoursBeforeStart} onChange={(e) => update(i, { hoursBeforeStart: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Refund %">
            <input type="number" min={0} max={100} value={r.refundPercent} onChange={(e) => update(i, { refundPercent: Number(e.target.value) })} className={inputClass} />
          </Field>
          <button type="button" onClick={() => remove(i)} className="rounded-md p-2 text-red-500 hover:bg-red-50" aria-label="Remove rule">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <SecondaryButton type="button" onClick={add}>
        <Plus size={14} /> Add rule
      </SecondaryButton>
    </div>
  );
}

function PolicyDrawer({ policy, onClose, onSaved }: { policy: Policy; onClose: () => void; onSaved: () => void }) {
  const { notify } = useAdminToast();
  const [form, setForm] = useState({ name: policy.name, description: policy.description, rules: policy.rules });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/cancellation-policies/${policy.id}`, form);
      notify("success", "Policy updated");
      onSaved();
      onClose();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update policy");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{policy.name}</h2>
            <p className="text-xs text-slate-400">{policy.code}</p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={2} />
          </Field>
          <Field label="Refund rules">
            <RulesEditor rules={form.rules} onChange={(rules) => setForm({ ...form, rules })} />
          </Field>
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default function AdminPoliciesPage() {
  const { notify } = useAdminToast();
  const [items, setItems] = useState<Policy[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);

  function load() {
    adminApi
      .get<{ items: Policy[] }>("/admin/cancellation-policies", { pageSize: 50 })
      .then((r) => {
        setError(null);
        setItems(r.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load policies"));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/cancellation-policies", form);
      notify("success", "Policy created");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create policy");
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<Policy>[] = [
    { key: "name", header: "Name", sortValue: (p) => p.name, render: (p) => <span className="font-medium text-slate-800">{p.name}</span> },
    { key: "code", header: "Code", sortValue: (p) => p.code, render: (p) => p.code },
    { key: "description", header: "Description", render: (p) => <span className="text-slate-600">{p.description}</span> },
    {
      key: "rules",
      header: "Refund rules",
      render: (p) => <span className="text-xs text-slate-500">{p.rules.map((r) => `${r.refundPercent}% @ ${r.hoursBeforeStart}h+`).join(" · ")}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cancellation policies"
        description="Refund rules used by hotels, tours, cars and packages. Each product links to one of these."
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New policy"}</PrimaryButton>}
      />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code">
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} placeholder="FLEXIBLE_48H" />
              </Field>
              <Field label="Name">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label="Description">
              <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={2} />
            </Field>
            <Field label="Refund rules">
              <RulesEditor rules={form.rules} onChange={(rules) => setForm({ ...form, rules })} />
            </Field>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create policy"}
            </PrimaryButton>
          </form>
        </Card>
      )}

      {error && <ErrorState message={error} />}
      {!error && (
        <Card>
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(p) => p.id}
            searchableText={(p) => `${p.name} ${p.code}`}
            searchPlaceholder="Search policies…"
            emptyTitle="No policies yet"
            onRowClick={(p) => setEditing(p)}
          />
        </Card>
      )}

      {editing && <PolicyDrawer policy={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}
