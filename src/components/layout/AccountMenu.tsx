"use client";

import { ChevronDown, LogOut, User as UserIcon, Briefcase } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useApp } from "@/context/AppProvider";
import Button from "@/components/ui/Button";

/** Single account dropdown replacing the old separate My Bookings / name / sign-out links.
 *  Logged out, it falls back to Login + Register actions instead. */
export default function AccountMenu({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user, signOut } = useApp();
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={`text-sm font-medium ${tone === "dark" ? "text-slate-700 hover:text-brand-700" : "text-white/90 hover:text-white"}`}>
          {t("login")}
        </Link>
        <Button href="/register" size="sm" variant={tone === "dark" ? "secondary" : "ghost"}>
          {t("register")}
        </Button>
      </div>
    );
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${user.firstName} ${user.lastName}`}
        className={`flex items-center gap-2 rounded-full py-1 pe-2 ps-1 text-sm font-medium transition-colors ${
          tone === "dark" ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800 ring-2 ring-white/40">
          {initials}
        </span>
        <span className="max-w-[9rem] truncate">{user.firstName}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div role="menu" className="absolute end-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-xl">
          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-sand-50">
            <UserIcon size={16} /> {t("myProfile")}
          </Link>
          <Link href="/my-bookings" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-sand-50">
            <Briefcase size={16} /> {t("myBookings")}
          </Link>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} /> {t("logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
