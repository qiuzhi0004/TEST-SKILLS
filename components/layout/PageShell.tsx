import type { ReactNode } from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  metaText?: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, subtitle, metaText, headerRight, children }: PageShellProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
            {metaText ? <p className="text-xs text-slate-500">{metaText}</p> : null}
          </div>
          {headerRight ? <div>{headerRight}</div> : null}
        </div>
      </section>
      {children}
    </div>
  );
}
