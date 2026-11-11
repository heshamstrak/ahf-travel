import { Archive, BadgeCheck, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { RowAction } from "./RowActions";

/**
 * The standard View/Edit/Publish-Unpublish/Archive(+Delete) action set shared by every
 * DRAFT/PUBLISHED/ARCHIVED catalogue list page (hotels, tours, cars, packages, destinations…).
 * Each admin page still owns its own setStatus/delete handlers — this just assembles the
 * consistent icon set/labels/confirmation copy around them.
 */
export function catalogRowActions({
  status,
  detailHref,
  onSetStatus,
  onDelete,
  entityLabel = "item",
  t,
}: {
  status: string;
  detailHref: () => void;
  onSetStatus: (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  entityLabel?: string;
  /** Admin i18n translator (useAdminI18n().t) — optional so existing call sites without it keep working in English. */
  t?: (key: string, vars?: Record<string, string | number>) => string;
}): RowAction[] {
  const tr = t ?? ((key: string) => key.split(".").pop() ?? key);
  const actions: RowAction[] = [
    { key: "edit", label: tr("actions.edit"), icon: Pencil, onClick: detailHref },
    status !== "PUBLISHED"
      ? { key: "publish", label: tr("actions.publish"), icon: BadgeCheck, onClick: () => onSetStatus("PUBLISHED") }
      : { key: "unpublish", label: tr("actions.unpublish"), icon: EyeOff, onClick: () => onSetStatus("DRAFT") },
    {
      key: "archive",
      label: tr("actions.archive"),
      icon: Archive,
      tone: "danger",
      hidden: status === "ARCHIVED",
      confirmTitle: tr("actions.archiveConfirmTitle", { entity: entityLabel }),
      confirmMessage: tr("actions.archiveConfirmMessage", { entity: entityLabel }),
      onClick: () => onSetStatus("ARCHIVED"),
    },
  ];
  if (onDelete) {
    actions.push({
      key: "delete",
      label: tr("actions.delete"),
      icon: Trash2,
      tone: "danger",
      confirmTitle: tr("actions.deleteConfirmTitle", { entity: entityLabel }),
      confirmMessage: tr("actions.deleteConfirmMessage"),
      onClick: onDelete,
    });
  }
  return actions;
}
