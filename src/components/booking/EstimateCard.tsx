import Image from "next/image";
import { ReactNode } from "react";
import PriceDisplay from "@/components/ui/PriceDisplay";

interface EstimateCardProps {
  image: string;
  title: string;
  subtitle: string;
  quantityLabel: string;
  estimateLabel: string;
  estimateEGP: number | null;
  children?: ReactNode;
}

/** Shown on detail-page booking widgets, before a quote exists. Deliberately has no tax/fee
 *  breakdown — the exact, authoritative total (with real taxes, fees and surcharges) only comes
 *  from the backend quote at checkout; showing a fake breakdown here would risk misleading the
 *  traveller with numbers that don't match what they're actually charged. */
export default function EstimateCard({ image, title, subtitle, quantityLabel, estimateLabel, estimateEGP, children }: EstimateCardProps) {
  return (
    <section aria-labelledby="estimate-title" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 id="estimate-title" className="font-display text-lg font-medium text-slate-900">
        Booking summary
      </h2>

      <div className="mt-4 flex gap-4">
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-100">
          <Image src={image} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
          <p className="mt-1 text-xs text-slate-500">{quantityLabel}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm text-slate-600">{estimateLabel}</span>
        {estimateEGP !== null ? (
          <PriceDisplay amountEGP={estimateEGP} className="font-display text-xl font-semibold text-slate-900" />
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">Estimate only. The exact total, with taxes and fees, is confirmed on the next step.</p>

      {children ? <div className="mt-5 space-y-3">{children}</div> : null}
    </section>
  );
}
