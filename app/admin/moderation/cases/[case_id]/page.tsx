// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { ReviewActions } from '@/components/admin/ReviewActions';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/layout/SectionCard';
import { getReviewItem } from '@/lib/api/admin_review';
import type { ContentStatus, ContentType } from '@/types/content';

interface ReviewDetailState {
  title: string;
  status: ContentStatus;
  preview: string;
}

function parseCaseId(caseId: string): { type: ContentType; id: string } | null {
  const [rawType, ...rest] = decodeURIComponent(caseId).split(':');
  if (!rawType || rest.length === 0) return null;
  if (rawType !== 'prompt' && rawType !== 'mcp' && rawType !== 'skill' && rawType !== 'tutorial') return null;
  return {
    type: rawType,
    id: rest.join(':'),
  };
}

export default function AdminModerationCaseDetailPage() {
  const params = useParams<{ case_id: string }>();
  const parsed = useMemo(() => parseCaseId(params.case_id), [params.case_id]);
  const [state, setState] = useState<ReviewDetailState | null>(null);

  const load = useCallback(async () => {
    if (!parsed) return;
    const { detailVM } = await getReviewItem(parsed.type, parsed.id);
    const detail = detailVM as { content: { title: string; status: ContentStatus }; prompt_text?: string; body_markdown?: string; how_to_use?: { json_config_text: string }; usage_doc?: string | null };

    let preview = '';
    if ('prompt_text' in detail && detail.prompt_text) preview = detail.prompt_text;
    else if ('body_markdown' in detail && detail.body_markdown) preview = detail.body_markdown;
    else if ('how_to_use' in detail && detail.how_to_use) preview = detail.how_to_use.json_config_text;
    else if ('usage_doc' in detail && detail.usage_doc) preview = detail.usage_doc;

    setState({
      title: detail.content.title,
      status: detail.content.status,
      preview,
    });
  }, [parsed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, [load]);

  if (!parsed) {
    return <p className="text-sm text-slate-500">无效 case_id</p>;
  }

  return (
    <PageShell title={`审核详情：${parsed.type}:${parsed.id}`} subtitle="预览 + 审核动作 + 审计日志">
      <SectionCard title="内容预览">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">{state?.title ?? '加载中...'}</p>
          <p className="text-xs text-slate-500">状态：{state?.status ?? '-'}</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            {state?.preview || '暂无预览内容'}
          </pre>
        </div>
      </SectionCard>

      <SectionCard title="审核动作">
        <ReviewActions type={parsed.type} id={parsed.id} status={state?.status ?? 'Draft'} onDone={() => void load()} />
      </SectionCard>

      <SectionCard title="审计日志">
        <AuditLogPanel targetType={parsed.type} targetId={parsed.id} />
      </SectionCard>
    </PageShell>
  );
}
