import type { Metadata } from "next";

// page.tsx here is a client component (useApp()), which can't export metadata itself — this
// sibling layout carries it instead.
export const metadata: Metadata = { title: "My Bookings", robots: { index: false, follow: false } };

export default function MyBookingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
