'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/common/Badge';
import { CodeBlock } from '@/components/common/CodeBlock';
import { Placeholder } from '@/components/layout/Placeholder';
import { SectionCard } from '@/components/layout/SectionCard';
import { CommentThread } from '@/components/social/CommentThread';
import { SocialBar } from '@/components/social/SocialBar';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { getPrompt } from '@/lib/api';
import { toDisplayTags } from '@/lib/tagDisplay';
import type { PromptDetailVM } from '@/types/prompt';

function toDisplayLanguage(language: string): string {
  if (!language) return '暂无';
  const normalized = language.toLowerCase();
  if (normalized === 'zh-cn' || normalized === 'zh') return '中文';
  if (normalized === 'en' || normalized === 'en-us') return '英文';
  return language;
}

export default function PromptDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const target = { target_type: 'prompt' as const, target_id: id };
  const [detail, setDetail] = useState<PromptDetailVM | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getPrompt(id);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-sm text-slate-500">加载中...</p>;
  }

  if (!detail) {
    return (
      <SectionCard title={`Prompt 详情（未找到：${id}）`}>
        <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" />
      </SectionCard>
    );
  }

  const displayTags = toDisplayTags(detail.content.tag_ids, 3);

  return (
    <div className="space-y-4">
      <StatusBanner type="prompt" id={id} status={detail.content.status} />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <SectionCard title="获取资源">
            <div className="space-y-3">
              <CodeBlock title="Prompt 正文" value={detail.prompt_text} />
              <Placeholder title="Showcase 占位" todos={['showcases 媒体渲染', '预览切换']} />
            </div>
          </SectionCard>
          <SectionCard title="评论区">
            <CommentThread target={target} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-3 text-sm text-slate-700">
                <h3 className="text-base font-semibold text-slate-900">基础信息</h3>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">标签</p>
                  {displayTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {displayTags.map((tag) => (
                        <Badge key={tag.id} tone="info">
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">暂无</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">名称</p>
                  <p className="text-sm text-slate-800">{detail.content.title}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">类型</p>
                  <p className="text-sm text-slate-800">Prompt</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">语言</p>
                  <p className="text-sm text-slate-800">{toDisplayLanguage(detail.language)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">模型</p>
                  <p className="text-sm text-slate-800">{detail.model_name || '暂无'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">用途一句话</p>
                  <p className="text-sm text-slate-800">{detail.content.one_liner ?? '暂无'}</p>
                </div>
              </div>
              <SocialBar target={target} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
