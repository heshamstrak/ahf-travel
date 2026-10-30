import { Review } from "./types";
import { images } from "./images";

export const reviews: Review[] = [
  {
    id: "review-1",
    name: "Sophie Bennett",
    country: "United Kingdom",
    avatar: images.avatar(47),
    rating: 5,
    review:
      "Booking our hotel, Nile cruise and airport transfer all in one place saved us so much time. Everything was exactly as described and the driver was waiting for us right at arrivals.",
    tripType: "Family trip",
  },
  {
    id: "review-2",
    name: "Marco Rinaldi",
    country: "Italy",
    avatar: images.avatar(15),
    rating: 5,
    review:
      "The Luxor full-day tour was the highlight of our trip. Our guide was incredibly knowledgeable and the whole process from booking to pickup was seamless.",
    tripType: "Couple's trip",
  },
  {
    id: "review-3",
    name: "Aiko Tanaka",
    country: "Japan",
    avatar: images.avatar(28),
    rating: 4,
    review:
      "Great selection of hotels in Hurghada and the car rental made it easy to explore at our own pace. Customer support responded quickly when we needed to change our dates.",
    tripType: "Solo trip",
  },
];
