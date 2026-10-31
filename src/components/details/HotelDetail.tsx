"use client";

import { Link, useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useState } from "react";
import { BedDouble, Check, MapPin, Maximize2, Users } from "lucide-react";
import { Hotel, Room } from "@/data/types";
import { nightsBetween, addDays, businessToday } from "@/lib/dates";
import { useApp } from "@/context/AppProvider";
import ImageGallery from "@/components/ui/ImageGallery";
import Stepper from "@/components/ui/Stepper";
import Button from "@/components/ui/Button";
import DateInput from "@/components/ui/DateInput";
import FavoriteButton from "@/components/ui/FavoriteButton";
import PriceDisplay from "@/components/ui/PriceDisplay";
import EstimateCard from "@/components/booking/EstimateCard";
import { formatMoney } from "@/lib/currency";

export default function HotelDetail({ hotel, rooms }: { hotel: Hotel; rooms: Room[] }) {
  const router = useRouter();
  const { currency } = useApp();
  const [checkIn, setCheckIn] = useState(() => businessToday());
  const [checkOut, setCheckOut] = useState(() => addDays(businessToday(), 2));
  const [guests, setGuests] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nights = nightsBetween(checkIn, checkOut);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;
  const estimateEGP = selectedRoom && nights > 0 ? selectedRoom.pricePerNight * nights * roomCount : null;

  const bookHref = (roomId: string) =>
    `/checkout?${new URLSearchParams({
      type: "hotel",
      id: hotel.id,
      room: roomId,
      checkIn,
      checkOut,
      guests: String(guests),
      rooms: String(roomCount),
    }).toString()}`;

  const bookNow = () => {
    if (!selectedRoom) {
      setError("Select a room to continue.");
      return;
    }
    if (nights <= 0) {
      setError("Check-out must be after check-in.");
      return;
    }
    setError(null);
    router.push(bookHref(selectedRoom.id));
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-12">
        <ImageGallery images={hotel.gallery} alt={hotel.name} />

        <section aria-labelledby="overview" className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1 text-gold-500" aria-label={`${hotel.starRating} star ${hotel.propertyType.toLowerCase()}`}>
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" width="14" height="14" className="fill-gold-500" aria-hidden>
                    <path d="M12 2l2.9 6.9L22 9.7l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.5L2 9.7l7.1-.8z" />
                  </svg>
                ))}
                <span className="ms-2 text-sm font-medium text-slate-600">{hotel.propertyType}</span>
              </div>
              <h1 className="mt-2 font-display text-3xl font-medium text-slate-900 sm:text-4xl">{hotel.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-slate-600">
                <MapPin size={16} /> {hotel.location}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-brand-700 px-3.5 py-2 text-white">
                <span className="font-display text-xl font-semibold">{hotel.guestRating}</span>
                <span className="text-xs">
                  Exceptional
                  <br />
                  {hotel.reviewCount.toLocaleString("en-US")} reviews
                </span>
              </div>
              <FavoriteButton type="hotel" id={hotel.id} label={hotel.name} className="border border-slate-200" />
            </div>
          </div>
          <p className="leading-relaxed text-slate-700">{hotel.description}</p>
        </section>

        <section aria-labelledby="amenities" className="space-y-4">
          <h2 id="amenities" className="font-display text-2xl font-medium text-slate-900">
            Amenities
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {hotel.amenities.map((a) => (
              <li key={a} className="flex items-center gap-2.5 text-sm text-slate-700">
                <Check size={16} className="text-brand-600" /> {a}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="map" className="space-y-4">
          <h2 id="map" className="font-display text-2xl font-medium text-slate-900">
            Location
          </h2>
          <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 via-sand-100 to-gold-100">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#0b2b2822_1px,transparent_1px),linear-gradient(90deg,#0b2b2822_1px,transparent_1px)] [background-size:32px_32px]" aria-hidden />
            <div className="relative flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg">
                <MapPin size={22} />
              </span>
              <p className="font-semibold text-slate-900">{hotel.location}</p>
              <p className="text-sm text-slate-600">Interactive map will load here once maps are connected.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="rooms" className="space-y-5">
          <h2 id="rooms" className="font-display text-2xl font-medium text-slate-900">
            Available rooms
          </h2>
          {rooms.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Rooms for this property haven&apos;t been published yet. Check back soon, or contact us for availability.
            </p>
          ) : (
          <div className="space-y-4" role="radiogroup" aria-label="Choose a room">
            {rooms.map((room) => {
              const selected = room.id === selectedRoomId;
              const total = room.pricePerNight * Math.max(1, nights) * roomCount;
              return (
                <article
                  key={room.id}
                  className={`flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow sm:flex-row ${
                    selected ? "border-brand-600 ring-2 ring-brand-600/25" : "border-slate-100 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="relative h-48 shrink-0 sm:h-auto sm:w-64">
                    <Image src={room.image} alt={room.name} fill sizes="(min-width: 640px) 256px, 100vw" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-medium text-slate-900">{room.name}</h3>
                        <span
                          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            room.refundable ? "bg-brand-50 text-brand-700" : "bg-gold-50 text-gold-700"
                          }`}
                        >
                          {room.refundable ? "Free cancellation" : "Non-refundable"}
                        </span>
                      </div>
                      <div className="text-end">
                        <PriceDisplay amountEGP={room.pricePerNight} suffix="/night" className="font-display text-lg font-semibold text-slate-900" />
                        {nights > 0 ? (
                          <p className="text-xs text-slate-500">
                            {formatMoney(total, currency)} for {nights} night{nights > 1 ? "s" : ""}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <BedDouble size={15} /> {room.bedType}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Users size={15} /> Up to {room.capacity} guests
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Maximize2 size={15} /> {room.sizeSqm} m²
                      </li>
                    </ul>
                    <ul className="flex flex-wrap gap-1.5">
                      {room.amenities.map((a) => (
                        <li key={a} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs text-slate-600">
                          {a}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-2">
                      <Button
                        variant={selected ? "secondary" : "outline"}
                        size="sm"
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setError(null);
                        }}
                      >
                        {selected ? "Room selected" : "Select Room"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </section>

        <section aria-labelledby="policy" className="rounded-2xl bg-sand-50 p-6">
          <h2 id="policy" className="font-display text-xl font-medium text-slate-900">
            Cancellation
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{hotel.cancellationPolicy}</p>
          <Link href="/cancellation-policy" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Read our full cancellation policy
          </Link>
        </section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        {rooms.length === 0 ? (
          // No published, bookable rooms exist for this hotel yet — show that plainly instead of
          // a booking form, price and action that can never actually complete.
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            <h2 className="font-display text-lg font-medium text-slate-900">Not yet available to book</h2>
            <p className="mt-2">This property doesn&apos;t have any bookable rooms yet. Check back soon, or contact us for availability.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium text-slate-900">Your stay</h2>
              <div className="grid grid-cols-2 gap-3">
                <DateInput label="Check-in" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                <DateInput label="Check-out" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <Stepper label="Guests" value={guests} min={1} max={8} onChange={setGuests} />
                <Stepper label="Rooms" value={roomCount} min={1} max={4} onChange={setRoomCount} />
              </div>
              {nights <= 0 ? <p className="text-sm text-red-600">Check-out must be after check-in.</p> : null}
            </div>

            {selectedRoom ? (
              <EstimateCard
                image={selectedRoom.image}
                title={hotel.name}
                subtitle={`${selectedRoom.name} · ${hotel.location}`}
                quantityLabel={`${nights} night(s), ${roomCount} room(s), ${guests} guest(s)`}
                estimateLabel={`${selectedRoom.name} × ${roomCount} room(s) × ${Math.max(1, nights)} night(s)`}
                estimateEGP={estimateEGP}
              >
                <p className="text-xs leading-relaxed text-slate-500">{hotel.cancellationPolicy}</p>
              </EstimateCard>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                Select a room to see your booking summary and total price.
              </div>
            )}

            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}
            <Button className="w-full" size="lg" onClick={bookNow}>
              Book Now
            </Button>
            <p className="text-center text-xs text-slate-500">You won&apos;t be charged yet. Choose Cash or InstaPay at checkout.</p>
          </>
        )}
      </aside>
    </div>
  );
}
