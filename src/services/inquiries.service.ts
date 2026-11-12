import { api } from "@/lib/api/client";

export type InquiryServiceType = "HOTEL" | "TOUR" | "CAR" | "TRANSFER" | "PACKAGE" | "CONFERENCE_EVENT";

export interface SubmitInquiryInput {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  productType?: InquiryServiceType;
  productId?: string;
  /** Free-form label→value context (dates, guest/passenger counts, route, …) — resolved service
   *  details, never trusted data: the backend re-resolves the service from productId itself. */
  details?: Record<string, string>;
  locale: "en" | "ar";
  source: "contact_form" | "product_detail";
}

/** Public contact-form / "Request a Quote" submission. Unauthenticated, throttled server-side. */
export async function submitInquiry(input: SubmitInquiryInput): Promise<void> {
  await api.post("/inquiries", input);
}
