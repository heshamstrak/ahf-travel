import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-700">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-slate-800">
                {item.label}
              </span>
            )}
            {i < items.length - 1 ? <ChevronRight size={14} className="text-slate-400" /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
