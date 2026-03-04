import Image from 'next/image';
import type { ReactNode } from 'react';
import { pickUnsplash } from '@/lib/visualAssets';

interface PageShellProps {
  title: string;
  subtitle?: string;
  metaText?: string;
  headerRight?: ReactNode;
  badge?: string;
  accent?: string;
  children: ReactNode;
}

export function PageShell({
  title,
  subtitle,
  metaText,
  headerRight,
  badge = 'Control Center',
  accent = '#2563EB',
  children,
}: PageShellProps) {
  const heroImage = pickUnsplash(`shell:${title}`, 'mcp');

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={`${title} 背景`}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(100deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.62) 52%, ${accent}66 100%)`,
            }}
          />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
          <div className="space-y-1">
            <p
              className="inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-white"
              style={{ borderColor: `${accent}99`, backgroundColor: `${accent}44` }}
            >
              {badge}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
            {subtitle ? <p className="text-sm text-slate-200">{subtitle}</p> : null}
            {metaText ? <p className="text-xs text-slate-300">{metaText}</p> : null}
          </div>
          {headerRight ? <div className="relative z-10">{headerRight}</div> : null}
        </div>
      </section>

      <div className="space-y-4">{children}</div>
    </div>
  );
}
