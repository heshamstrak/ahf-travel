import type { Metadata } from "next";
import ContentPage from "@/components/content/ContentPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      breadcrumb="Privacy"
      intro="How we collect, use and protect your personal information."
      updated="1 September 2026"
      sections={[
        {
          heading: "What we collect",
          body: [
            "We collect the details you give us when booking or creating an account, such as your name, email, phone number and travel details. We also store your favorites and preferences on your device.",
          ],
        },
        {
          heading: "How we use it",
          body: ["We use your information to fulfil bookings, send confirmations, provide customer support and improve the platform."],
        },
        {
          heading: "Payments",
          body: ["Card details are handled by a PCI-compliant payment provider. This preview does not connect a payment gateway, so no card data is stored or processed."],
        },
        {
          heading: "Your rights",
          body: ["You can ask to view, correct or delete your personal data by contacting privacy@ahftravel.com."],
        },
      ]}
    />
  );
}
