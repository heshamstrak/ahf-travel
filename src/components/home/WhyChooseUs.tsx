import {
  BadgeCheck,
  CalendarClock,
  Compass,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

const benefits = [
  {
    icon: BadgeCheck,
    title: "Best Price Guarantee",
    description: "Competitive rates on hotels, tours, cars and transfers.",
  },
  {
    icon: Sparkles,
    title: "Handpicked Experiences",
    description: "Curated stays and activities vetted for quality.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Your transactions are protected end to end.",
  },
  {
    icon: HeartHandshake,
    title: "24/7 Support",
    description: "Our team is here whenever you need assistance.",
  },
  {
    icon: Compass,
    title: "Local Travel Experts",
    description: "Real knowledge of Egypt from people who live it.",
  },
  {
    icon: CalendarClock,
    title: "Flexible Booking",
    description: "Easily adjust plans as your trip evolves.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeader
        align="center"
        eyebrow="Why us"
        title="Why Travel With AHF Travel?"
      />

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <benefit.icon size={22} />
            </span>
            <div>
              <h3 className="font-display text-lg font-medium text-slate-900">
                {benefit.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {benefit.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
