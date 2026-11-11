import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import ConferenceEventCard from "@/components/cards/ConferenceEventCard";
import { getConferenceEvents } from "@/services/conference-events.service";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/conferences-events",
    title: "Conferences & Events in Egypt",
    description: "Corporate events, conferences and group bookings organized across Egypt — venues, dates and quotes on request.",
  });
}

export default async function ConferenceEventsPage() {
  const items = await getConferenceEvents();

  return (
    <>
      <PageHeader
        title="Conferences & Events"
        subtitle="Corporate events, conferences and group bookings, organized across Egypt."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Conferences & Events" }]}
      />
      <div className="mx-auto max-w-8xl px-4 py-12 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <p className="py-16 text-center text-slate-500">No conferences or events are published yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ConferenceEventCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
