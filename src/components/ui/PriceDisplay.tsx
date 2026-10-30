"use client";

import { useApp } from "@/context/AppProvider";
import { formatMoney } from "@/lib/currency";

interface PriceDisplayProps {
  amountEGP: number;
  suffix?: string;
  className?: string;
}

export default function PriceDisplay({ amountEGP, suffix, className = "" }: PriceDisplayProps) {
  const { currency } = useApp();
  return (
    <span className={className}>
      {formatMoney(amountEGP, currency)}
      {suffix ? <span className="text-xs font-normal text-slate-500"> {suffix}</span> : null}
    </span>
  );
}
