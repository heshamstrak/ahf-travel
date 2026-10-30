"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-medium text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-slate-600">We could not load this page. Please try again, or head back to the home page.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="outline">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
