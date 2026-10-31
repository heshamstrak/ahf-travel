import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TourDetail from "@/components/details/TourDetail";
import { getTourById } from "@/services/tours.service";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tour = await getTourById(id);
  return { title: tour ? tour.title : "Tour not found" };
}

export default async function TourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await getTourById(id);
  if (!tour) notFound();
  return <TourDetail tour={tour} />;
}
