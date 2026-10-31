import type { Metadata } from "next";
import ContentPage from "@/components/content/ContentPage";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms & Conditions"
      breadcrumb="Terms"
      intro="These terms govern your use of the AHF Travel website and any booking you make through it."
      updated="1 September 2026"
      sections={[
        {
          heading: "1. Using the site",
          body: ["You must be at least 18 years old to make a booking. You agree to provide accurate information when you create an account or book a product."],
        },
        {
          heading: "2. Bookings and prices",
          body: [
            "Prices are shown in your selected currency and include VAT and service fees where stated. Exchange rates are indicative and final charges are made in the currency of your payment method.",
            "A booking is confirmed when you receive a confirmation with a booking reference.",
          ],
        },
        {
          heading: "3. Third-party suppliers",
          body: ["Hotels, tour operators and car rental companies deliver the services you book. Their own house rules may also apply on arrival."],
        },
        {
          heading: "4. Cancellations and refunds",
          body: ["Cancellation terms are shown for each product. See our Cancellation Policy for details."],
        },
        {
          heading: "5. Liability",
          body: ["We act as an intermediary. Our liability is limited to the amount you paid for the affected booking, to the extent permitted by law."],
        },
        {
          heading: "6. Governing law",
          body: ["These terms are governed by the laws of the Arab Republic of Egypt."],
        },
      ]}
    />
  );
}
