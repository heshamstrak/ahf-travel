"use client";

import { Link } from "@/i18n/navigation";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { email, hasErrors, phone as phoneValidator, required, Errors } from "@/lib/validation";
import { submitInquiry, SubmitInquiryInput } from "@/services/inquiries.service";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface ContactValues {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

const SUBJECT_OPTIONS = [
  { value: "booking", label: "Help with a booking" },
  { value: "pre-sale", label: "Question before booking" },
  { value: "payment", label: "Payment or invoice" },
  { value: "partner", label: "Partnership enquiry" },
  { value: "other", label: "Something else" },
];

/** The `?productType=` query param is written lowercase by ContactForPriceCta (e.g. "car",
 *  "conference_event"), but the backend's Inquiry DTO validates against its Prisma enum members,
 *  which are uppercase. An unrecognized value degrades to `undefined` rather than being sent
 *  through and rejected — the product link is a nice-to-have, not something that should block the
 *  message itself. */
const PRODUCT_TYPE_MAP: Record<string, SubmitInquiryInput["productType"]> = {
  hotel: "HOTEL",
  tour: "TOUR",
  car: "CAR",
  transfer: "TRANSFER",
  package: "PACKAGE",
  conference_event: "CONFERENCE_EVENT",
};

function normalizeProductType(raw: string | null): SubmitInquiryInput["productType"] | undefined {
  return raw ? PRODUCT_TYPE_MAP[raw.toLowerCase()] : undefined;
}

export default function ContactView() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const productType = normalizeProductType(searchParams.get("productType"));
  const productId = searchParams.get("productId");

  const [values, setValues] = useState<ContactValues>({ name: "", phone: "", email: "", subject: "booking", message: "" });
  const [errors, setErrors] = useState<Errors<ContactValues>>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Errors<ContactValues> = {
      name: required(values.name, "Please enter your name"),
      phone: phoneValidator(values.phone),
      email: email(values.email),
      message: values.message.trim().length < 10 ? "Message should be at least 10 characters" : undefined,
    };
    setErrors(next);
    if (hasErrors(next)) return;

    setSubmitting(true);
    setSubmitError(null);
    const subjectLabel = SUBJECT_OPTIONS.find((o) => o.value === values.subject)?.label;
    try {
      await submitInquiry({
        name: values.name,
        phone: values.phone,
        email: values.email,
        message: subjectLabel ? `[${subjectLabel}] ${values.message}` : values.message,
        locale: locale === "ar" ? "ar" : "en",
        source: productType && productId ? "product_detail" : "contact_form",
        ...(productType ? { productType } : {}),
        ...(productId ? { productId } : {}),
      });
      setSent(true);
    } catch {
      setSubmitError("Something went wrong sending your message. Please try again, or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        {sent ? (
          <div role="status" className="space-y-2 py-10 text-center">
            <h2 className="font-display text-2xl font-medium text-slate-900">Thank you, {values.name.split(" ")[0]}</h2>
            <p className="text-slate-600">Your message is on its way. We usually reply within one business day.</p>
            <Button className="mt-4" variant="outline" onClick={() => setSent(false)}>
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full name" value={values.name} error={errors.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
              <Input label="Phone" type="tel" value={values.phone} error={errors.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
            </div>
            <Input label="Email" type="email" value={values.email} error={errors.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
            <Select
              label="Topic"
              value={values.subject}
              onChange={(e) => setValues({ ...values, subject: e.target.value })}
              options={SUBJECT_OPTIONS}
            />
            <div>
              <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-slate-700">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={6}
                value={values.message}
                aria-invalid={Boolean(errors.message)}
                onChange={(e) => setValues({ ...values, message: e.target.value })}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  errors.message ? "border-red-400" : "border-slate-200"
                }`}
              />
              {errors.message ? <p className="mt-1.5 text-xs text-red-600">{errors.message}</p> : null}
            </div>
            {submitError ? (
              <p role="alert" className="text-sm text-red-600">
                {submitError}
              </p>
            ) : null}
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </section>

      <aside className="space-y-5">
        <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-medium text-slate-900">Reach us directly</h2>
          <ul className="space-y-4 text-sm text-slate-700">
            <li className="flex gap-3">
              <Phone size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <a href="tel:+20212345678" className="hover:text-brand-700">+20 2 1234 5678</a>
            </li>
            <li className="flex gap-3">
              <Mail size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <a href="mailto:support@ahftravel.com" className="hover:text-brand-700">support@ahftravel.com</a>
            </li>
            <li className="flex gap-3">
              <Clock size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <span>Support 24/7 for travellers on trip. Sales Sun–Thu, 09:00–18:00 (Cairo time).</span>
            </li>
            <li className="flex gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <span>Office address will be published here. Nile Corniche, Cairo, Egypt (placeholder).</span>
            </li>
          </ul>
        </div>
        <Link href="/faq" className="block rounded-2xl bg-brand-900 p-6 text-white hover:bg-brand-800">
          <p className="font-display text-lg font-medium">Check the FAQ first</p>
          <p className="mt-1 text-sm text-brand-100">Most questions are answered in under a minute.</p>
        </Link>
      </aside>
    </div>
  );
}
