// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import Link from 'next/link';
import { MyRecordsPanel } from '@/components/forms/authoring/MyRecordsPanel';

export default function MePublishedPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/prompts/new"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            发布 Prompt
          </Link>
          <Link
            href="/skills/new"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            发布 Skill
          </Link>
          <Link
            href="/mcps/new"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            发布 MCP
          </Link>
          <Link
            href="/tutorials/new"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            发布 教程
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <MyRecordsPanel />
      </section>
    </div>
  );
}
