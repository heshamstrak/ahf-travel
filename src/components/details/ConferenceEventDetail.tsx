"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { ConferenceEvent } from "@/data/types";
import type { ConferenceEventSessionOffer } from "@/lib/api/types";
import { getConferenceEventSessions } from "@/services/conference-events.service";
import ImageGallery from "@/components/ui/ImageGallery";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EstimateCard from "@/components/booking/EstimateCard";
import ContactForPriceCta from "@/components/product/ContactForPriceCta";

function sessionLabel(session: ConferenceEventSessionOffer): string {
  const d = new Date(session.startsAt);
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time} (${session.remainingSeats} seats left)`;
}

export default function ConferenceEventDetail({ item, whatsappNumber }: { item: ConferenceEvent; whatsappNumber: string | null }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ConferenceEventSessionOffer[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bookable = item.pricingMode === "FIXED_PRICE";
  const [loadingSessions, setLoadingSessions] = useState(bookable);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookable) return;
    let cancelled = false;
    getConferenceEventSessions(item.slug || item.id)
      .then((result) => {
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
  }, [item.id, item.slug, bookable]);

  const selectedSession = useMemo(() => sessions.find((s) => s.id === sessionId) ?? null, [sessions, sessionId]);
  const perSeat = selectedSession?.priceOverride ? Number(selectedSession.priceOverride.amount) : item.startingPrice ?? 0;

  const book = () => {
    if (!sessionId) return;
    const q = new URLSearchParams({ type: "conference_event", id: item.id, sessionId });
    router.push(`/checkout?${q.toString()}`);
  };

  return (
    <div className="mx-auto max-w-8xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Conferences & Events", href: "/conferences-events" }, { label: item.name }]} />
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-12">
          <ImageGallery images={item.gallery} alt={item.name} />

          <section className="space-y-4">
            <h1 className="font-display text-3xl font-medium text-slate-900 sm:text-4xl">{item.name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {item.venue ? (
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} /> {item.venue}
                </span>
              ) : null}
              {item.organizerName ? (
                <span className="flex items-center gap-1.5">
                  <Building2 size={15} /> {item.organizerName}
                </span>
              ) : null}
            </div>
            <p className="leading-relaxed text-slate-700">{item.description}</p>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {!bookable ? (
            <ContactForPriceCta productName={item.name} productType="conference_event" productId={item.id} whatsappNumber={whatsappNumber} />
          ) : loadingSessions ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium text-slate-900">Select a session</h2>
              <p className="mt-3 text-sm text-slate-500">Loading available dates…</p>
            </div>
          ) : sessionsError ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium text-slate-900">Select a session</h2>
              <p role="alert" className="mt-3 text-sm text-red-600">
                {sessionsError}
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              <h2 className="font-display text-lg font-medium text-slate-900">Not yet available to book</h2>
              <p className="mt-2">This event doesn&apos;t have any upcoming sessions yet. Check back soon, or contact us for availability.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-medium text-slate-900">Select a session</h2>
                <Select
                  label="Available session"
                  value={sessionId ?? ""}
                  onChange={(e) => setSessionId(e.target.value)}
                  options={sessions.map((s) => ({ value: s.id, label: sessionLabel(s) }))}
                />
              </div>

              <EstimateCard
                image={item.image}
                title={item.name}
                subtitle={item.venue}
                quantityLabel="1 seat"
                estimateLabel="Per seat"
                estimateEGP={selectedSession ? perSeat : null}
              />

              <Button className="w-full" size="lg" onClick={book} disabled={!sessionId}>
                Book Now
              </Button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
