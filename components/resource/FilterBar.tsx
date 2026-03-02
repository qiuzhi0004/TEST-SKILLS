import { Placeholder } from '@/components/layout/Placeholder';

interface FilterBarProps {
  typeLabel: string;
}

export function FilterBar({ typeLabel }: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          placeholder={`搜索 ${typeLabel}（占位）`}
          disabled
        />
        <div className="grid grid-cols-2 gap-2">
          <select className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm" disabled>
            <option>sort: hot_score</option>
          </select>
          <select className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm" disabled>
            <option>order: desc</option>
          </select>
        </div>
      </div>
      <Placeholder
        title="筛选控件占位"
        description="当前阶段仅保留 UI，不实现筛选/排序/搜索算法。"
        todos={['tag_ids 多选', 'source 条件（MCP/Skill）', '分页交互']}
      />
    </div>
  );
}
