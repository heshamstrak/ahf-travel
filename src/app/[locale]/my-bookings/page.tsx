"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useApp } from "@/context/AppProvider";
import MyBookingsView from "@/components/booking/MyBookingsView";
import { SkeletonBlock } from "@/components/ui/LoadingSkeleton";

export default function MyBookingsPage() {
  const { user, authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/my-bookings");
  }, [authLoading, user, router]);

  return (
    <>
      <div className="border-b border-slate-100 bg-sand-50">
        <div className="mx-auto max-w-8xl px-4 pb-8 pt-28 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-medium text-slate-900 sm:text-4xl">My Bookings</h1>
          <p className="mt-2 text-slate-600">Upcoming trips, past journeys and cancelled reservations in one place.</p>
        </div>
      </div>
      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
        {authLoading || !user ? (
          <div className="space-y-4" aria-busy="true">
            <SkeletonBlock className="h-40 w-full" />
            <SkeletonBlock className="h-40 w-full" />
          </div>
        ) : (
          <MyBookingsView />
        )}
      </div>
    </>
  );
}
