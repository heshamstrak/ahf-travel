import { Suspense } from "react";
import type { Metadata } from "next";
import ContactView from "@/components/content/ContactView";
import PageHeader from "@/components/ui/PageHeader";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, path: "/contact", title: "Contact Us", description: "Get in touch with AHF Travel for help with an existing booking or questions before you book." });
}

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact us"
        subtitle="Questions before you book, or help with an existing trip? We are here to help."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <div className="mx-auto max-w-8xl px-4 py-12 sm:px-6 lg:px-8">
        <Suspense>
          <ContactView />
        </Suspense>
      </div>
    </>
  );
}
