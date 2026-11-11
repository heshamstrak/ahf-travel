import { api } from "@/lib/api/client";

export interface SubmitInquiryInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  productType?: "HOTEL" | "TOUR" | "CAR" | "TRANSFER" | "PACKAGE" | "CONFERENCE_EVENT";
  productId?: string;
  locale: "en" | "ar";
  source: "contact_form" | "product_detail";
}

/** Public contact-form / "Request a Quote" submission. Unauthenticated, throttled server-side. */
export async function submitInquiry(input: SubmitInquiryInput): Promise<void> {
  await api.post("/inquiries", input);
}
