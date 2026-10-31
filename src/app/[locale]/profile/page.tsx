"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useApp } from "@/context/AppProvider";
import ProfileForm from "@/components/profile/ProfileForm";
import { SkeletonBlock } from "@/components/ui/LoadingSkeleton";

export default function ProfilePage() {
  const { user, authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  return (
    <>
      <div className="border-b border-slate-100 bg-sand-50">
        <div className="mx-auto max-w-8xl px-4 pb-8 pt-28 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-medium text-slate-900 sm:text-4xl">Your profile</h1>
          <p className="mt-2 text-slate-600">Manage your personal details, password and travel preferences.</p>
        </div>
      </div>
      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
        {authLoading || !user ? (
          <div className="space-y-4" aria-busy="true">
            <SkeletonBlock className="h-64 w-full" />
          </div>
        ) : (
          <ProfileForm user={user} />
        )}
      </div>
    </>
  );
}
