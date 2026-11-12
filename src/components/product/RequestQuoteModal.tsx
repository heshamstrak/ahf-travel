"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";
import { useApp } from "@/context/AppProvider";
import { submitInquiry, type InquiryServiceType } from "@/services/inquiries.service";
import { ApiError } from "@/lib/api/client";
import { required, phone as phoneValidator } from "@/lib/validation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";
import Button from "@/components/ui/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface ExtraField {
  key: string;
  label: string;
  type: "date" | "number";
  min?: number;
}

/** Relevant dates/guest counts per service type — shown inline in the form "when applicable",
 *  per the brief, rather than inherited from whatever the booking widget elsewhere happens to
 *  have selected (a CONTACT_FOR_PRICE page never renders that widget at all). */
const EXTRA_FIELDS: Record<InquiryServiceType, ExtraField[]> = {
  HOTEL: [
    { key: "Check-in", label: "Check-in date", type: "date" },
    { key: "Check-out", label: "Check-out date", type: "date" },
    { key: "Guests", label: "Guests", type: "number", min: 1 },
  ],
  TOUR: [
    { key: "Preferred date", label: "Preferred date", type: "date" },
    { key: "Participants", label: "Participants", type: "number", min: 1 },
  ],
  CAR: [
    { key: "Pick-up date", label: "Pick-up date", type: "date" },
    { key: "Drop-off date", label: "Drop-off date", type: "date" },
  ],
  TRANSFER: [
    { key: "Transfer date", label: "Transfer date", type: "date" },
    { key: "Passengers", label: "Passengers", type: "number", min: 1 },
  ],
  PACKAGE: [
    { key: "Preferred travel date", label: "Preferred travel date", type: "date" },
    { key: "Travellers", label: "Travellers", type: "number", min: 1 },
  ],
  CONFERENCE_EVENT: [
    { key: "Preferred date", label: "Preferred date", type: "date" },
    { key: "Attendees", label: "Attendees", type: "number", min: 1 },
  ],
};

interface RequestQuoteModalProps {
  open: boolean;
  onClose: () => void;
  serviceType: InquiryServiceType;
  /** Omit when the inquiry isn't about one specific listing (e.g. a general "need a custom
   *  transfer?" prompt with no route picked yet) — still a valid, fully supported inquiry. */
  serviceId?: string;
  /** Display only — the backend re-resolves the authoritative name itself from serviceId. */
  serviceLabel?: string;
}

export default function RequestQuoteModal({ open, onClose, serviceType, serviceId, serviceLabel }: RequestQuoteModalProps) {
  const locale = useLocale();
  const { user } = useApp();
  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}` : "");
  const [phoneValue, setPhoneValue] = useState(user?.phone ?? "");
  const [emailValue, setEmailValue] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const fields = EXTRA_FIELDS[serviceType];

  function reset() {
    setMessage("");
    setExtra({});
    setErrors({});
    setSubmitError(null);
    setSent(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {
      name: required(name, "Please enter your full name") ?? "",
      phone: phoneValidator(phoneValue) ?? "",
    };
    if (emailValue.trim() && !EMAIL_RE.test(emailValue.trim())) next.email = "Enter a valid email address";
    const filtered = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
    setErrors(filtered);
    if (Object.keys(filtered).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitInquiry({
        name: name.trim(),
        phone: phoneValue.trim(),
        ...(emailValue.trim() ? { email: emailValue.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
        productType: serviceType,
        ...(serviceId ? { productId: serviceId } : {}),
        ...(Object.keys(extra).length > 0 ? { details: extra } : {}),
        locale: locale === "ar" ? "ar" : "en",
        source: "product_detail",
      });
      setSent(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={serviceLabel ? `Request a quote: ${serviceLabel}` : "Request a quote"}>
      {sent ? (
        <div role="status" className="space-y-3 py-6 text-center">
          <h3 className="font-display text-xl font-medium text-slate-900">Thanks, {name.split(" ")[0]}</h3>
          <p className="text-sm text-slate-600">We usually reply within one business day.</p>
          <Button variant="outline" onClick={handleClose} className="mt-2">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
            <Input label="Phone" type="tel" value={phoneValue} error={errors.phone} onChange={(e) => setPhoneValue(e.target.value)} />
          </div>
          <Input label="Email (optional)" type="email" value={emailValue} error={errors.email} onChange={(e) => setEmailValue(e.target.value)} />

          {fields.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((f) =>
                f.type === "date" ? (
                  <DateInput key={f.key} label={f.label} value={extra[f.key] ?? ""} onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))} />
                ) : (
                  <Input
                    key={f.key}
                    label={f.label}
                    type="number"
                    min={f.min}
                    value={extra[f.key] ?? ""}
                    onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                ),
              )}
            </div>
          ) : null}

          <div>
            <label htmlFor="quote-message" className="mb-1.5 block text-sm font-medium text-slate-700">
              Message (optional)
            </label>
            <textarea
              id="quote-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any additional requirements…"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </div>

          {submitError ? (
            <p role="alert" className="text-sm text-red-600">
              {submitError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send request"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
