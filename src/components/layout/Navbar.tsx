"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Heart, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import NextImage from "next/image";
import { useApp } from "@/context/AppProvider";
import Button from "@/components/ui/Button";
import SettingsMenu from "./SettingsMenu";
import AccountMenu from "./AccountMenu";
import type { Branding } from "@/services/branding.service";
import { hexToRgba } from "@/lib/color";

const navLinks = [
  { key: "nav.home", href: "/" },
  { key: "nav.hotels", href: "/hotels" },
  { key: "nav.tours", href: "/tours" },
  { key: "nav.cars", href: "/cars" },
  { key: "nav.transfers", href: "/transfers" },
  { key: "nav.packages", href: "/packages" },
];

export default function Navbar({ branding }: { branding?: Branding } = {}) {
  const { user, signOut, favorites } = useApp();
  const t = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Solid header on inner pages, transparent over the home hero until scrolled.
  const isHome = pathname === "/";
  const solid = !isHome || scrolled || mobileOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const siteName = branding?.identity.siteName || "AHF Travel";
  const header = branding?.header ?? {};
  const hasBackgroundImage = Boolean(header.backgroundImageDesktop);
  // A configured background image always shows (it's the whole point of setting one); a plain
  // background color only replaces the default once the header has gone solid, so the
  // transparent-over-hero effect on the homepage is untouched when nothing has been configured.
  const customized = hasBackgroundImage || (solid && header.backgroundColor);

  const headerStyle: React.CSSProperties = {};
  if (hasBackgroundImage) {
    headerStyle.backgroundImage = `url(${header.backgroundImageDesktop})`;
    headerStyle.backgroundPosition = header.backgroundPosition || "center";
    headerStyle.backgroundSize = header.backgroundSize || "cover";
  } else if (solid && header.backgroundColor) {
    headerStyle.backgroundColor = hexToRgba(header.backgroundColor, header.transparency ?? 1);
  }
  if (header.headerHeight) headerStyle.height = header.headerHeight;

  const textColorStyle: React.CSSProperties | undefined = customized && header.textColor ? { color: header.textColor } : undefined;
  const navLinkColorStyle: React.CSSProperties | undefined = customized && header.navLinkColor ? { color: header.navLinkColor } : undefined;

  const linkClass = (active: boolean) =>
    `text-sm font-medium transition-colors ${
      navLinkColorStyle
        ? "hover:opacity-80"
        : active
          ? solid
            ? "text-brand-700"
            : "text-white"
          : solid
            ? "text-slate-700 hover:text-brand-700"
            : "text-white/90 hover:text-white"
    }`;

  // The admin dashboard (Milestone 6) has its own sidebar/top bar and never shows the customer
  // site's navigation. All hooks above still run on every render, so this is safe.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        customized ? "shadow-sm" : solid ? "bg-white/95 shadow-sm backdrop-blur-sm" : "bg-gradient-to-b from-black/50 to-transparent"
      }`}
      style={headerStyle}
    >
      {hasBackgroundImage && header.overlayColor ? (
        <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: hexToRgba(header.overlayColor, header.overlayOpacity ?? 0.3) }} />
      ) : null}
      <div className="relative mx-auto flex h-20 max-w-8xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" style={{ height: header.headerHeight || undefined }}>
        <Link href="/" className={`flex items-center font-display text-xl font-semibold tracking-tight ${solid || customized ? "text-brand-900" : "text-white"}`} style={textColorStyle}>
          {branding?.logoUrl ? (
            <NextImage src={branding.logoUrl} alt={siteName} width={header.logoWidth || 140} height={header.logoHeight || 40} className="h-auto w-auto object-contain" unoptimized />
          ) : (
            siteName
          )}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 xl:flex">
          {navLinks.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={linkClass(active)} style={navLinkColorStyle}>
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <SettingsMenu tone={solid ? "dark" : "light"} />
          <Link
            href="/favorites"
            aria-label={`${t("nav.favorites")} (${favorites.length})`}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              solid ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
            }`}
          >
            <Heart size={18} />
            {favorites.length > 0 ? (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-white">
                {favorites.length}
              </span>
            ) : null}
          </Link>
          <AccountMenu tone={solid ? "dark" : "light"} />
        </div>

        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full p-2 xl:hidden ${solid ? "text-slate-900" : "text-white"}`}
          aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.menu")}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>

      {mobileOpen ? (
        <div
          id="mobile-menu"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setMobileOpen(false);
          }}
          className="fixed inset-x-0 bottom-0 top-20 z-40 overflow-y-auto border-t border-slate-100 bg-white px-4 pb-8 pt-4 xl:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl px-3 py-3.5 text-base font-medium text-slate-800 hover:bg-sand-50">
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link href="/favorites" className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-sand-50">
              <Heart size={16} /> {t("nav.favorites")} ({favorites.length})
            </Link>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <SettingsMenu tone="dark" />
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6">
            {user ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-sand-50 px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                    {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
                  </span>
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <Link href="/profile" className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800">
                  {t("nav.myProfile")}
                </Link>
                <Link href="/my-bookings" className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800">
                  {t("nav.myBookings")}
                </Link>
                <Button variant="outline" onClick={signOut} className="w-full">
                  {t("nav.logout")}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800">
                  {t("nav.login")}
                </Link>
                <Button href="/register" variant="secondary" className="w-full">
                  {t("nav.register")}
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
