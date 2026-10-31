import type { Metadata } from "next";
import ContentPage from "@/components/content/ContentPage";

export const metadata: Metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <ContentPage
      title="Careers"
      breadcrumb="Careers"
      intro="Help travellers discover Egypt. We are a small team in Cairo building the travel platform of the future."
      sections={[
        {
          heading: "Open roles",
          body: [
            "We do not have open positions listed at the moment. We are always interested in talking to strong engineers, designers, travel specialists and Arabic-speaking customer experience staff.",
          ],
        },
        {
          heading: "Send us your details",
          body: ["Email your CV and a short note about what you would like to work on to careers@ahftravel.com. We reply to every application."],
        },
      ]}
    />
  );
}
