import { ReactNode } from "react";
import Link from "next/link";

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 pb-16 pt-28 sm:px-8 lg:px-16">
        <div className="w-full max-w-md">
          <Link href="/" className="font-display text-xl font-semibold text-brand-900">
            AHF Travel
          </Link>
          <h1 className="mt-8 font-display text-3xl font-medium text-slate-900">{title}</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-slate-600">{footer}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-brand-900 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950" />
        <div className="relative flex h-full flex-col justify-end p-16 text-white">
          <p className="font-display text-3xl font-medium leading-snug">&ldquo;Everything for our Egypt trip in one itinerary. The transfer was waiting at arrivals.&rdquo;</p>
          <p className="mt-4 text-sm text-brand-200">Sophie B., traveller from the United Kingdom</p>
        </div>
      </div>
    </div>
  );
}
