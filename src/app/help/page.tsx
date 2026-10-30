import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import ContentPage from "@/components/content/ContentPage";

export const metadata: Metadata = { title: "Help Center" };

export default function HelpPage() {
  return (
    <ContentPage
      title="Help Center"
      breadcrumb="Help"
      intro="Find answers quickly, or reach our team around the clock."
      sections={[
        {
          heading: "Popular topics",
          body: [
            "Changing or cancelling a booking: open My Bookings and select the booking you need.",
            "Finding your booking reference: it is in your confirmation email and on the success page.",
            "Paying: we accept Visa, Mastercard and Meeza. Some hotels and packages offer Pay Later.",
          ],
        },
        {
          heading: "Still need help?",
          body: ["Browse the FAQ by topic, or contact us using the details on the right."],
        },
      ]}
      aside={
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-medium text-slate-900">Contact support</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-brand-600" /> +20 2 1234 5678
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-brand-600" /> support@ahftravel.com
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle size={16} className="text-brand-600" /> Available 24/7
              </li>
            </ul>
          </div>
          <Link href="/faq" className="block rounded-2xl bg-brand-900 p-5 text-white hover:bg-brand-800">
            <p className="font-display text-lg font-medium">Read the FAQ</p>
            <p className="mt-1 text-sm text-brand-100">Answers on bookings, payments and cancellations.</p>
          </Link>
          <Link href="/contact" className="block rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 hover:border-brand-300">
            <p className="font-display text-lg font-medium">Send us a message</p>
            <p className="mt-1 text-sm text-slate-600">We reply within one business day.</p>
          </Link>
        </div>
      }
    />
  );
}
