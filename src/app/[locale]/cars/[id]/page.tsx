import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CarDetail from "@/components/details/CarDetail";
import { getCarById } from "@/services/cars.service";
import { getLocations } from "@/services/locations.service";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const car = await getCarById(id);
  return { title: car ? car.name : "Car not found" };
}

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [car, locations] = await Promise.all([getCarById(id), getLocations({ type: "CAR_BRANCH" })]);
  if (!car) notFound();
  return <CarDetail car={car} locations={locations} />;
}
