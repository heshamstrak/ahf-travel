import { ReactNode } from "react";
import PageHeader from "@/components/ui/PageHeader";

export interface ContentSection {
  heading: string;
  body: string[];
}

export default function ContentPage({
  title,
  intro,
  breadcrumb,
  sections,
  updated,
  aside,
}: {
  title: string;
  intro: string;
  breadcrumb: string;
  sections: ContentSection[];
  updated?: string;
  aside?: ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} subtitle={intro} breadcrumbs={[{ label: "Home", href: "/" }, { label: breadcrumb }]} />
      <div className="mx-auto grid max-w-8xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <article className="min-w-0 max-w-3xl space-y-10">
          {sections.map((s) => (
            <section key={s.heading} aria-labelledby={`s-${s.heading.replace(/\W+/g, "-").toLowerCase()}`} className="space-y-3">
              <h2 id={`s-${s.heading.replace(/\W+/g, "-").toLowerCase()}`} className="font-display text-2xl font-medium text-slate-900">
                {s.heading}
              </h2>
              {s.body.map((p, i) => (
                <p key={i} className="leading-relaxed text-slate-700">
                  {p}
                </p>
              ))}
            </section>
          ))}
          {updated ? <p className="text-sm text-slate-500">Last updated: {updated}</p> : null}
        </article>
        {aside ? <aside className="h-fit space-y-5 lg:sticky lg:top-24">{aside}</aside> : null}
      </div>
    </>
  );
}
