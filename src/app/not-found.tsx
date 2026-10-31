import Link from "next/link";

// This is the true top-level fallback — it has no locale context (no NextIntlClientProvider),
// so unlike the locale-aware src/app/[locale]/not-found.tsx, it must use plain next/link, never
// Button or next-intl's Link (both would throw "no intl context" outside the [locale] tree).
// In practice almost every 404 is funneled through [locale] by the proxy/middleware; this only
// fires for a request that doesn't match any route at all.
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center font-sans">
      <p className="text-6xl font-medium text-amber-600">404</p>
      <h1 className="mt-4 text-3xl font-medium text-slate-900">This page has wandered off</h1>
      <p className="mt-3 text-slate-600">The page you are looking for does not exist or has moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white">
          Back to Home
        </Link>
        <Link href="/hotels" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800">
          Browse Hotels
        </Link>
      </div>
    </div>
  );
}
