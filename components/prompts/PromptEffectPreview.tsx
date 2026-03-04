'use client';

import { Badge } from '@/components/common/Badge';
import { CodeBlock } from '@/components/common/CodeBlock';
import type { PromptDetailVM } from '@/types/prompt';

interface PromptEffectPreviewProps {
  detail: Pick<PromptDetailVM, 'content' | 'model_name' | 'prompt_text'>;
}

function parseModels(modelName: string): string[] {
  return modelName
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PromptEffectPreview({ detail }: PromptEffectPreviewProps) {
  const models = parseModels(detail.model_name ?? '');

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="text-base font-semibold text-slate-900">{detail.content.title || '（未填写标题）'}</h4>
      <p className="mt-2 text-sm text-slate-600">{detail.content.one_liner || '（暂无一句话描述）'}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {models.length > 0 ? (
          models.map((name) => (
            <Badge key={name} tone="info">
              {name}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-slate-400">未选择模型</span>
        )}
      </div>

      <div className="mt-4">
        <CodeBlock title="Prompt 正文" value={detail.prompt_text} />
      </div>
    </div>
  );
}
