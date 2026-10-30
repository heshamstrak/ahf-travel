"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { email } from "@/lib/validation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthShell from "./AuthShell";

export default function ForgotPasswordForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = email(value);
    setError(err);
    if (err) return;
    // Always shows the same "sent" message regardless of outcome — the backend itself never
    // reveals whether an account exists for this address, so neither does this form.
    try {
      await api.post("/auth/forgot-password", { email: value });
    } catch {
      // intentionally ignored, see above
    }
    setSent(true);
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email linked to your account and we will send a reset link."
      footer={
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div role="status" className="flex gap-3 rounded-2xl bg-brand-50 p-5 text-sm text-brand-900">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-brand-600" />
          <p>
            If an account exists for <span className="font-semibold">{value}</span>, a reset link is on its way. Check your inbox and spam folder.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Input label="Email" type="email" autoComplete="email" value={value} error={error} onChange={(e) => setValue(e.target.value)} />
          <Button type="submit" className="w-full" size="lg">
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
