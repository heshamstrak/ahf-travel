"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, EyeOff, Pencil, X } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, Field, inputClass, PageHeader, PrimaryButton, SecondaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import RowActions from "@/components/admin/RowActions";

const KINDS = ["TAX", "FEE", "SURCHARGE", "DISCOUNT"];
const PRODUCT_TYPES = ["", "HOTEL", "TOUR", "CAR", "TRANSFER", "PACKAGE"];
type AmountMode = "percent" | "flat";

interface RuleRow {
  id: string;
  code: string;
  kind: string;
  label: string;
  productType: string | null;
  percent: string | null;
  flatAmount: string | null;
  flatCurrency: string | null;
  priority: number;
  isActive: boolean;
  validFrom: string;
  validTo: string | null;
}

const emptyForm = {
  code: "",
  kind: "FEE",
  label: "",
  productType: "",
  amountMode: "percent" as AmountMode,
  percent: 5,
  flatAmount: 100,
  flatCurrency: "EGP",
  priority: 0,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: "",
};

export default function AdminPricingRulesPage() {
  const { notify } = useAdminToast();
  const [items, setItems] = useState<RuleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<RuleRow | null>(null);

  function load() {
    adminApi
      .get<{ items: RuleRow[] }>("/admin/pricing-rules", { pageSize: 50, kind: kindFilter || undefined, productType: productFilter || undefined })
      .then((r) => {
        setError(null);
        setItems(r.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load pricing rules"));
  }
  useEffect(load, [kindFilter, productFilter]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post("/admin/pricing-rules", {
        code: form.code,
        kind: form.kind,
        label: form.label,
        productType: form.productType || undefined,
        percent: form.amountMode === "percent" ? Number(form.percent) / 100 : undefined,
        flatAmount: form.amountMode === "flat" ? Number(form.flatAmount) : undefined,
        flatCurrency: form.amountMode === "flat" ? form.flatCurrency : undefined,
        priority: Number(form.priority),
        validFrom: form.validFrom,
        validTo: form.validTo || undefined,
      });
      notify("success", "Pricing rule created");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to create pricing rule");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(rule: RuleRow, isActive: boolean) {
    try {
      await adminApi.patch(`/admin/pricing-rules/${rule.id}`, { isActive });
      notify("success", isActive ? "Rule activated" : "Rule deactivated");
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to update rule");
    }
  }

  async function remove(rule: RuleRow) {
    try {
      await adminApi.delete(`/admin/pricing-rules/${rule.id}`);
      notify("success", "Pricing rule deleted");
      setEditing(null);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to delete rule");
    }
  }

  const columns: DataTableColumn<RuleRow>[] = [
    { key: "label", header: "Label", sortValue: (r) => r.label, render: (r) => <span className="font-medium text-slate-800">{r.label}</span> },
    { key: "code", header: "Code", sortValue: (r) => r.code, render: (r) => r.code },
    { key: "kind", header: "Kind", sortValue: (r) => r.kind, render: (r) => r.kind },
    { key: "product", header: "Applies to", render: (r) => r.productType ?? "All products" },
    {
      key: "amount",
      header: "Amount",
      render: (r) => (r.percent ? `${(Number(r.percent) * 100).toFixed(2)}%` : `${r.flatAmount} ${r.flatCurrency}`),
    },
    { key: "priority", header: "Priority", sortValue: (r) => r.priority, render: (r) => r.priority },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.isActive ? "PUBLISHED" : "DRAFT"} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <RowActions
          actions={[
            { key: "edit", label: "Edit", icon: Pencil, onClick: () => setEditing(r) },
            r.isActive
              ? { key: "deactivate", label: "Deactivate", icon: EyeOff, onClick: () => setActive(r, false) }
              : { key: "activate", label: "Activate", icon: BadgeCheck, onClick: () => setActive(r, true) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pricing, Taxes & Service Fees"
        description="Taxes, service fees, surcharges and discount rules applied automatically to every quote. No rate is hard-coded — everything here is read live by the booking engine."
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New rule"}</PrimaryButton>}
      />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-3">
            <Field label="Code">
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} placeholder="vat-eg" />
            </Field>
            <Field label="Label">
              <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputClass} placeholder="VAT" />
            </Field>
            <Field label="Kind">
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={inputClass}>
                {KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Applies to" hint="Leave as All products to apply everywhere">
              <select value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className={inputClass}>
                {PRODUCT_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p || "All products"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount type">
              <select value={form.amountMode} onChange={(e) => setForm({ ...form, amountMode: e.target.value as AmountMode })} className={inputClass}>
                <option value="percent">Percent</option>
                <option value="flat">Flat amount</option>
              </select>
            </Field>
            {form.amountMode === "percent" ? (
              <Field label="Percent (%)">
                <input type="number" min={0} max={100} step={0.01} value={form.percent} onChange={(e) => setForm({ ...form, percent: Number(e.target.value) })} className={inputClass} />
              </Field>
            ) : (
              <>
                <Field label="Flat amount">
                  <input type="number" min={0} value={form.flatAmount} onChange={(e) => setForm({ ...form, flatAmount: Number(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Currency">
                  <input value={form.flatCurrency} onChange={(e) => setForm({ ...form, flatCurrency: e.target.value.toUpperCase() })} className={inputClass} maxLength={3} />
                </Field>
              </>
            )}
            <Field label="Priority" hint="Higher applies first">
              <input type="number" min={0} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Valid from">
              <input type="date" required value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Valid to" hint="Optional">
              <input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create rule"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <Field label="Kind">
          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className={inputClass}>
            <option value="">All kinds</option>
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Applies to">
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={inputClass}>
            {PRODUCT_TYPES.map((p) => (
              <option key={p} value={p}>
                {p || "All products"}
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
            searchableText={(r) => `${r.label} ${r.code}`}
            searchPlaceholder="Search rules…"
            emptyTitle="No pricing rules yet"
            onRowClick={(r) => setEditing(r)}
          />
        </Card>
      )}

      {editing && <RuleDrawer rule={editing} onClose={() => setEditing(null)} onSaved={load} onDelete={remove} />}
    </div>
  );
}

function RuleDrawer({ rule, onClose, onSaved, onDelete }: { rule: RuleRow; onClose: () => void; onSaved: () => void; onDelete: (rule: RuleRow) => void }) {
  const { notify } = useAdminToast();
  const [form, setForm] = useState({
    label: rule.label,
    priority: rule.priority,
    percent: rule.percent ? Number(rule.percent) * 100 : 0,
    flatAmount: rule.flatAmount ? Number(rule.flatAmount) : 0,
    flatCurrency: rule.flatCurrency ?? "EGP",
    amountMode: rule.percent ? ("percent" as const) : ("flat" as const),
    validFrom: rule.validFrom.slice(0, 10),
    validTo: rule.validTo?.slice(0, 10) ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/pricing-rules/${rule.id}`, {
        label: form.label,
        priority: Number(form.priority),
        percent: form.amountMode === "percent" ? Number(form.percent) / 100 : undefined,
        flatAmount: form.amountMode === "flat" ? Number(form.flatAmount) : undefined,
        flatCurrency: form.amountMode === "flat" ? form.flatCurrency : undefined,
        validFrom: form.validFrom,
        validTo: form.validTo || undefined,
      });
      notify("success", "Pricing rule updated");
      onSaved();
      onClose();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to update rule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{rule.label}</h2>
            <p className="text-xs text-slate-400">
              {rule.code} · {rule.kind}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Label">
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Amount type">
            <select value={form.amountMode} onChange={(e) => setForm({ ...form, amountMode: e.target.value as "percent" | "flat" })} className={inputClass}>
              <option value="percent">Percent</option>
              <option value="flat">Flat amount</option>
            </select>
          </Field>
          {form.amountMode === "percent" ? (
            <Field label="Percent (%)">
              <input type="number" min={0} max={100} step={0.01} value={form.percent} onChange={(e) => setForm({ ...form, percent: Number(e.target.value) })} className={inputClass} />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Flat amount">
                <input type="number" min={0} value={form.flatAmount} onChange={(e) => setForm({ ...form, flatAmount: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Currency">
                <input value={form.flatCurrency} onChange={(e) => setForm({ ...form, flatCurrency: e.target.value.toUpperCase() })} className={inputClass} maxLength={3} />
              </Field>
            </div>
          )}
          <Field label="Priority">
            <input type="number" min={0} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valid from">
              <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Valid to">
              <input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </PrimaryButton>
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <ConfirmButton label="Delete" confirmLabel="Delete this rule?" onConfirm={() => onDelete(rule)} />
          </div>
        </div>
      </div>
    </div>
  );
}
