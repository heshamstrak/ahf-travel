import { Suspense } from "react";
import type { Metadata } from "next";
import VerifyEmailView from "@/components/auth/VerifyEmailView";

export const metadata: Metadata = { title: "Verify Email", robots: { index: false, follow: false } };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="pt-32" aria-busy="true" />}>
      <VerifyEmailView />
    </Suspense>
  );
}
