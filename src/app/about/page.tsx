import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/content/ContentPage";
import Button from "@/components/ui/Button";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <ContentPage
      title="About AHF Travel"
      breadcrumb="About"
      intro="We make it simple to plan an entire Egypt trip, from the first night's hotel to the last airport transfer, in one place."
      sections={[
        {
          heading: "Our mission",
          body: [
            "Egypt is one of the most rewarding countries in the world to explore, but planning a trip across Cairo, the Nile valley and the Red Sea can mean juggling many suppliers. AHF Travel brings hotels, tours, cars, transfers and packages together so you can book with confidence.",
            "We work with carefully vetted partners and focus on transparent prices, clear cancellation terms and support that speaks your language.",
          ],
        },
        {
          heading: "What we offer",
          body: [
            "Hotels: from Nile-view palaces in Cairo to all-inclusive Red Sea resorts, with honest guest ratings.",
            "Tours and experiences: licensed Egyptologists, felucca sails, Nile dinner cruises and snorkeling trips.",
            "Car rentals: economy to premium vehicles, collected at airports or your hotel.",
            "Airport and private transfers: fixed prices, flight tracking and professional drivers.",
            "Travel packages: complete itineraries that bundle everything for a stress-free trip.",
          ],
        },
        {
          heading: "How we work",
          body: [
            "Every price is shown with taxes and fees before you pay, and you always see the cancellation policy of each product before confirming.",
          ],
        },
      ]}
      aside={
        <div className="rounded-2xl bg-brand-900 p-6 text-white">
          <h2 className="font-display text-xl font-medium">Ready to plan?</h2>
          <p className="mt-2 text-sm text-brand-100">Start with a hotel, add a tour, and finish with a transfer in minutes.</p>
          <div className="mt-5 flex flex-col gap-3">
            <Button href="/packages">View Packages</Button>
            <Link href="/contact" className="text-center text-sm font-semibold text-brand-100 hover:text-white">
              Talk to our team
            </Link>
          </div>
        </div>
      }
    />
  );
}
