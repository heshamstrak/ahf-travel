"use client";

interface CheckboxGroupProps {
  legend: string;
  options: { value: string; label: string; count?: number }[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function CheckboxGroup({ legend, options, selected, onChange }: CheckboxGroupProps) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-semibold text-slate-800">{legend}</legend>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="flex-1">{o.label}</span>
            {typeof o.count === "number" ? <span className="text-xs text-slate-400">{o.count}</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
