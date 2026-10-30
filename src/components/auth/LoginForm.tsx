"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppProvider";
import { ApiError } from "@/lib/api/client";
import { email, minLength, hasErrors, Errors } from "@/lib/validation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthShell from "./AuthShell";

interface LoginValues {
  email: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useApp();
  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Errors<LoginValues>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const next: Errors<LoginValues> = { email: email(values.email), password: minLength(values.password, 8) };
    setErrors(next);
    if (hasErrors(next)) return;

    setSubmitting(true);
    try {
      await signIn(values.email, values.password);
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile");
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setServerError("Please verify your email address before signing in. Check your inbox for the verification link.");
      } else if (err instanceof ApiError && err.code === "ACCOUNT_LOCKED") {
        setServerError(err.message);
      } else if (err instanceof ApiError) {
        setServerError("Email or password is incorrect.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your bookings, favorites and profile."
      footer={
        <>
          New to AHF Travel?{" "}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label="Email" type="email" autoComplete="email" value={values.email} error={errors.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
        <div>
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={values.password}
            error={errors.password}
            onChange={(e) => setValues({ ...values, password: e.target.value })}
          />
          <div className="mt-2 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="rounded border-slate-300 text-brand-600" />
              Show password
            </label>
            <Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        {serverError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="rounded-xl bg-sand-50 p-3 text-xs text-slate-500">
          Guest checkout is always available — you only need an account to see My Bookings in one place and save favorites.
        </p>
      </form>
    </AuthShell>
  );
}
