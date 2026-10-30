"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect, useId } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
  variant?: "center" | "sheet";
}

export default function Modal({ open, onClose, title, children, footer, size = "md", variant = "center" }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md";
  const position =
    variant === "sheet"
      ? `inset-x-0 bottom-0 rounded-t-3xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl ${width}`
      : `inset-x-4 top-1/2 -translate-y-1/2 rounded-3xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 ${width}`;

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute flex max-h-[85vh] w-auto flex-col bg-white shadow-2xl sm:w-full ${position}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={titleId} className="font-display text-lg font-medium text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="shrink-0 border-t border-slate-100 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
