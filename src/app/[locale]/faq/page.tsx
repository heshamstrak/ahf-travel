import type { Metadata } from "next";
import FaqView from "@/components/content/FaqView";
import PageHeader from "@/components/ui/PageHeader";
import { faqCategories } from "@/data/faq";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        subtitle="Quick answers about bookings, hotels, tours, cars, transfers, payments and cancellations."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <FaqView categories={faqCategories} />
      </div>
    </>
  );
}
