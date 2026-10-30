"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useState } from "react";

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export default function Accordion({ items, defaultOpenId }: { items: AccordionItem[]; defaultOpenId?: string }) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`panel-${item.id}`}
                id={`trigger-${item.id}`}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-medium text-slate-900 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                {item.title}
                <ChevronDown size={18} className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            </h3>
            {open ? (
              <div
                id={`panel-${item.id}`}
                role="region"
                aria-labelledby={`trigger-${item.id}`}
                className="px-5 pb-5 text-sm leading-relaxed text-slate-600"
              >
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
