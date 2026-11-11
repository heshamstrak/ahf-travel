import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Set a New Password", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="pt-32" aria-busy="true" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
