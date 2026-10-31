"use client";

import { useEffect } from "react";
import Link from "next/link";

// True top-level error boundary — catches anything that errors above or outside a more specific
// boundary (including inside [locale]/** if that segment has no error.tsx of its own... which it
// does, see src/app/[locale]/error.tsx). No locale context is guaranteed here, so this must use
// plain next/link, never Button or next-intl's Link (both throw "no intl context" otherwise).
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center font-sans">
      <h1 className="text-3xl font-medium text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-slate-600">We could not load this page. Please try again, or head back to the home page.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button onClick={reset} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white">
          Try again
        </button>
        <Link href="/" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
