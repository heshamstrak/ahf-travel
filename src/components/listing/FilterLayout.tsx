"use client";

import { ReactNode, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface FilterLayoutProps {
  filters: ReactNode;
  activeCount: number;
  onReset: () => void;
  toolbar: ReactNode;
  children: ReactNode;
}

/* Desktop: sticky sidebar. Mobile: filters open in a bottom sheet so results stay full width. */
export default function FilterLayout({ filters, activeCount, onReset, toolbar, children }: FilterLayoutProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-medium text-slate-900">Filters</h2>
            {activeCount > 0 ? (
              <button type="button" onClick={onReset} className="text-sm font-medium text-brand-700 hover:underline">
                Reset ({activeCount})
              </button>
            ) : null}
          </div>
          <div className="space-y-6">{filters}</div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="lg:hidden">
            <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
              <SlidersHorizontal size={16} />
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </Button>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">{toolbar}</div>
        </div>
        {children}
      </div>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        variant="sheet"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onReset}>
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setSheetOpen(false)}>
              Show results
            </Button>
          </div>
        }
      >
        <div className="space-y-6">{filters}</div>
      </Modal>
    </div>
  );
}
