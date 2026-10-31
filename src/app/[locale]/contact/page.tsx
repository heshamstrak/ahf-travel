import type { Metadata } from "next";
import ContactView from "@/components/content/ContactView";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact us"
        subtitle="Questions before you book, or help with an existing trip? We are here to help."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <div className="mx-auto max-w-8xl px-4 py-12 sm:px-6 lg:px-8">
        <ContactView />
      </div>
    </>
  );
}
