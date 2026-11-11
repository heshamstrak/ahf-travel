import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";

// Shared between the two independent root layouts (src/app/[locale]/layout.tsx and
// src/app/admin/layout.tsx) so next/font only ever loads each font once, not once per root.
export const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});
