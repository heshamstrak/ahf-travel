import { ReactNode } from "react";
import Breadcrumbs from "./Breadcrumbs";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs: { label: string; href?: string }[];
  children?: ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, children }: PageHeaderProps) {
  return (
    <div className="border-b border-slate-100 bg-sand-50">
      <div className="mx-auto max-w-8xl px-4 pb-8 pt-28 sm:px-6 sm:pb-10 lg:px-8">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="mt-4 font-display text-3xl font-medium text-balance text-slate-900 sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-2xl text-base text-slate-600">{subtitle}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}
