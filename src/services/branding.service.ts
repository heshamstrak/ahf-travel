import { API_BASE } from "@/lib/api/server";

export interface BrandingIdentity {
  siteName?: string;
  tagline?: string;
  description?: string;
  footerCopyright?: string;
}
export interface BrandingHeader {
  backgroundColor?: string;
  textColor?: string;
  navLinkColor?: string;
  transparency?: number;
  logoWidth?: number;
  logoHeight?: number;
  headerHeight?: number;
  backgroundPosition?: string;
  backgroundSize?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  backgroundImageDesktop?: string | null;
  backgroundImageMobile?: string | null;
}
export interface BrandingTheme {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  footerBackgroundColor?: string;
  footerTextColor?: string;
}
export interface BrandingHero {
  title?: string;
  subtitle?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  textAlign?: string;
  buttonText?: string;
  buttonHref?: string;
  backgroundImageDesktop?: string | null;
  backgroundImageMobile?: string | null;
}
export interface Branding {
  identity: BrandingIdentity;
  header: BrandingHeader;
  theme: BrandingTheme;
  hero: BrandingHero;
  logoUrl: string | null;
  faviconUrl: string | null;
}

/** Defaults are the current, hand-built AHF Travel look — exactly what renders when an
 *  administrator hasn't changed a given setting yet (every branding field is optional). */
export const DEFAULT_BRANDING: Branding = {
  identity: { siteName: "AHF Travel" },
  header: {},
  theme: {},
  hero: {},
  logoUrl: null,
  faviconUrl: null,
};

/** Deliberately NOT `serverGet` (which forces `cache: "no-store"`): this is fetched from the root
 *  layout, so a no-store call there would force every single page in the app into fully dynamic,
 *  server-rendered-per-request mode — including marketing pages (About, FAQ, Terms, …) that have
 *  nothing to do with branding. A 60-second revalidation window still gets an admin's change live
 *  "without redeploying" (the brief's actual requirement) while letting pages stay statically
 *  generated/cached the rest of the time.
 *
 *  Never throws: a branding fetch failure (backend briefly unavailable, etc.) must never take the
 *  whole site down — every page falls back to the hard-coded AHF Travel defaults above. */
export async function getBranding(): Promise<Branding> {
  try {
    const res = await fetch(`${API_BASE}/settings/branding`, { next: { revalidate: 60 } });
    if (!res.ok) return DEFAULT_BRANDING;
    return (await res.json()) as Branding;
  } catch {
    return DEFAULT_BRANDING;
  }
}
