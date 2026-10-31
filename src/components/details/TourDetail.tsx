"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Globe, Info, MapPin, Star, Users, X } from "lucide-react";
import { Tour } from "@/data/types";
import type { TourSessionOffer } from "@/lib/api/types";
import { getTourSessions } from "@/services/tours.service";
import ImageGallery from "@/components/ui/ImageGallery";
import Accordion from "@/components/ui/Accordion";
import Stepper from "@/components/ui/Stepper";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import EstimateCard from "@/components/booking/EstimateCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

function sessionLabel(session: TourSessionOffer): string {
  const d = new Date(session.startsAt);
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time} (${session.remainingUnits} spots left)`;
}

export default function TourDetail({ tour }: { tour: Tour }) {
  const router = useRouter();
  const [guests, setGuests] = useState(2);
  const [sessions, setSessions] = useState<TourSessionOffer[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined;
        setLoadingSessions(true);
        setSessionsError(null);
        return getTourSessions(tour.id, guests);
      })
      .then((result) => {
        if (!result) return;
        if (cancelled) return;
        setSessions(result);
        setSessionId((current) => (current && result.some((s) => s.id === current) ? current : (result[0]?.id ?? null)));
      })
      .catch(() => {
        if (!cancelled) setSessionsError("Could not load available dates. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tour.id, guests]);

  const selectedSession = useMemo(() => sessions.find((s) => s.id === sessionId) ?? null, [sessions, sessionId]);
  const perPerson = selectedSession?.pricePerPerson ? Number(selectedSession.pricePerPerson.amount) : tour.startingPrice;
  const estimateEGP = perPerson * guests;

  const book = () => {
    if (!sessionId) return;
    const q = new URLSearchParams({ type: "tour", id: tour.id, sessionId, guests: String(guests) });
    router.push(`/checkout?${q.toString()}`);
  };

  return (
    <>
      <div className="mx-auto max-w-8xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tours", href: "/tours" }, { label: tour.title }]} />
        </div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-12">
            <ImageGallery images={tour.gallery} alt={tour.title} />

            <section className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">{tour.category}</span>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h1 className="font-display text-3xl font-medium text-slate-900 sm:text-4xl">{tour.title}</h1>
                <FavoriteButton type="tour" id={tour.id} label={tour.title} className="border border-slate-200" />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} /> {tour.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star size={15} className="fill-gold-500 text-gold-500" /> {tour.rating} ({tour.reviewCount.toLocaleString("en-US")} reviews)
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} /> {tour.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe size={15} /> {tour.languages.join(", ")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={15} /> Max {tour.maxGroupSize} people
                </span>
              </div>
            </section>

            <section aria-labelledby="overview" className="space-y-4">
              <h2 id="overview" className="font-display text-2xl font-medium text-slate-900">Overview</h2>
              <p className="leading-relaxed text-slate-700">{tour.overview}</p>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {tour.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check size={16} className="text-brand-600" /> {h}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="itinerary" className="space-y-4">
              <h2 id="itinerary" className="font-display text-2xl font-medium text-slate-900">Full itinerary</h2>
              <ol className="relative space-y-6 border-s border-brand-100 ps-6">
                {tour.itinerary.map((step) => (
                  <li key={step.time + step.title} className="relative">
                    <span className="absolute -start-[31px] top-1 h-3 w-3 rounded-full bg-brand-600 ring-4 ring-white" aria-hidden />
                    <p className="text-xs font-semibold text-brand-700">{step.time}</p>
                    <h3 className="font-medium text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="inclusions" className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h2 id="inclusions" className="font-display text-xl font-medium text-slate-900">What&apos;s included</h2>
                <ul className="mt-3 space-y-2">
                  {tour.included.map((i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-display text-xl font-medium text-slate-900">What&apos;s excluded</h2>
                <ul className="mt-3 space-y-2">
                  {tour.excluded.map((i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <X size={16} className="mt-0.5 shrink-0 text-slate-400" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section aria-labelledby="meeting" className="space-y-3">
              <h2 id="meeting" className="font-display text-xl font-medium text-slate-900">Meeting point</h2>
              <p className="flex gap-2 text-sm text-slate-700">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" /> {tour.meetingPoint}
              </p>
            </section>

            <section aria-labelledby="important" className="space-y-3">
              <h2 id="important" className="font-display text-xl font-medium text-slate-900">Important information</h2>
              <ul className="space-y-2 rounded-2xl bg-sand-50 p-5 text-sm text-slate-700">
                {tour.importantInfo.map((i) => (
                  <li key={i} className="flex gap-2">
                    <Info size={16} className="mt-0.5 shrink-0 text-gold-600" /> {i}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="cancel" className="space-y-3">
              <h2 id="cancel" className="font-display text-xl font-medium text-slate-900">Cancellation policy</h2>
              <p className="text-sm text-slate-700">{tour.cancellationPolicy}</p>
              <Link href="/cancellation-policy" className="text-sm font-semibold text-brand-700 hover:underline">
                Read the full policy
              </Link>
            </section>

            <section aria-labelledby="faq-tour">
              <h2 id="faq-tour" className="mb-4 font-display text-xl font-medium text-slate-900">Questions about this tour</h2>
              <Accordion
                defaultOpenId="a1"
                items={[
                  { id: "a1", title: "Is hotel pick-up included?", content: "Yes, pick-up from central Cairo, Giza or Luxor hotels is included in the price." },
                  { id: "a2", title: "Can children join?", content: "Children are welcome. Infants on laps are free, and child rates are shown at checkout where applicable." },
                ]}
              />
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {loadingSessions ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-medium text-slate-900">Select date & guests</h2>
                <p className="mt-3 text-sm text-slate-500">Loading available dates…</p>
              </div>
            ) : sessionsError ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-medium text-slate-900">Select date & guests</h2>
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {sessionsError}
                </p>
              </div>
            ) : sessions.length === 0 ? (
              // No sessions have been scheduled for this tour yet — show that plainly instead of a
              // booking form, price and action that can never actually complete.
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                <h2 className="font-display text-lg font-medium text-slate-900">Not yet available to book</h2>
                <p className="mt-2">This tour doesn&apos;t have any upcoming departure dates yet. Check back soon, or contact us for availability.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h2 className="font-display text-lg font-medium text-slate-900">Select date & guests</h2>
                  <Select
                    label="Available departure"
                    value={sessionId ?? ""}
                    onChange={(e) => setSessionId(e.target.value)}
                    options={sessions.map((s) => ({ value: s.id, label: sessionLabel(s) }))}
                  />
                  <div className="rounded-xl border border-slate-200 p-4">
                    <Stepper label="Guests" value={guests} min={1} max={tour.maxGroupSize} onChange={setGuests} />
                  </div>
                </div>

                <EstimateCard
                  image={tour.image}
                  title={tour.title}
                  subtitle={`${tour.location} · ${tour.duration}`}
                  quantityLabel={`${guests} guest(s)`}
                  estimateLabel={`${guests} × adult ticket`}
                  estimateEGP={selectedSession ? estimateEGP : null}
                />

                <Button className="w-full" size="lg" onClick={book} disabled={!sessionId}>
                  Book Now
                </Button>
              </>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
