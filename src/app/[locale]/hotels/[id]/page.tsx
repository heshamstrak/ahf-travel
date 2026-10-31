import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import HotelDetail from "@/components/details/HotelDetail";
import { getHotelById, getRoomsForHotel } from "@/services/hotels.service";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const hotel = await getHotelById(id);
  return { title: hotel ? hotel.name : "Hotel not found" };
}

export default async function HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [hotel, rooms] = await Promise.all([getHotelById(id), getRoomsForHotel(id)]);
  if (!hotel) notFound();

  return (
    <>
      <div className="mx-auto max-w-8xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Hotels", href: "/hotels" }, { label: hotel.name }]} />
        </div>
        <HotelDetail hotel={hotel} rooms={rooms} />
      </div>
    </>
  );
}
