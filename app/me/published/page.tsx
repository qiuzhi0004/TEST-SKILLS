// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import Link from 'next/link';
import { MyRecordsPanel } from '@/components/forms/authoring/MyRecordsPanel';

const PUBLISH_ENTRIES = [
  { label: '发布 Prompt', href: '/prompts/new', tone: 'from-[#fff1ea] to-[#ffe6dc] text-[#c94f1d]' },
  { label: '发布 Skill', href: '/skills/new', tone: 'from-[#eaf9f5] to-[#def5ef] text-[#0f5c56]' },
  { label: '发布 MCP', href: '/mcps/new', tone: 'from-[#edf4ff] to-[#e2edff] text-[#1d4eb8]' },
  { label: '发布 帖子', href: '/tutorials/new', tone: 'from-[#fdf4ff] to-[#f8ecff] text-[#7b3da9]' },
] as const;

export default function MePublishedPage() {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
        <div className="bg-gradient-to-r from-[#fff5ef] via-[#fffaf8] to-white px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">发布入口</h2>
          <p className="mt-1 text-sm text-slate-600">选择内容类型并快速进入创建流程。</p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {PUBLISH_ENTRIES.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-r px-3 py-3 text-sm font-medium transition hover:scale-[1.01] hover:shadow-sm ${entry.tone}`}
            >
              {entry.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
        <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">我的发布记录</h2>
        </div>
        <div className="p-5">
          <MyRecordsPanel />
        </div>
      </section>
    </div>
  );
}
