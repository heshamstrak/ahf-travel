"use client";

import { Link } from "@/i18n/navigation";
import { FormEvent, useState } from "react";
import { MailCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { email, hasErrors, minLength, required, Errors } from "@/lib/validation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthShell from "./AuthShell";

interface RegisterValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: string;
}

export default function RegisterForm() {
  const [values, setValues] = useState<RegisterValues>({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", terms: "" });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors<RegisterValues>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const set = (key: keyof RegisterValues, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const next: Errors<RegisterValues> = {
      firstName: required(values.firstName, "First name is required"),
      lastName: required(values.lastName, "Last name is required"),
      email: email(values.email),
      password: minLength(values.password, 8),
      confirmPassword: values.confirmPassword !== values.password ? "Passwords do not match" : undefined,
      terms: agreed ? undefined : "Please accept the terms to create an account",
    };
    setErrors(next);
    if (hasErrors(next)) return;

    setSubmitting(true);
    try {
      await api.post("/auth/register", {
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      });
      setSent(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="One more step before you can sign in."
        footer={
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <MailCheck size={28} />
          </span>
          <p className="text-sm text-slate-600">
            We sent a verification link to <span className="font-semibold text-slate-900">{values.email}</span>. Open it to activate your account, then{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              sign in
            </Link>
            .
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save favorites, manage bookings and check out faster."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name" autoComplete="given-name" value={values.firstName} error={errors.firstName} onChange={(e) => set("firstName", e.target.value)} />
          <Input label="Last name" autoComplete="family-name" value={values.lastName} error={errors.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
        <Input label="Email" type="email" autoComplete="email" value={values.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          value={values.password}
          error={errors.password}
          onChange={(e) => set("password", e.target.value)}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
        />
        <div>
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 rounded border-slate-300 text-brand-600" />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-brand-700 underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-brand-700 underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms ? <p className="mt-1.5 text-xs text-red-600">{errors.terms}</p> : null}
        </div>
        {serverError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
