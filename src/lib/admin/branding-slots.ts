/** Mirrors backend/src/admin/settings/branding-slots.ts — each site-branding image is a
 *  single-purpose slot keyed by a fixed, well-known Media.ownerId (ownerType SITE_BRANDING), so
 *  the existing ImageManager component can manage one image per slot unchanged. */
export const BRANDING_SLOTS = {
  logo: "10000000-0000-4000-8000-000000000001",
  favicon: "10000000-0000-4000-8000-000000000002",
  headerBackgroundDesktop: "10000000-0000-4000-8000-000000000003",
  headerBackgroundMobile: "10000000-0000-4000-8000-000000000004",
  heroBackgroundDesktop: "10000000-0000-4000-8000-000000000005",
  heroBackgroundMobile: "10000000-0000-4000-8000-000000000006",
} as const;
