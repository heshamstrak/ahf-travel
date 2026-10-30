/**
 * A neutral "no photo yet" placeholder — never a real, unrelated stock photo standing in for a
 * product's actual images. Used only when a catalogue item genuinely has zero uploaded/imported
 * media (e.g. a brand-new admin-created product before any photo is attached).
 */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#ece4d3"/>
      <text x="400" y="300" font-family="sans-serif" font-size="28" fill="#94a3b8" text-anchor="middle" dominant-baseline="middle">No photo yet</text>
    </svg>`
  );
