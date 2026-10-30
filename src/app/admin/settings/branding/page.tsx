"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, ErrorState, Field, inputClass, LoadingState, PageHeader, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import ImageManager from "@/components/admin/ImageManager";
import { BRANDING_SLOTS } from "@/lib/admin/branding-slots";

interface Identity {
  siteName?: string;
  tagline?: string;
  description?: string;
  footerCopyright?: string;
}
interface Header {
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
}
interface Theme {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  footerBackgroundColor?: string;
  footerTextColor?: string;
}
interface Hero {
  title?: string;
  subtitle?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  textAlign?: string;
  buttonText?: string;
  buttonHref?: string;
}

const emptyIdentity: Required<Identity> = { siteName: "", tagline: "", description: "", footerCopyright: "" };
const emptyHeader: Required<Header> = {
  backgroundColor: "",
  textColor: "",
  navLinkColor: "",
  transparency: 1,
  logoWidth: 0,
  logoHeight: 0,
  headerHeight: 0,
  backgroundPosition: "center",
  backgroundSize: "cover",
  overlayColor: "",
  overlayOpacity: 0,
};
const emptyTheme: Required<Theme> = {
  primaryColor: "",
  secondaryColor: "",
  accentColor: "",
  buttonBackgroundColor: "",
  buttonTextColor: "",
  footerBackgroundColor: "",
  footerTextColor: "",
};
const emptyHero: Required<Hero> = { title: "", subtitle: "", overlayColor: "", overlayOpacity: 0, textAlign: "center", buttonText: "", buttonHref: "" };

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-slate-300"
          aria-label={`${label} picker`}
        />
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#1f6f66" className={inputClass} />
      </div>
    </Field>
  );
}

/** Strips empty-string fields before sending — an unset color/text field should fall back to the
 *  frontend default, not be saved as a literal empty string the public site would try to render. */
function clean<T extends Record<string, unknown>>(value: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === "" || v === undefined) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export default function AdminBrandingSettingsPage() {
  const { notify } = useAdminToast();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [identity, setIdentity] = useState(emptyIdentity);
  const [header, setHeader] = useState(emptyHeader);
  const [theme, setTheme] = useState(emptyTheme);
  const [hero, setHero] = useState(emptyHero);

  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingHero, setSavingHero] = useState(false);

  function load() {
    adminApi
      .get<{ key: string; value: unknown }[]>("/admin/settings")
      .then((rows) => {
        setError(null);
        const byKey = new Map(rows.map((r) => [r.key, r.value]));
        setIdentity({ ...emptyIdentity, ...((byKey.get("branding.identity") as Identity) ?? {}) });
        setHeader({ ...emptyHeader, ...((byKey.get("branding.header") as Header) ?? {}) });
        setTheme({ ...emptyTheme, ...((byKey.get("branding.theme") as Theme) ?? {}) });
        setHero({ ...emptyHero, ...((byKey.get("branding.hero") as Hero) ?? {}) });
        setLoaded(true);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load branding settings"));
  }
  useEffect(load, []);

  async function saveIdentity() {
    setSavingIdentity(true);
    try {
      await adminApi.patch("/admin/settings/branding.identity", { value: clean(identity) });
      notify("success", "Website identity updated");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSavingIdentity(false);
    }
  }

  async function saveHeader() {
    setSavingHeader(true);
    try {
      await adminApi.patch("/admin/settings/branding.header", { value: clean(header) });
      notify("success", "Header appearance updated");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSavingHeader(false);
    }
  }

  async function saveTheme() {
    setSavingTheme(true);
    try {
      await adminApi.patch("/admin/settings/branding.theme", { value: clean(theme) });
      notify("success", "Theme colors updated");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSavingTheme(false);
    }
  }

  async function saveHero() {
    setSavingHero(true);
    try {
      await adminApi.patch("/admin/settings/branding.hero", { value: clean(hero) });
      notify("success", "Homepage hero updated");
    } catch (e) {
      notify("error", e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSavingHero(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!loaded) return <LoadingState label="Loading branding settings…" />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Website Branding"
        description="Identity, header, theme colors and homepage hero. Nothing here is live until you press each section's Save button — changes are never applied straight to the database as you type."
        action={
          <Link href="/" target="_blank" className="text-sm font-medium text-brand-700 hover:underline">
            View public site ↗
          </Link>
        }
      />

      {/* A. Website Identity */}
      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-slate-900">Website Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website name" hint="Shown in the header, footer, browser title and SEO metadata">
            <input value={identity.siteName} onChange={(e) => setIdentity({ ...identity, siteName: e.target.value })} className={inputClass} placeholder="AHF Travel" />
          </Field>
          <Field label="Tagline">
            <input value={identity.tagline} onChange={(e) => setIdentity({ ...identity, tagline: e.target.value })} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" hint="Used as the default SEO meta description">
              <textarea value={identity.description} onChange={(e) => setIdentity({ ...identity, description: e.target.value })} className={inputClass} rows={2} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Footer copyright text">
              <input value={identity.footerCopyright} onChange={(e) => setIdentity({ ...identity, footerCopyright: e.target.value })} className={inputClass} placeholder="© 2026 AHF Travel. All rights reserved." />
            </Field>
          </div>
        </div>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Logo</h3>
            <ImageManager ownerType="SITE_BRANDING" ownerId={BRANDING_SLOTS.logo} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Favicon</h3>
            <ImageManager ownerType="SITE_BRANDING" ownerId={BRANDING_SLOTS.favicon} />
          </div>
        </div>
        <div className="mt-5">
          <PrimaryButton onClick={saveIdentity} disabled={savingIdentity}>
            {savingIdentity ? "Saving…" : "Save identity"}
          </PrimaryButton>
        </div>
      </Card>

      {/* B. Header Appearance */}
      <Card className="p-5">
        <h2 className="mb-1 font-display text-lg font-medium text-slate-900">Header Appearance</h2>
        <p className="mb-4 text-xs text-slate-500">This is the site navigation bar only — it never affects page hero/banner sections below it.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <ColorField label="Background color" value={header.backgroundColor} onChange={(v) => setHeader({ ...header, backgroundColor: v })} />
          <ColorField label="Text color" value={header.textColor} onChange={(v) => setHeader({ ...header, textColor: v })} />
          <ColorField label="Navigation link color" value={header.navLinkColor} onChange={(v) => setHeader({ ...header, navLinkColor: v })} />
          <Field label="Transparency" hint="0 = fully transparent, 1 = opaque">
            <input type="number" min={0} max={1} step={0.05} value={header.transparency} onChange={(e) => setHeader({ ...header, transparency: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Logo width (px)">
            <input type="number" min={0} value={header.logoWidth || ""} onChange={(e) => setHeader({ ...header, logoWidth: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Logo height (px)">
            <input type="number" min={0} value={header.logoHeight || ""} onChange={(e) => setHeader({ ...header, logoHeight: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Header height (px)">
            <input type="number" min={0} value={header.headerHeight || ""} onChange={(e) => setHeader({ ...header, headerHeight: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Background position">
            <select value={header.backgroundPosition} onChange={(e) => setHeader({ ...header, backgroundPosition: e.target.value })} className={inputClass}>
              {["center", "top", "bottom", "left", "right"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Background size">
            <select value={header.backgroundSize} onChange={(e) => setHeader({ ...header, backgroundSize: e.target.value })} className={inputClass}>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </Field>
          <ColorField label="Overlay color" value={header.overlayColor} onChange={(v) => setHeader({ ...header, overlayColor: v })} hint="Optional dark/light wash over the background image" />
          <Field label="Overlay opacity">
            <input type="number" min={0} max={1} step={0.05} value={header.overlayOpacity} onChange={(e) => setHeader({ ...header, overlayOpacity: Number(e.target.value) })} className={inputClass} />
          </Field>
        </div>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Background image — desktop</h3>
            <ImageManager ownerType="SITE_BRANDING" ownerId={BRANDING_SLOTS.headerBackgroundDesktop} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Background image — mobile</h3>
            <ImageManager ownerType="SITE_BRANDING" ownerId={BRANDING_SLOTS.headerBackgroundMobile} />
          </div>
        </div>
        <div className="mt-5">
          <PrimaryButton onClick={saveHeader} disabled={savingHeader}>
            {savingHeader ? "Saving…" : "Save header appearance"}
          </PrimaryButton>
        </div>
      </Card>

      {/* C. Website Appearance (theme colors) */}
      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-slate-900">Theme Colors</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ColorField label="Primary color" value={theme.primaryColor} onChange={(v) => setTheme({ ...theme, primaryColor: v })} />
          <ColorField label="Secondary color" value={theme.secondaryColor} onChange={(v) => setTheme({ ...theme, secondaryColor: v })} />
          <ColorField label="Accent color" value={theme.accentColor} onChange={(v) => setTheme({ ...theme, accentColor: v })} />
          <ColorField label="Button background" value={theme.buttonBackgroundColor} onChange={(v) => setTheme({ ...theme, buttonBackgroundColor: v })} />
          <ColorField label="Button text" value={theme.buttonTextColor} onChange={(v) => setTheme({ ...theme, buttonTextColor: v })} />
          <ColorField label="Footer background" value={theme.footerBackgroundColor} onChange={(v) => setTheme({ ...theme, footerBackgroundColor: v })} />
          <ColorField label="Footer text" value={theme.footerTextColor} onChange={(v) => setTheme({ ...theme, footerTextColor: v })} />
        </div>
        <div className="mt-5">
          <PrimaryButton onClick={saveTheme} disabled={savingTheme}>
            {savingTheme ? "Saving…" : "Save theme colors"}
          </PrimaryButton>
        </div>
      </Card>

      {/* D. Homepage Hero Settings */}
      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-slate-900">Homepage Hero</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hero title">
            <input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Hero subtitle">
            <input value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} className={inputClass} />
          </Field>
          <ColorField label="Overlay color" value={hero.overlayColor} onChange={(v) => setHero({ ...hero, overlayColor: v })} />
          <Field label="Overlay opacity">
            <input type="number" min={0} max={1} step={0.05} value={hero.overlayOpacity} onChange={(e) => setHero({ ...hero, overlayOpacity: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Text alignment">
            <select value={hero.textAlign} onChange={(e) => setHero({ ...hero, textAlign: e.target.value })} className={inputClass}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Field>
          <Field label="Button text">
            <input value={hero.buttonText} onChange={(e) => setHero({ ...hero, buttonText: e.target.value })} className={inputClass} placeholder="Start exploring" />
          </Field>
          <Field label="Button destination" hint="A path on this site, e.g. /hotels">
            <input value={hero.buttonHref} onChange={(e) => setHero({ ...hero, buttonHref: e.target.value })} className={inputClass} placeholder="/hotels" />
          </Field>
        </div>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Background image — desktop</h3>
            <ImageManager ownerType="SITE_BRANDING" ownerId={BRANDING_SLOTS.heroBackgroundDesktop} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Background image — mobile</h3>
            <ImageManager ownerType="SITE_BRANDING" ownerId={BRANDING_SLOTS.heroBackgroundMobile} />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <PrimaryButton onClick={saveHero} disabled={savingHero}>
            {savingHero ? "Saving…" : "Save homepage hero"}
          </PrimaryButton>
          <SecondaryButton onClick={load}>Reset unsaved changes</SecondaryButton>
        </div>
      </Card>
    </div>
  );
}
