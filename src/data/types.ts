export type CurrencyCode = "EGP" | "USD" | "EUR";
export type LanguageCode = "en" | "ar";

export type ProductType = "hotel" | "tour" | "car" | "transfer" | "package";

export interface Destination {
  id: string;
  slug: string;
  name: string;
  country: string;
  image: string;
  listingsCount: number;
  listingsLabel: string;
  featured?: boolean;
}

export type HotelPropertyType = "Hotel" | "Resort" | "Apartment" | "Villa";

export interface Hotel {
  id: string;
  slug: string;
  name: string;
  destinationId: string;
  location: string;
  propertyType: HotelPropertyType;
  image: string;
  gallery: string[];
  description: string;
  starRating: number;
  guestRating: number;
  reviewCount: number;
  amenities: string[];
  pricePerNight: number;
  /** False for a published hotel with no priced room yet (e.g. just created in the admin
   *  dashboard) — pricePerNight is 0 in that case and must not be rendered as a real price. */
  priceAvailable: boolean;
  cancellationPolicy: string;
}

export interface Room {
  id: string;
  hotelId: string;
  name: string;
  image: string;
  capacity: number;
  bedType: string;
  sizeSqm: number;
  amenities: string[];
  pricePerNight: number;
  refundable: boolean;
}

export interface ItineraryItem {
  time: string;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  slug: string;
  title: string;
  category: string;
  destinationId: string;
  location: string;
  image: string;
  gallery: string[];
  duration: string;
  durationHours: number;
  rating: number;
  reviewCount: number;
  languages: string[];
  maxGroupSize: number;
  startingPrice: number;
  overview: string;
  highlights: string[];
  itinerary: ItineraryItem[];
  included: string[];
  excluded: string[];
  meetingPoint: string;
  importantInfo: string[];
  cancellationPolicy: string;
  availableDates: string[];
  startTimes: string[];
}

export type CarTransmission = "Automatic" | "Manual";

export interface Car {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  gallery: string[];
  passengers: number;
  bags: number;
  doors: number;
  transmission: CarTransmission;
  airConditioning: boolean;
  pricePerDay: number;
  mileageIncluded: string;
  fuelPolicy: string;
  depositEGP: number;
  insurance: string[];
  rentalConditions: string[];
  pickupInfo: string;
}

export type TransferVehicleType = "Sedan" | "SUV" | "Premium" | "Van" | "Minibus";

export interface TransferVehicle {
  id: string;
  type: TransferVehicleType;
  name: string;
  image: string;
  passengers: number;
  luggage: number;
  features: string[];
  basePriceEGP: number;
}

export interface PackageDay {
  day: number;
  title: string;
  description: string;
}

export interface TravelPackage {
  id: string;
  slug: string;
  title: string;
  destinationIds: string[];
  cities: string[];
  image: string;
  gallery: string[];
  duration: string;
  durationNights: number;
  budgetTier: "budget" | "mid" | "luxury";
  overview: string;
  hotel: { name: string; stars: number; description: string };
  toursIncluded: string[];
  transfersIncluded: string[];
  itinerary: PackageDay[];
  included: string[];
  excluded: string[];
  startingPrice: number;
  availableDates: string[];
}

export interface Review {
  id: string;
  name: string;
  country: string;
  avatar: string;
  rating: number;
  review: string;
  tripType: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  language: LanguageCode;
  currency: CurrencyCode;
  avatar: string;
}

