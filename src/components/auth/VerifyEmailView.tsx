"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import Button from "@/components/ui/Button";
import AuthShell from "./AuthShell";

type Status = "checking" | "verified" | "error";

export default function VerifyEmailView() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then((): Promise<"verified"> => {
        if (cancelled || !token) return Promise.reject(new Error("no-token"));
        return api.post("/auth/verify-email", { token }).then(() => "verified" as const);
      })
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          !token
            ? "This verification link is missing its token."
            : err instanceof ApiError
              ? err.message
              : "This link is invalid or has expired.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthShell title="Email verification" subtitle="Confirming your account." footer={null}>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        {status === "checking" && <p className="text-sm text-slate-500">Verifying your email…</p>}
        {status === "verified" && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={28} />
            </span>
            <p className="text-sm text-slate-600">Your email is verified. You can sign in now.</p>
            <Button href="/login">Sign in</Button>
          </>
        )}
        {status === "error" && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
              <XCircle size={28} />
            </span>
            <p className="text-sm text-slate-600">{message}</p>
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
