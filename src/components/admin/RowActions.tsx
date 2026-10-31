"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

export interface RowAction {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
  onClick: () => void | Promise<void>;
  /** Danger-toned actions (archive/delete) show a confirmation dialog before running. */
  tone?: "default" | "danger";
  confirmTitle?: string;
  confirmMessage?: string;
  hidden?: boolean;
}

/** Right-aligned icon action cell for admin DataTable rows (view/edit/publish/archive/delete). */
export default function RowActions({ actions }: { actions: RowAction[] }) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<RowAction | null>(null);

  const run = async (action: RowAction) => {
    setPendingKey(action.key);
    try {
      await action.onClick();
    } finally {
      setPendingKey(null);
    }
  };

  const visible = actions.filter((a) => !a.hidden);

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {visible.map((action) => {
        const Icon = action.icon;
        const busy = pendingKey === action.key;
        return (
          <button
            key={action.key}
            type="button"
            title={action.label}
            aria-label={action.label}
            disabled={busy}
            onClick={() => (action.tone === "danger" ? setConfirming(action) : run(action))}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
              action.tone === "danger" ? "text-red-500 hover:bg-red-50 hover:text-red-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
          </button>
        );
      })}

      {confirming ? (
        <ConfirmDialog
          open
          title={confirming.confirmTitle ?? `${confirming.label}?`}
          message={confirming.confirmMessage ?? "This action cannot be undone."}
          confirmLabel={confirming.label}
          busy={pendingKey === confirming.key}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            await run(confirming);
            setConfirming(null);
          }}
        />
      ) : null}
    </div>
  );
}
