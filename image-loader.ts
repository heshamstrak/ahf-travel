/*
 * Unsplash sizes itself through its own CDN parameters. Wikimedia only pre-renders
 * some thumbnail widths, so its URLs are passed through unchanged.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Data-URI placeholders (Milestone 7's "no photo yet" fallback) and relative backend paths have
  // no meaningful size parameters to set — pass them through unchanged, same as Wikimedia below.
  if (src.startsWith("data:") || src.startsWith("/")) return src;

  const url = new URL(src);

  if (url.hostname === "images.unsplash.com") {
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    return url.href;
  }

  return src;
}
