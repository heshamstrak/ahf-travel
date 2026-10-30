import { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  action?: ReactNode;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div
      className={`flex flex-col gap-4 ${
        isCenter
          ? "items-center text-center"
          : "sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <div className={isCenter ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow ? (
          <span className="text-sm font-semibold uppercase tracking-wide text-gold-600">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="mt-2 font-display text-3xl font-medium text-balance text-slate-900 sm:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 text-base text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
