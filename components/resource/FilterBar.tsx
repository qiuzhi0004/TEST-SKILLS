import { InlineNotice } from '@/components/feedback/InlineNotice';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface FilterBarProps {
  typeLabel: string;
}

export function FilterBar({ typeLabel }: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <Input
          aria-label={`搜索 ${typeLabel}`}
          placeholder={`搜索 ${typeLabel}（占位）`}
          disabled
        />
        <div className="grid grid-cols-2 gap-2">
          <Select aria-label="排序字段" disabled>
            <option>sort: hot_score</option>
          </Select>
          <Select aria-label="排序方向" disabled>
            <option>order: desc</option>
          </Select>
        </div>
      </div>
      <InlineNotice
        title="筛选控件占位"
        description="当前阶段仅保留 UI，不实现筛选/排序/搜索算法。"
        tone="warn"
      />
    </div>
  );
}
