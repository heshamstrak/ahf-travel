"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Clock, Lock } from "lucide-react";
import { useApp } from "@/context/AppProvider";
import { api, ApiError, newIdempotencyKey } from "@/lib/api/client";
import type { BookingView, QuoteProductType, QuoteView } from "@/lib/api/types";
import { formatExact } from "@/lib/currency";
import { COUNTRIES, nameToCode } from "@/lib/countries";
import { formatDate } from "@/lib/dates";
import { productTitle, productSubtitle } from "@/lib/product-display";
import { email as validateEmail, hasErrors, phone as validatePhone, required, Errors } from "@/lib/validation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import PaymentPanel from "@/components/booking/PaymentPanel";

interface QuoteRequest {
  productType: QuoteProductType;
  productId: string;
  selection: Record<string, unknown>;
}

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  specialRequests: string;
}

const emptyCustomer: CustomerForm = { firstName: "", lastName: "", email: "", phone: "", country: "Egypt", specialRequests: "" };

function buildQuoteRequest(p: URLSearchParams): QuoteRequest | null {
  const type = p.get("type");
  switch (type) {
    case "hotel": {
      const productId = p.get("room");
      if (!productId) return null;
      return {
        productType: "HOTEL",
        productId,
        selection: {
          checkIn: p.get("checkIn") ?? "",
          checkOut: p.get("checkOut") ?? "",
          rooms: Number(p.get("rooms") ?? 1),
          adults: Number(p.get("guests") ?? 2),
          children: 0,
        },
      };
    }
    case "tour": {
      const productId = p.get("sessionId");
      if (!productId) return null;
      return { productType: "TOUR", productId, selection: { participants: Number(p.get("guests") ?? 2) } };
    }
    case "car": {
      const productId = p.get("id");
      const pickupLocationId = p.get("pickupLocationId");
      if (!productId || !pickupLocationId) return null;
      return {
        productType: "CAR",
        productId,
        selection: {
          pickupDate: p.get("pickupDate") ?? "",
          dropoffDate: p.get("dropoffDate") ?? "",
          pickupLocationId,
          driverAge: Number(p.get("driverAge") ?? 30),
        },
      };
    }
    case "transfer": {
      const productId = p.get("rateId");
      if (!productId) return null;
      return {
        productType: "TRANSFER",
        productId,
        selection: {
          date: p.get("date") ?? "",
          passengers: Number(p.get("passengers") ?? 1),
          luggage: Number(p.get("luggage") ?? 0),
        },
      };
    }
    case "package": {
      const productId = p.get("departureId");
      if (!productId) return null;
      return { productType: "PACKAGE", productId, selection: { adults: Number(p.get("guests") ?? 2), children: 0 } };
    }
    default:
      return null;
  }
}

function selectionDetails(quote: QuoteView): { label: string; value: string }[] {
  const s = quote.selection as Record<string, unknown>;
  const str = (v: unknown) => (v === undefined || v === null ? "—" : String(v));
  switch (quote.productType) {
    case "HOTEL":
      return [
        { label: "Check-in", value: formatDate(str(s.checkIn)) },
        { label: "Check-out", value: formatDate(str(s.checkOut)) },
        { label: "Nights", value: str(s.nights) },
        { label: "Rooms", value: str(s.rooms) },
        { label: "Adults", value: str(s.adults) },
        ...(Number(s.children) > 0 ? [{ label: "Children", value: str(s.children) }] : []),
      ];
    case "TOUR":
      return [{ label: "Participants", value: str(s.participants) }];
    case "CAR":
      return [
        { label: "Pick-up", value: formatDate(str(s.pickupDate)) },
        { label: "Drop-off", value: formatDate(str(s.dropoffDate)) },
        { label: "Driver age", value: str(s.driverAge) },
      ];
    case "TRANSFER":
      return [
        { label: "Date", value: formatDate(str(s.date)) },
        { label: "Passengers", value: str(s.passengers) },
        { label: "Luggage", value: str(s.luggage) },
      ];
    case "PACKAGE":
      return [
        { label: "Adults", value: str(s.adults) },
        ...(Number(s.children) > 0 ? [{ label: "Children", value: str(s.children) }] : []),
        ...(s.rooms !== undefined ? [{ label: "Rooms", value: str(s.rooms) }] : []),
      ];
    default:
      return [];
  }
}

export default function CheckoutView() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, currency } = useApp();
  const request = useMemo(() => buildQuoteRequest(params), [params]);

  const [quote, setQuote] = useState<QuoteView | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const bookingKeyRef = useRef(newIdempotencyKey());
  const [now, setNow] = useState(() => Date.now());

  const [step, setStep] = useState<"review" | "payment">("review");
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors<CustomerForm & { terms: string }>>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingView | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(() => {
      setCustomer((c) => ({ ...c, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? c.phone }));
    });
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchQuote = () => {
    if (!request) return;
    bookingKeyRef.current = newIdempotencyKey();
    Promise.resolve()
      .then(() => {
        setQuoteLoading(true);
        setQuoteError(null);
        return api.post<QuoteView>("/quotes", {
          productType: request.productType,
          productId: request.productId,
          selection: request.selection,
          displayCurrency: currency !== "EGP" ? currency : undefined,
        });
      })
      .then((result) => setQuote(result))
      .catch((err: unknown) => {
        setQuoteError(err instanceof ApiError ? err.message : "Could not price this booking. Please go back and try again.");
      })
      .finally(() => setQuoteLoading(false));
  };

  useEffect(() => {
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const msLeft = quote ? new Date(quote.expiresAt).getTime() - now : 0;
  const expired = quote ? quote.status === "EXPIRED" || msLeft <= 0 : false;
  const minutesLeft = Math.max(0, Math.floor(msLeft / 60000));
  const secondsLeft = Math.max(0, Math.floor((msLeft % 60000) / 1000));

  if (!request) {
    return (
      <EmptyState
        title="We could not find that booking"
        description="Your selection may be incomplete or the link may be broken. Start again from the listing."
        action={
          <Button href="/" variant="outline">
            Back to Home
          </Button>
        }
        icon={<AlertCircle size={24} />}
      />
    );
  }

  const setC = (key: keyof CustomerForm, value: string) => setCustomer((c) => ({ ...c, [key]: value }));

  const validate = () => {
    const next: Errors<CustomerForm & { terms: string }> = {
      firstName: required(customer.firstName, "First name is required"),
      lastName: required(customer.lastName, "Last name is required"),
      email: validateEmail(customer.email),
      phone: validatePhone(customer.phone),
      country: required(customer.country, "Select your country"),
      terms: terms ? undefined : "Please accept the terms to continue",
    };
    setErrors(next);
    return !hasErrors(next);
  };

  const submitBooking = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!quote || expired || !validate()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await api.post<BookingView>(
        "/bookings",
        {
          quoteId: quote.id,
          customer: {
            firstName: customer.firstName.trim(),
            lastName: customer.lastName.trim(),
            email: customer.email.trim(),
            phone: customer.phone.trim(),
            countryCode: nameToCode(customer.country),
          },
          specialRequests: customer.specialRequests.trim() || undefined,
        },
        { "Idempotency-Key": bookingKeyRef.current },
      );
      setBooking(result);
      setStep("payment");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 410 || err.status === 409)) {
        setCreateError("Your quote expired or was already used. We've fetched a new price — please review it and try again.");
        fetchQuote();
      } else {
        setCreateError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  };

  const title = quote ? productTitle(quote.productType, quote.product) : "";
  const subtitle = quote ? productSubtitle(quote.productType, quote.product) : "";
  const details = quote ? selectionDetails(quote) : [];

  return (
    <div className="mx-auto max-w-8xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Checkout" }]} />
      </div>
      <h1 className="font-display text-3xl font-medium text-slate-900 sm:text-4xl">Review & checkout</h1>
      <p className="mt-2 text-slate-600">
        {step === "review" ? "Your price is confirmed by our system before you pay." : "Choose how you'd like to pay."}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-8">
          {step === "review" ? (
            <form onSubmit={submitBooking} noValidate className="space-y-8" aria-label="Checkout">
              <section aria-labelledby="customer-title" className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <h2 id="customer-title" className="font-display text-xl font-medium text-slate-900">
                  Customer information
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="First name" autoComplete="given-name" value={customer.firstName} error={errors.firstName} onChange={(e) => setC("firstName", e.target.value)} />
                  <Input label="Last name" autoComplete="family-name" value={customer.lastName} error={errors.lastName} onChange={(e) => setC("lastName", e.target.value)} />
                  <Input label="Email" type="email" autoComplete="email" value={customer.email} error={errors.email} disabled={!!user} onChange={(e) => setC("email", e.target.value)} />
                  <Input label="Phone" type="tel" autoComplete="tel" value={customer.phone} error={errors.phone} hint="Include your country code" onChange={(e) => setC("phone", e.target.value)} />
                  <Select label="Country" value={customer.country} error={errors.country} onChange={(e) => setC("country", e.target.value)} options={COUNTRIES.map((c) => ({ value: c.name, label: c.name }))} />
                </div>
                {!user ? <p className="text-xs text-slate-500">Booking as a guest. You can also sign in first to track this in My Bookings.</p> : null}
                <div>
                  <label htmlFor="special" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Special requests <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="special"
                    rows={3}
                    value={customer.specialRequests}
                    onChange={(e) => setC("specialRequests", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    placeholder="Late arrival, dietary needs, child seat..."
                  />
                </div>
              </section>

              <section className="space-y-3">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600" />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" className="font-medium text-brand-700 underline">
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/cancellation-policy" className="font-medium text-brand-700 underline">
                      Cancellation Policy
                    </Link>
                    .
                  </span>
                </label>
                {errors.terms ? <p className="text-xs text-red-600">{errors.terms}</p> : null}
                {createError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{createError}</p> : null}
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={creating || quoteLoading || !quote || expired}>
                  {creating ? "Confirming…" : "Continue to payment"}
                </Button>
              </section>
            </form>
          ) : (
            <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl font-medium text-slate-900">Payment</h2>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock size={13} /> Reference {booking?.reference}
                </span>
              </div>
              {booking ? (
                <PaymentPanel booking={booking} email={customer.email.trim()} onCompleted={() => router.push(`/booking/success?ref=${booking.reference}&email=${encodeURIComponent(customer.email.trim())}`)} />
              ) : null}
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="summary-title" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 id="summary-title" className="font-display text-lg font-medium text-slate-900">
              Your selection
            </h2>
            {quoteLoading ? (
              <p className="mt-4 text-sm text-slate-500">Pricing your booking…</p>
            ) : quoteError ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-red-600">{quoteError}</p>
                <Button variant="outline" size="sm" onClick={fetchQuote}>
                  Try again
                </Button>
              </div>
            ) : quote ? (
              <>
                <div className="mt-3">
                  <p className="font-semibold text-slate-900">{title}</p>
                  {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
                </div>
                <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                  {details.map((d) => (
                    <div key={d.label} className="flex justify-between gap-3">
                      <dt className="text-slate-500">{d.label}</dt>
                      <dd className="truncate text-end font-medium text-slate-800">{d.value}</dd>
                    </div>
                  ))}
                </dl>
                <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  {quote.lines.map((line, i) => (
                    <div key={`${line.code}-${i}`} className="flex items-start justify-between gap-4">
                      <dt className="text-slate-600">{line.label}</dt>
                      <dd className="shrink-0 font-medium text-slate-900">{formatExact(line.amount, line.currency)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Subtotal</dt>
                    <dd className="font-medium text-slate-900">{formatExact(quote.totals.subtotal, quote.totals.currency)}</dd>
                  </div>
                  {Number(quote.totals.tax) > 0 ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Tax</dt>
                      <dd className="text-slate-900">{formatExact(quote.totals.tax, quote.totals.currency)}</dd>
                    </div>
                  ) : null}
                  {Number(quote.totals.fee) > 0 ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Service fee</dt>
                      <dd className="text-slate-900">{formatExact(quote.totals.fee, quote.totals.currency)}</dd>
                    </div>
                  ) : null}
                  {Number(quote.totals.discount) > 0 ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Discount</dt>
                      <dd className="text-emerald-700">-{formatExact(quote.totals.discount, quote.totals.currency)}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-display text-2xl font-semibold text-slate-900">{formatExact(quote.totals.total, quote.totals.currency)}</span>
                </div>
                {quote.display ? (
                  <p className="mt-1 text-end text-sm text-slate-500">≈ {formatExact(quote.display.total.amount, quote.display.total.currency)}</p>
                ) : null}

                {step === "review" ? (
                  <div className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm ${expired ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-800"}`}>
                    <Clock size={15} />
                    {expired ? (
                      <span>This price has expired.</span>
                    ) : (
                      <span>
                        Price holds for {minutesLeft}:{String(secondsLeft).padStart(2, "0")} minutes
                      </span>
                    )}
                  </div>
                ) : null}
                {expired && step === "review" ? (
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={fetchQuote}>
                    Refresh price
                  </Button>
                ) : null}
              </>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
