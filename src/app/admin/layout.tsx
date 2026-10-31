import type { Metadata } from "next";
import AdminGate from "./AdminGate";
import { jakarta, fraunces } from "@/lib/fonts";
import "../globals.css";

// Admin is a sibling root layout to the localized public site (see src/app/[locale]/layout.tsx) —
// neither shares a parent layout.tsx, so each must define its own <html>/<body> (Next.js's
// documented "multiple root layouts" pattern for independent top-level route trees), but both
// import the same font objects from src/lib/fonts.ts so next/font only loads each font once.
// This file stays a Server Component (metadata exports are not allowed from "use client" files);
// the auth-gated, hook-driven shell lives in ./AdminGate.tsx.

export const metadata: Metadata = {
  title: { default: "AHF Travel Admin", template: "%s | AHF Travel Admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.ico" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-white text-slate-900">
        <AdminGate>{children}</AdminGate>
      </body>
    </html>
  );
}
