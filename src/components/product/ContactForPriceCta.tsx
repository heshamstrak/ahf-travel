import { MessageCircle, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";

interface ContactForPriceCtaProps {
  productName: string;
  /** "tour" | "hotel" | "car" | "package" | "conference_event" — passed through to the contact
   *  page so the inquiry can be linked back to the product it was raised about. */
  productType: string;
  productId: string;
  whatsappNumber: string | null;
}

/** Replaces the price/checkout UI on any detail page when a product's pricingMode is
 *  CONTACT_FOR_PRICE: no price is shown anywhere, and booking is not offered — only a WhatsApp
 *  link and a Request a Quote action, matching the backend's hard rejection of a direct booking
 *  attempt on this product. */
export default function ContactForPriceCta({ productName, productType, productId, whatsappNumber }: ContactForPriceCtaProps) {
  const message = `Hi! I'd like to ask about pricing for "${productName}".`;
  const waHref = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}` : null;
  const contactHref = `/contact?productType=${encodeURIComponent(productType)}&productId=${encodeURIComponent(productId)}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-sand-50 p-5">
      <p className="font-display text-lg font-medium text-slate-900">Price on request</p>
      <p className="mt-1 text-sm text-slate-600">Contact us for pricing and availability on this one — we&apos;ll get back to you with a quote.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <MessageCircle size={16} />
            WhatsApp Us
          </a>
        ) : null}
        <Button href={contactHref} variant="outline" className="w-full sm:w-auto">
          <Send size={16} />
          Request a Quote
        </Button>
      </div>
      <Link href="/contact" className="mt-3 inline-block text-xs text-slate-500 hover:text-brand-700 hover:underline">
        Or visit our Contact page
      </Link>
    </div>
  );
}
