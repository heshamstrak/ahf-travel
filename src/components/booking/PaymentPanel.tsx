"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Banknote, Smartphone, Upload } from "lucide-react";
import { useApp } from "@/context/AppProvider";
import { api, ApiError, newIdempotencyKey } from "@/lib/api/client";
import type { BookingView, InstapayInstructions, PaymentView } from "@/lib/api/types";
import { formatExact } from "@/lib/currency";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface PaymentPanelProps {
  booking: BookingView;
  /** Required for a guest booking — proves ownership, same as cancel. Omit when signed in as the owner. */
  email?: string;
  /** Shown as a banner when the most recent InstaPay attempt was rejected. */
  rejectionReason?: string | null;
  onCompleted: () => void;
}

export default function PaymentPanel({ booking, email, rejectionReason, onCompleted }: PaymentPanelProps) {
  const { user } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "instapay" | null>(null);
  const [cashSubmitting, setCashSubmitting] = useState(false);
  const [cashError, setCashError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<InstapayInstructions | null>(null);
  const [transferReference, setTransferReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [instapaySubmitting, setInstapaySubmitting] = useState(false);
  const [instapayError, setInstapayError] = useState<string | null>(null);
  const instapayKeyRef = useRef(newIdempotencyKey());

  useEffect(() => {
    if (paymentMethod !== "instapay" || instructions) return;
    api
      .get<InstapayInstructions>("/payments/instapay-instructions")
      .then(setInstructions)
      .catch(() => undefined);
  }, [paymentMethod, instructions]);

  const confirmCash = async () => {
    setCashSubmitting(true);
    setCashError(null);
    try {
      await api.post<PaymentView[]>(`/bookings/${booking.reference}/payment/cash`, user ? {} : { email });
      onCompleted();
    } catch (err) {
      setCashError(err instanceof ApiError ? err.message : "Could not confirm cash payment. Please try again.");
    } finally {
      setCashSubmitting(false);
    }
  };

  const onProofChange = (e: ChangeEvent<HTMLInputElement>) => setProofFile(e.target.files?.[0] ?? null);

  const submitInstapay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!proofFile) {
      setInstapayError("Upload a screenshot or PDF of your InstaPay transfer.");
      return;
    }
    if (transferReference.trim().length < 4) {
      setInstapayError("Enter the transfer reference from your InstaPay app.");
      return;
    }
    setInstapaySubmitting(true);
    setInstapayError(null);
    const form = new FormData();
    form.append("transferReference", transferReference.trim());
    if (!user && email) form.append("email", email);
    form.append("proof", proofFile);
    try {
      await api.upload<PaymentView>(`/bookings/${booking.reference}/payment/instapay`, form, { "Idempotency-Key": instapayKeyRef.current });
      onCompleted();
    } catch (err) {
      setInstapayError(err instanceof ApiError ? err.message : "Could not submit your payment proof. Please try again.");
    } finally {
      setInstapaySubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      {rejectionReason ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Your previous InstaPay submission was rejected</p>
          <p className="mt-1">{rejectionReason}</p>
          <p className="mt-1">Please check your details and submit again.</p>
        </div>
      ) : null}

      <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <legend className="sr-only">Payment method</legend>
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${paymentMethod === "cash" ? "border-brand-600 bg-brand-50/50" : "border-slate-200"}`}>
          <input type="radio" name="payment" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="mt-1 text-brand-600" />
          <span>
            <span className="flex items-center gap-2 font-medium text-slate-900">
              <Banknote size={16} /> Cash
            </span>
            <span className="text-xs text-slate-500">Pay on arrival. Your booking is confirmed now, marked paid once collected.</span>
          </span>
        </label>
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${paymentMethod === "instapay" ? "border-brand-600 bg-brand-50/50" : "border-slate-200"}`}>
          <input type="radio" name="payment" checked={paymentMethod === "instapay"} onChange={() => setPaymentMethod("instapay")} className="mt-1 text-brand-600" />
          <span>
            <span className="flex items-center gap-2 font-medium text-slate-900">
              <Smartphone size={16} /> InstaPay
            </span>
            <span className="text-xs text-slate-500">Transfer now and upload your receipt for verification.</span>
          </span>
        </label>
      </fieldset>

      {paymentMethod === "cash" ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Your booking will be confirmed immediately. Payment is collected in cash — it will show as &ldquo;not yet collected&rdquo; until then.
          </p>
          {cashError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{cashError}</p> : null}
          <Button onClick={confirmCash} disabled={cashSubmitting} size="lg" className="w-full sm:w-auto">
            {cashSubmitting ? "Confirming…" : "Confirm cash booking"}
          </Button>
        </div>
      ) : paymentMethod === "instapay" ? (
        <form onSubmit={submitInstapay} className="space-y-4">
          {instructions ? (
            <div className="space-y-1 rounded-xl bg-sand-50 p-4 text-sm text-slate-700">
              <p>
                Send <span className="font-semibold">{formatExact(booking.totals.total, booking.totals.currency)}</span> via InstaPay to:
              </p>
              <p className="font-semibold text-slate-900">{instructions.recipientName}</p>
              <p className="font-mono">{instructions.handle}</p>
              <p className="whitespace-pre-line text-slate-600">{instructions.instructionsText}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Loading transfer instructions…</p>
          )}
          <Input label="Transfer reference" value={transferReference} onChange={(e) => setTransferReference(e.target.value)} hint="From your InstaPay confirmation" />
          <div>
            <label htmlFor="proof" className="mb-1.5 block text-sm font-medium text-slate-700">
              Payment proof
            </label>
            <input
              id="proof"
              type="file"
              accept="image/*,application/pdf"
              onChange={onProofChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
          {instapayError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{instapayError}</p> : null}
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={instapaySubmitting}>
            <Upload size={16} className="me-1.5 inline" />
            {instapaySubmitting ? "Submitting…" : "Submit payment proof"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">Choose a payment method to continue.</p>
      )}
    </section>
  );
}
