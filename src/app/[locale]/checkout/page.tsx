import { Suspense } from "react";
import type { Metadata } from "next";
import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-8xl px-4 pb-16 pt-32 sm:px-6 lg:px-8" aria-busy="true" />}>
      <CheckoutView />
    </Suspense>
  );
}
