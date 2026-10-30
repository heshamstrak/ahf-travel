import { reviews as mockReviews } from "@/data/reviews";
import { Review } from "@/data/types";

export async function getReviews(): Promise<Review[]> {
  return mockReviews;
}
