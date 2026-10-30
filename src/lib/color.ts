/** `#rrggbb` + an alpha in [0, 1] -> `rgba(r, g, b, a)`. Used for admin-configurable transparency
 *  and overlay settings (branding header/hero), where storing just a hex color plus a separate
 *  opacity number is simpler for an admin to reason about than asking them to pick an 8-digit
 *  hex code. */
export function hexToRgba(hex: string | undefined, alpha: number | undefined): string | undefined {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = alpha === undefined ? 1 : Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
