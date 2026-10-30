import type { Metadata } from "next";
import ContentPage from "@/components/content/ContentPage";

export const metadata: Metadata = { title: "Cancellation Policy" };

export default function CancellationPolicyPage() {
  return (
    <ContentPage
      title="Cancellation Policy"
      breadcrumb="Cancellation Policy"
      intro="Cancellation terms depend on the product you booked. The rules below apply unless the product page says otherwise."
      updated="1 September 2026"
      sections={[
        {
          heading: "Hotels",
          body: ["Refundable rooms can be cancelled free of charge up to the deadline shown on the room and booking summary, usually 48 to 72 hours before check-in. Non-refundable rates cannot be changed or refunded."],
        },
        {
          heading: "Tours and experiences",
          body: ["Most tours can be cancelled free of charge up to 24 hours before the start time. Weather-related cancellations by the operator are refunded in full."],
        },
        {
          heading: "Car rentals",
          body: ["Cancellations made at least 72 hours before pick-up are free. Later cancellations may be charged one day's rental."],
        },
        {
          heading: "Transfers and packages",
          body: ["Transfers can be cancelled up to 24 hours before pick-up. Packages follow the policy of their most restrictive component, which is shown before you confirm."],
        },
        {
          heading: "How to cancel",
          body: ["Open the booking from My Bookings and choose Cancel booking. Refunds are returned to the original payment method within 7 to 14 business days."],
        },
      ]}
    />
  );
}
