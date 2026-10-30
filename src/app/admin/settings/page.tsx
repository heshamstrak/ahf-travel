"use client";

import { useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton } from "@/components/admin/ui";

interface InstapayValue {
  recipientName: string;
  handle: string;
  instructionsText: string;
}
interface SettingRow {
  key: string;
  value: unknown;
  updatedAt: string | null;
}

export default function AdminSettingsPage() {
  const { notify } = useAdminToast();
  const [settings, setSettings] = useState<SettingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instapay, setInstapay] = useState<InstapayValue>({ recipientName: "", handle: "", instructionsText: "" });
  const [holdMinutes, setHoldMinutes] = useState(15);
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi
      .get<SettingRow[]>("/admin/settings")
      .then((rows) => {
        setError(null);
        setSettings(rows);
        const ip = rows.find((r) => r.key === "payment.instapay")?.value as InstapayValue | undefined;
        if (ip) setInstapay(ip);
        const hm = rows.find((r) => r.key === "booking.holdMinutes")?.value as number | undefined;
        if (hm) setHoldMinutes(hm);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load settings"));
  }
  useEffect(load, []);

  async function saveInstapay(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.patch("/admin/settings/payment.instapay", { value: instapay });
      notify("success", "InstaPay instructions updated");
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveHoldMinutes(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.patch("/admin/settings/booking.holdMinutes", { value: Number(holdMinutes) });
      notify("success", "Hold duration updated");
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to save");
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!settings) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Settings" description="Only an explicit allowlist of configuration keys is editable here — never arbitrary environment or authentication values." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">InstaPay payment instructions</h2>
          <form onSubmit={saveInstapay} className="space-y-4">
            <Field label="Recipient name">
              <input required value={instapay.recipientName} onChange={(e) => setInstapay({ ...instapay, recipientName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Handle / account number">
              <input required value={instapay.handle} onChange={(e) => setInstapay({ ...instapay, handle: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Instructions shown to customers">
              <textarea required value={instapay.instructionsText} onChange={(e) => setInstapay({ ...instapay, instructionsText: e.target.value })} className={inputClass} rows={4} />
            </Field>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save instructions"}
            </PrimaryButton>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Booking policy</h2>
          <form onSubmit={saveHoldMinutes} className="space-y-4">
            <Field label="Hold duration (minutes)" hint="How long a booking holds inventory before PENDING_PAYMENT expires.">
              <input type="number" min={1} max={1440} value={holdMinutes} onChange={(e) => setHoldMinutes(Number(e.target.value))} className={inputClass} />
            </Field>
            <PrimaryButton type="submit">Save</PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
