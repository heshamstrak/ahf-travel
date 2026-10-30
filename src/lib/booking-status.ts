import type { BookingStatus, PaymentState, PaymentStatusView, QuoteProductType } from "@/lib/api/types";

export const PRODUCT_TYPE_LABEL: Record<QuoteProductType, string> = {
  HOTEL: "Hotel",
  TOUR: "Tour",
  CAR: "Car rental",
  TRANSFER: "Transfer",
  PACKAGE: "Package",
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export const BOOKING_STATUS_STYLE: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-gold-50 text-gold-700",
  CONFIRMED: "bg-brand-50 text-brand-700",
  COMPLETED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-50 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-500",
};

/** Deliberately never renders a plain "Paid" from this field alone — PAID here only ever means the
 *  backend itself confirmed collection (cash marked collected, or InstaPay approved by an admin). */
export const PAYMENT_STATUS_LABEL: Record<PaymentStatusView, string> = {
  UNPAID: "Not yet paid",
  PENDING: "Payment pending",
  PAID: "Paid",
  PAY_LATER: "Pay later",
  PARTIALLY_REFUNDED: "Partially refunded",
  REFUNDED: "Refunded",
  FAILED: "Payment failed",
};

export const PAYMENT_STATE_LABEL: Record<PaymentState, string> = {
  PENDING: "Not yet collected",
  REQUIRES_ACTION: "Action required",
  PENDING_VERIFICATION: "Pending verification",
  SUCCEEDED: "Confirmed",
  REJECTED: "Rejected",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export function isCancellable(status: BookingStatus): boolean {
  return status === "PENDING_PAYMENT" || status === "CONFIRMED";
}
