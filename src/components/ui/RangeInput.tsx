"use client";

import { useId } from "react";

interface RangeInputProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}

export default function RangeInput({ label, min, max, step, value, onChange, format }: RangeInputProps) {
  const id = useId();
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label}
        </label>
        <span className="text-sm font-medium text-brand-700">Up to {format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
