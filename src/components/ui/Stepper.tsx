"use client";

import { Minus, Plus } from "lucide-react";

interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export default function Stepper({ label, value, min = 1, max = 99, onChange }: StepperProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:border-brand-500 hover:text-brand-700 disabled:opacity-40"
        >
          <Minus size={15} />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums text-slate-900" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:border-brand-500 hover:text-brand-700 disabled:opacity-40"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
