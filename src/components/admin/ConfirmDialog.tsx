"use client";

import Modal from "@/components/ui/Modal";
import { SecondaryButton } from "./ui";
import { useAdminI18n } from "@/lib/admin/i18n";

/** Modal confirmation for destructive admin row actions (archive/delete), replacing the inline
 *  two-step ConfirmButton pattern where a proper dialog reads better (UBold-style row actions). */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useAdminI18n();
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onCancel} disabled={busy}>
            {t("common.cancel")}
          </SecondaryButton>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? t("common.working") : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}
