"use client";

import { useState } from "react";
import { FaqCategory } from "@/data/faq";
import Accordion from "@/components/ui/Accordion";

export default function FaqView({ categories }: { categories: FaqCategory[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const active = categories.find((c) => c.id === activeId) ?? categories[0];

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="FAQ categories" className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === active?.id}
            onClick={() => setActiveId(c.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              c.id === active?.id ? "bg-brand-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>
      {active ? (
        <Accordion
          key={active.id}
          defaultOpenId={`${active.id}-0`}
          items={active.items.map((item, i) => ({
            id: `${active.id}-${i}`,
            title: item.question,
            content: item.answer,
          }))}
        />
      ) : null}
    </div>
  );
}
