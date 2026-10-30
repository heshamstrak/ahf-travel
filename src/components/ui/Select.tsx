import { ChevronDown } from "lucide-react";
import { SelectHTMLAttributes, useId } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: Option[];
  error?: string;
}

export default function Select({ label, options, error, id, className = "", ...props }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={Boolean(error)}
          className={`w-full appearance-none rounded-xl border bg-white px-3.5 py-2.5 pe-10 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            error ? "border-red-400" : "border-slate-200 hover:border-slate-300"
          }`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute inset-y-0 end-3 my-auto text-slate-400" />
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
