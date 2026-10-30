/** Backend response shapes this app actually consumes. Mirrors the NestJS DTOs/service return
 *  types exactly (see backend/src/catalog/*, quotes/, bookings/, payments/) — not re-derived or
 *  guessed, so a shape mismatch here is a bug, not an assumption. */

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export interface PublicImage {
  url: string;
  altText: string;
  width: number;
  height: number;
  attribution: string | null;
  license: string | null;
  isCover: boolean;
}
export interface Money {
  amount: string;
  currency: string;
}
export interface RatingView {
  average: string | null;
  reviewCount: number;
}
export interface DestinationRef {
  id: string;
  slug: string;
  name: string;
}
export interface CancellationPolicyView {
  code: string;
  name: string;
  description: string;
  rules: unknown;
}

// ---------------------------------------------------------------- Destinations
export interface DestinationSummary {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  description: string | null;
  isFeatured: boolean;
  image: PublicImage | null;
  productCounts: { hotels: number; tours: number; packages: number };
}

// ---------------------------------------------------------------- Hotels
export interface StayEcho {
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number | null;
  rooms: number;
}
export interface HotelSummary {
  id: string;
  slug: string;
  name: string;
  propertyType: string;
  starRating: number;
  addressLine: string;
  destination: DestinationRef;
  guestRating: RatingView;
  amenities: string[];
  fromPricePerNight: Money | null;
  image: PublicImage | null;
  stay: StayEcho | null;
}
export interface HotelDetail extends Omit<HotelSummary, "image" | "stay"> {
  latitude: string | null;
  longitude: string | null;
  description: string;
  checkInTime: string;
  checkOutTime: string;
  images: PublicImage[];
}
export interface PublicRatePlan {
  id: string;
  code: string;
  name: string;
  mealPlan: string;
  isRefundable: boolean;
  currency: string;
  basePricePerNight: string;
  extraAdultPerNight: string | null;
  extraChildPerNight: string | null;
  cancellationPolicy: CancellationPolicyView;
}
export interface PublicRoom {
  id: string;
  code: string;
  name: string;
  bedType: string;
  baseOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  sizeSqm: number | null;
  features: string[];
  images: PublicImage[];
  ratePlans: PublicRatePlan[];
}

// ---------------------------------------------------------------- Tours
export interface TourSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  durationMinutes: number;
  maxGroupSize: number;
  languages: string[];
  meetingPoint: string;
  rating: RatingView;
  destination: DestinationRef;
  fromPricePerPerson: Money;
  image: PublicImage | null;
}
export interface TourDetail extends Omit<TourSummary, "image" | "fromPricePerPerson"> {
  overview: string;
  highlights: string[];
  included: string[];
  excluded: string[];
  importantInfo: string[];
  itinerary: { time: string; offsetMinutes: number; title: string; description: string }[];
  cancellationPolicy: CancellationPolicyView;
  fromPricePerPerson: Money;
  images: PublicImage[];
}
export interface TourSessionOffer {
  id: string;
  startsAt: string;
  remainingUnits: number;
  pricePerPerson: Money | null;
}

// ---------------------------------------------------------------- Cars
export interface RentalEcho {
  pickupDate: string;
  dropoffDate: string;
  days: number;
}
export interface CarSummary {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: string;
  transmission: string;
  hasAirConditioning: boolean;
  passengers: number;
  bags: number;
  doors: number;
  minDriverAge: number;
  pricePerDay: Money;
  image: PublicImage | null;
  rental: RentalEcho | null;
}
export interface CarDetail extends Omit<CarSummary, "image" | "rental"> {
  includedKmPerDay: number;
  fuelPolicy: string;
  deposit: Money;
  coverage: string[];
  rentalConditions: string[];
  pickupNotes: string | null;
  cancellationPolicy: CancellationPolicyView;
  images: PublicImage[];
}

// ---------------------------------------------------------------- Transfers
export interface VehicleClassView {
  id: string;
  code: string;
  name: string;
  passengersMax: number;
  luggageMax: number;
  features: string[];
  image: PublicImage | null;
}
export interface LocationRef {
  id: string;
  name: string;
  code: string | null;
  type: string;
}
export interface TransferRateView {
  id: string;
  amount: Money;
  durationMinutes: number;
  origin: LocationRef;
  destination: LocationRef;
  vehicleClass: Omit<VehicleClassView, "id">;
  validDate: string;
  priceBasis: "CONFIRMED" | "DEV_PLACEHOLDER";
  echo: { time: string | null; passengers: number; luggage: number };
}

// ---------------------------------------------------------------- Packages
export interface PackageSummary {
  id: string;
  slug: string;
  title: string;
  durationDays: number;
  durationNights: number;
  budgetTier: string;
  pricingBasis: string;
  startingPrice: Money;
  destinations: DestinationRef[];
  includes: { hotel: boolean; tours: boolean; transfers: boolean };
  nextDeparture: string | null;
  image: PublicImage | null;
}
export interface PackageDetail extends Omit<PackageSummary, "image" | "nextDeparture"> {
  overview: string;
  itinerary: { day: number; title: string; description: string }[];
  components: { hotel: { name: string; stars: number; description: string } | null; tours: string[]; transfers: string[] };
  included: string[];
  excluded: string[];
  pricing: {
    basis: string;
    basePrice: Money;
    singleSupplement: string | null;
    childPrice: string | null;
    extraPersonPrice: string | null;
    minTravellers: number;
    maxTravellers: number;
  };
  cancellationPolicy: CancellationPolicyView;
  images: PublicImage[];
}
export interface DepartureOffer {
  id: string;
  startsOn: string;
  remainingTravellers: number;
  priceOverride: Money | null;
}

// ---------------------------------------------------------------- Quotes
export type QuoteProductType = "HOTEL" | "TOUR" | "CAR" | "TRANSFER" | "PACKAGE";
export interface QuoteLine {
  kind: string;
  code: string;
  label: string;
  quantity: number;
  unitAmount: string | null;
  amount: string;
  currency: string;
  rate: string | null;
  note: string | null;
  rule: { code: string; kind: string; label: string } | null;
}
export interface QuoteTotals {
  subtotal: string;
  discount: string;
  surcharge: string;
  fee: string;
  tax: string;
  total: string;
  currency: string;
}
export interface QuoteView {
  id: string;
  productType: QuoteProductType;
  status: "ACTIVE" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  holdMinutes: number;
  currency: string;
  product: Record<string, unknown>;
  selection: Record<string, unknown>;
  lines: QuoteLine[];
  totals: QuoteTotals;
  display: { currency: string; rate: string; total: Money } | null;
  /** Only present once, in the create response, for a guest (no signed-in user). */
  guestToken?: string;
}

// ---------------------------------------------------------------- Bookings
export type BookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
export type PaymentStatusView = "UNPAID" | "PENDING" | "PAID" | "PAY_LATER" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED";
export interface BookingItemView {
  productType: QuoteProductType;
  startsAt: string;
  endsAt: string;
  quantity: number;
  adults: number | null;
  children: number | null;
  unitPrice: Money;
  lineTotal: Money;
  status: "HELD" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  details: Record<string, unknown>;
  product: Record<string, unknown>;
}
export interface BookingView {
  id: string;
  reference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatusView;
  currency: string;
  totals: QuoteTotals;
  customer: { firstName: string; lastName: string; email: string; phone: string; countryCode: string };
  specialRequests: string | null;
  cancellationPolicy: unknown;
  holdExpiresAt: string | null;
  holdMinutes: number;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  items: BookingItemView[];
}

// ---------------------------------------------------------------- Payments
export type PaymentState = "PENDING" | "REQUIRES_ACTION" | "PENDING_VERIFICATION" | "SUCCEEDED" | "REJECTED" | "FAILED" | "CANCELLED";
export interface PaymentView {
  id: string;
  method: "CASH" | "INSTAPAY" | "CARD" | "PAY_LATER";
  status: PaymentState;
  amount: string;
  currency: string;
  transferReference: string | null;
  proofSubmittedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}
export interface InstapayInstructions {
  recipientName: string;
  handle: string;
  instructionsText: string;
}

// ---------------------------------------------------------------- Auth
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  countryCode: string | null;
  language: string;
  currency: string;
  role: string;
  emailVerified: boolean;
}
export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: PublicUser;
}
