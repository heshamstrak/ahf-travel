"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin/auth";
import { AdminToastProvider } from "@/lib/admin/toast";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/ui";

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) router.replace("/admin/login");
    if (user && isLoginPage) router.replace("/admin");
  }, [loading, user, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }
  return <AdminShell>{children}</AdminShell>;
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminToastProvider>
        <Gate>{children}</Gate>
      </AdminToastProvider>
    </AdminAuthProvider>
  );
}
