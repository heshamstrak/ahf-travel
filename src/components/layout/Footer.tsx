"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { useApp } from "@/context/AppProvider";
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "@/components/ui/SocialIcons";
import type { Branding } from "@/services/branding.service";

const columns = [
  {
    titleKey: "footer.explore",
    links: [
      { label: "Hotels", href: "/hotels" },
      { label: "Tours", href: "/tours" },
      { label: "Cars", href: "/cars" },
      { label: "Transfers", href: "/transfers" },
      { label: "Packages", href: "/packages" },
    ],
  },
  {
    titleKey: "footer.company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    titleKey: "footer.support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "FAQ", href: "/faq" },
      { label: "Cancellation Policy", href: "/cancellation-policy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const socials = [
  { icon: FacebookIcon, label: "Facebook", href: "https://facebook.com" },
  { icon: InstagramIcon, label: "Instagram", href: "https://instagram.com" },
  { icon: TwitterIcon, label: "Twitter", href: "https://twitter.com" },
  { icon: YoutubeIcon, label: "YouTube", href: "https://youtube.com" },
];

const paymentMethods = ["Visa", "Mastercard", "Meeza", "PayPal"];

export default function Footer({ branding }: { branding?: Branding } = {}) {
  const { t } = useApp();
  const pathname = usePathname();

  // The admin dashboard (Milestone 6) has its own layout and never shows the customer footer.
  if (pathname?.startsWith("/admin")) return null;

  const siteName = branding?.identity.siteName || "AHF Travel";
  const footerStyle: React.CSSProperties = {
    backgroundColor: "var(--site-footer-bg, var(--color-brand-950))",
    color: "var(--site-footer-text, var(--color-brand-100))",
  };

  return (
    <footer style={footerStyle}>
      <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-xl font-semibold text-white">
              {siteName}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200">
              Your all-in-one platform for hotels, tours, car rentals and airport transfers across Egypt.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-brand-200">
              <li className="flex items-center gap-3">
                <MapPin size={16} className="shrink-0 text-brand-300" />
                <span>Nile Corniche, Cairo, Egypt</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-brand-300" />
                <a href="tel:+20212345678" className="hover:text-white">
                  +20 2 1234 5678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-brand-300" />
                <a href="mailto:hello@ahftravel.com" className="hover:text-white">
                  hello@ahftravel.com
                </a>
              </li>
            </ul>
          </div>

          {columns.map((column) => (
            <div key={column.titleKey}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">{t(column.titleKey)}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-brand-200 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <social.icon width={16} height={16} />
              </a>
            ))}
          </div>

          <ul className="flex flex-wrap items-center gap-3 text-xs font-medium text-brand-200">
            {paymentMethods.map((method) => (
              <li key={method} className="rounded-md border border-white/15 px-3 py-1.5">
                {method}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-xs text-brand-300">{branding?.identity.footerCopyright || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}</p>
      </div>
    </footer>
  );
}
