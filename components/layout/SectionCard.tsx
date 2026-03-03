import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, description, headerRight, children }: SectionCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
