import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AppProvider } from "@/context/AppProvider";
import { getBranding } from "@/services/branding.service";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const DEFAULT_SITE_NAME = "AHF Travel";
const DEFAULT_DESCRIPTION =
  "Plan your entire Egypt trip in one place: hotels, unforgettable experiences, private transfers, car rentals and travel packages.";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  const siteName = branding.identity.siteName || DEFAULT_SITE_NAME;
  return {
    title: { default: `${siteName} | Hotels, Tours, Cars & Transfers`, template: `%s | ${siteName}` },
    description: branding.identity.description || DEFAULT_DESCRIPTION,
    // A literal app/favicon.ico would auto-inject its own <link rel="icon">, which coexists with
    // (and in most browsers wins over) this dynamic one — the file lives in public/ instead so
    // this is the only icon tag ever rendered, letting an admin-uploaded favicon actually take
    // effect while keeping the exact same default icon when nothing is configured.
    icons: { icon: branding.faviconUrl || "/favicon.ico" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const branding = await getBranding();
  const { theme } = branding;

  // Admin-picked colors land here as CSS custom-property overrides on top of globals.css's
  // defaults — every consumer (Button, Navbar, Footer) references `var(--site-*, <default>)`, so
  // an unset color is simply absent from this block and the default wins unchanged.
  const overrides: string[] = [];
  if (theme.primaryColor) overrides.push(`--color-brand-600: ${theme.primaryColor}; --color-brand-700: ${theme.primaryColor};`);
  if (theme.accentColor) overrides.push(`--color-gold-500: ${theme.accentColor}; --color-gold-600: ${theme.accentColor};`);
  if (theme.buttonBackgroundColor) overrides.push(`--site-button-bg: ${theme.buttonBackgroundColor};`);
  if (theme.buttonTextColor) overrides.push(`--site-button-text: ${theme.buttonTextColor};`);
  if (theme.footerBackgroundColor) overrides.push(`--site-footer-bg: ${theme.footerBackgroundColor};`);
  if (theme.footerTextColor) overrides.push(`--site-footer-text: ${theme.footerTextColor};`);
  const overrideCss = overrides.length > 0 ? `:root { ${overrides.join(" ")} }` : null;

  return (
    <html lang="en" className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}>
      <head>{overrideCss ? <style dangerouslySetInnerHTML={{ __html: overrideCss }} /> : null}</head>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-white text-slate-900">
        <AppProvider>
          <Navbar branding={branding} />
          <main className="flex-1">{children}</main>
          <Footer branding={branding} />
        </AppProvider>
      </body>
    </html>
  );
}
