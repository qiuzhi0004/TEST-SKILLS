import Link from "next/link";

export interface TabItem {
  label: string;
  href?: string;
}

interface TabNavProps {
  items: TabItem[];
}

export function TabNav({ items }: TabNavProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) =>
          item.href ? (
            <Link
              key={`${item.label}-${index}`}
              href={item.href}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </Link>
          ) : (
            <span
              key={`${item.label}-${index}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
            >
              {item.label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
