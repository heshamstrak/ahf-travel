"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useApp } from "@/context/AppProvider";
import { api, ApiError } from "@/lib/api/client";
import type { PublicUser } from "@/lib/api/types";
import { CURRENCIES, CURRENCY_LABELS } from "@/lib/currency";
import { COUNTRIES, codeToName } from "@/lib/countries";
import { hasErrors, minLength, phone as phoneValidator, required, Errors } from "@/lib/validation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface PersonalValues {
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
}

export default function ProfileForm({ user: initialUser }: { user: PublicUser }) {
  const { setCurrency, currency, refreshUser } = useApp();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [personal, setPersonal] = useState<PersonalValues>({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? "",
    countryCode: user.countryCode ?? "EG",
  });
  const [personalErrors, setPersonalErrors] = useState<Errors<PersonalValues>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [savingPersonal, setSavingPersonal] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<Errors<typeof passwords>>({});
  const [passwordServerError, setPasswordServerError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const savePersonal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(null);
    const next: Errors<PersonalValues> = {
      firstName: required(personal.firstName, "First name is required"),
      lastName: required(personal.lastName, "Last name is required"),
      phone: personal.phone ? phoneValidator(personal.phone) : undefined,
    };
    setPersonalErrors(next);
    if (hasErrors(next)) return;

    setSavingPersonal(true);
    try {
      const updated = await api.patch<PublicUser>("/users/me", {
        firstName: personal.firstName,
        lastName: personal.lastName,
        ...(personal.phone ? { phone: personal.phone } : {}),
        countryCode: personal.countryCode,
      });
      setUser(updated);
      await refreshUser();
      setSaved("Personal details saved.");
    } catch (err) {
      setSaved(null);
      setPersonalErrors({ firstName: err instanceof ApiError ? err.message : "Could not save your details." });
    } finally {
      setSavingPersonal(false);
    }
  };

  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordServerError(null);
    const next: Errors<typeof passwords> = {
      current: required(passwords.current, "Enter your current password"),
      next: minLength(passwords.next, 8, "New password"),
      confirm: passwords.confirm !== passwords.next ? "Passwords do not match" : undefined,
    };
    setPasswordErrors(next);
    if (hasErrors(next)) return;

    setSavingPassword(true);
    try {
      await api.put("/users/me/password", { currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: "", next: "", confirm: "" });
      setSaved("Password updated.");
    } catch (err) {
      setPasswordServerError(err instanceof ApiError ? err.message : "Could not update your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-800 ring-4 ring-brand-50">
          {personal.firstName.charAt(0).toUpperCase()}
          {personal.lastName.charAt(0).toUpperCase()}
        </div>
        <p className="mt-4 font-display text-lg font-medium text-slate-900">
          {personal.firstName} {personal.lastName}
        </p>
        <p className="text-sm text-slate-500">{user.email}</p>
        {!user.emailVerified ? <p className="mt-2 text-xs font-medium text-amber-700">Email not verified</p> : null}
        {saved ? (
          <p role="status" className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            {saved}
          </p>
        ) : null}
      </aside>

      <div className="min-w-0 space-y-8">
        <form onSubmit={savePersonal} noValidate className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-medium text-slate-900">Personal information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" value={personal.firstName} error={personalErrors.firstName} onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })} />
            <Input label="Last name" value={personal.lastName} error={personalErrors.lastName} onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })} />
            <Input label="Email" type="email" value={user.email} disabled hint="Email cannot be changed here" />
            <Input
              label="Phone"
              type="tel"
              value={personal.phone}
              error={personalErrors.phone}
              hint="E.164 format, e.g. +201001234567"
              onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
            />
            <Select
              label="Country"
              value={codeToName(personal.countryCode)}
              onChange={(e) => setPersonal({ ...personal, countryCode: COUNTRIES.find((c) => c.name === e.target.value)?.code ?? "EG" })}
              options={COUNTRIES.map((c) => ({ value: c.name, label: c.name }))}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={savingPersonal}>
              {savingPersonal ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>

        <form onSubmit={changePassword} noValidate className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-medium text-slate-900">Password</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Current password" type="password" autoComplete="current-password" value={passwords.current} error={passwordErrors.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
            <Input label="New password" type="password" autoComplete="new-password" value={passwords.next} error={passwordErrors.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} />
            <Input label="Confirm new password" type="password" autoComplete="new-password" value={passwords.confirm} error={passwordErrors.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
          </div>
          {passwordServerError ? <p className="text-sm text-red-600">{passwordServerError}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={savingPassword}>
              {savingPassword ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>

        <section className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-medium text-slate-900">Preferences</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Language"
              value={locale}
              onChange={(e) => router.replace(pathname, { locale: e.target.value as "en" | "ar" })}
              options={[
                { value: "en", label: "English" },
                { value: "ar", label: "العربية (Arabic)" },
              ]}
            />
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "EGP" | "USD" | "EUR")}
              options={CURRENCIES.map((c) => ({ value: c, label: `${c} · ${CURRENCY_LABELS[c]}` }))}
            />
          </div>
          <p className="text-xs text-slate-500">Language and currency apply immediately across the site and are remembered on this device.</p>
        </section>
      </div>
    </div>
  );
}
