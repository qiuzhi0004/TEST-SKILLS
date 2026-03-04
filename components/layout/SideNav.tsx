'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SideNavItem {
  label: string;
  href: string;
}

interface SideNavProps {
  title?: string;
  subtitle?: string;
  accent?: string;
  items: SideNavItem[];
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function SideNav({ title = '导航', subtitle, accent = '#FC6624', items }: SideNavProps) {
  const pathname = usePathname();

  return (
    <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </div>

      <ul className="space-y-1 p-3 text-sm text-slate-700">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-lg border px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={active
                  ? {
                      borderColor: `${accent}55`,
                      backgroundColor: `${accent}12`,
                      color: accent,
                      fontWeight: 600,
                      boxShadow: `inset 0 0 0 1px ${accent}30`,
                    }
                  : {
                      borderColor: '#E2E8F0',
                      backgroundColor: '#fff',
                      color: '#334155',
                    }}
              >
                <span>{item.label}</span>
                {active ? (
                  <span
                    className="inline-flex h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                    aria-hidden
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
