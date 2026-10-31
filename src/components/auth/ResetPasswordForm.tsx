"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { hasErrors, minLength, Errors } from "@/lib/validation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthShell from "./AuthShell";

interface Values {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [values, setValues] = useState<Values>({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Errors<Values>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <AuthShell
        title="Invalid link"
        subtitle="This password reset link is incomplete."
        footer={
          <Link href="/forgot-password" className="font-semibold text-brand-700 hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-slate-600">This password reset link is missing its token. Request a new one from the sign-in page.</p>
      </AuthShell>
    );
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const next: Errors<Values> = {
      newPassword: minLength(values.newPassword, 8),
      confirmPassword: values.confirmPassword !== values.newPassword ? "Passwords do not match" : undefined,
    };
    setErrors(next);
    if (hasErrors(next)) return;

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: values.newPassword });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "This link is invalid or has expired.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="Your password has been changed." footer={null}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={28} />
          </span>
          <p className="text-sm text-slate-600">Redirecting you to sign in…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your account." footer={null}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label="New password" type="password" autoComplete="new-password" hint="At least 8 characters" value={values.newPassword} error={errors.newPassword} onChange={(e) => setValues({ ...values, newPassword: e.target.value })} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={values.confirmPassword} error={errors.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} />
        {serverError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthShell>
  );
}
