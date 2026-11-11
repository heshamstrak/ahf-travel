import type { Metadata } from "next";
import FaqView from "@/components/content/FaqView";
import PageHeader from "@/components/ui/PageHeader";
import { faqCategories } from "@/data/faq";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, path: "/faq", title: "Frequently Asked Questions", description: "Answers to common questions about booking hotels, tours, cars, transfers and packages with AHF Travel." });
}

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
