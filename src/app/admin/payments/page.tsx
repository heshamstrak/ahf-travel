"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ConfirmButton, ErrorState, Field, inputClass, PageHeader, PrimaryButton, SecondaryButton, StatusBadge } from "@/components/admin/ui";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import RowActions from "@/components/admin/RowActions";

interface InstapayItem {
  id: string;
  bookingId: string;
  method: string;
  status: string;
  amount: string;
  currency: string;
  transferReference: string | null;
  proofSubmittedAt: string | null;
}
interface ListResponse {
  items: InstapayItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface PaymentDetail extends InstapayItem {
  reviewedById: string | null;
  rejectionReason: string | null;
  proof: { mimeType: string; sizeBytes: number; createdAt: string } | null;
  booking: { id: string; reference: string; status: string; total: string; currency: string; customerEmail: string } | null;
}

const STATUSES = ["", "PENDING_VERIFICATION", "SUCCEEDED", "REJECTED"];

function RejectBox({ onReject }: { onReject: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) {
    return (
      <SecondaryButton onClick={() => setOpen(true)} className="text-red-600">
        Reject
      </SecondaryButton>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className={`${inputClass} w-48`} />
      <PrimaryButton
        disabled={!reason.trim()}
        onClick={() => {
          onReject(reason);
          setOpen(false);
          setReason("");
        }}
        className="bg-red-600 hover:bg-red-700"
      >
        Confirm reject
      </PrimaryButton>
      <SecondaryButton onClick={() => setOpen(false)}>Cancel</SecondaryButton>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const { notify } = useAdminToast();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("PENDING_VERIFICATION");
  const [selected, setSelected] = useState<PaymentDetail | null>(null);

  function load() {
    adminApi
      .get<ListResponse>("/admin/payments/instapay", { status: status || undefined, page, pageSize: 20 })
      .then((r) => {
        setError(null);
        setData(r);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  }

  useEffect(load, [page, status]);

  async function openDetail(id: string) {
    try {
      const detail = await adminApi.get<PaymentDetail>(`/admin/payments/${id}`);
      setSelected(detail);
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to load payment");
    }
  }

  async function approve(id: string) {
    try {
      await adminApi.post(`/admin/payments/${id}/approve`);
      notify("success", "Payment approved and booking confirmed");
      setSelected(null);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to approve");
    }
  }

  async function reject(id: string, reason: string) {
    try {
      await adminApi.post(`/admin/payments/${id}/reject`, { reason });
      notify("success", "Payment rejected");
      setSelected(null);
      load();
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to reject");
    }
  }

  const columns: DataTableColumn<InstapayItem>[] = [
    { key: "reference", header: "Transfer reference", sortValue: (p) => p.transferReference ?? "", render: (p) => <span className="font-medium text-slate-800">{p.transferReference ?? "—"}</span> },
    { key: "amount", header: "Amount", sortValue: (p) => Number(p.amount), render: (p) => `${p.amount} ${p.currency}` },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "submitted", header: "Submitted", sortValue: (p) => p.proofSubmittedAt ?? "", render: (p) => (p.proofSubmittedAt ? new Date(p.proofSubmittedAt).toLocaleString() : "—") },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => <RowActions actions={[{ key: "view", label: "View", icon: Eye, onClick: () => openDetail(p.id) }]} />,
    },
  ];

  return (
    <div>
      <PageHeader title="Payments" description="InstaPay verification queue. Cash collection is recorded from a booking's detail page via the booking list." />

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || "All statuses"}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      {error && <ErrorState message={error} />}
      {!error && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <DataTable
              columns={columns}
              rows={data?.items ?? null}
              rowKey={(p) => p.id}
              emptyTitle="Nothing matches this filter"
              page={data?.meta.page ?? page}
              totalPages={data?.meta.totalPages ?? 1}
              onPageChange={setPage}
              onRowClick={(p) => openDetail(p.id)}
            />
          </Card>

          <Card className="p-5">
            {!selected ? (
              <p className="text-sm text-slate-400">Select a submission to review its receipt and approve or reject it.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Booking</p>
                  <p className="text-sm font-medium text-slate-800">{selected.booking?.reference}</p>
                  <p className="text-xs text-slate-500">{selected.booking?.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Amount</p>
                  <p className="text-sm text-slate-800">
                    {selected.amount} {selected.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Transfer reference</p>
                  <p className="text-sm text-slate-800">{selected.transferReference}</p>
                </div>
                {selected.proof && (
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Receipt</p>
                    <button
                      onClick={async () => {
                        try {
                          const url = await adminApi.blobUrl(`/payments/${selected.id}/proof`);
                          window.open(url, "_blank", "noopener,noreferrer");
                        } catch (e) {
                          notify("error", e instanceof ApiError ? e.message : "Failed to load receipt");
                        }
                      }}
                      className="text-sm text-brand-700 hover:underline"
                    >
                      View receipt ({selected.proof.mimeType})
                    </button>
                  </div>
                )}
                {selected.status === "PENDING_VERIFICATION" ? (
                  <div className="flex items-center gap-2 pt-2">
                    <ConfirmButton
                      label="Approve"
                      confirmLabel="Approve this payment?"
                      tone="neutral"
                      onConfirm={() => approve(selected.id)}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                    />
                    <RejectBox onReject={(reason) => reject(selected.id, reason)} />
                  </div>
                ) : (
                  <p className="pt-2 text-xs text-slate-400">{selected.status === "REJECTED" ? `Rejected: ${selected.rejectionReason ?? "—"}` : "Already reviewed."}</p>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
