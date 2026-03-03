'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/common/Badge';
import { Placeholder } from '@/components/layout/Placeholder';
import { SectionCard } from '@/components/layout/SectionCard';
import { CommentThread } from '@/components/social/CommentThread';
import { SocialBar } from '@/components/social/SocialBar';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { getTutorial } from '@/lib/api';
import { toDisplayTags } from '@/lib/tagDisplay';
import type { TutorialDetailVM } from '@/types/tutorial';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function TutorialDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const target = { target_type: 'tutorial' as const, target_id: id };
  const [detail, setDetail] = useState<TutorialDetailVM | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getTutorial(id);
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

  if (loading) return <p className="text-sm text-slate-500">加载中...</p>;

  if (!detail) {
    return (
      <SectionCard title={`教程详情（未找到：${id}）`}>
        <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" />
      </SectionCard>
    );
  }

  const displayTags = toDisplayTags(detail.content.tag_ids, 6);

  return (
    <div className="space-y-4">
      <StatusBanner type="tutorial" id={id} status={detail.content.status} />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="mb-3 text-2xl font-semibold text-slate-900">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-2 mt-6 text-xl font-semibold text-slate-900">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold text-slate-900">{children}</h3>,
                  p: ({ children }) => <p className="mb-3">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-6">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-6">{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  hr: () => <hr className="my-4 border-slate-200" />,
                  blockquote: ({ children }) => (
                    <blockquote className="mb-3 border-l-4 border-slate-300 pl-3 text-slate-600">{children}</blockquote>
                  ),
                  code: ({ className, children }) => {
                    const isBlock = Boolean(className);
                    if (isBlock) {
                      return (
                        <code className="block overflow-x-auto rounded-md border border-slate-200 bg-slate-100 p-3 text-xs leading-5 text-slate-800">
                          {children}
                        </code>
                      );
                    }
                    return <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">{children}</code>;
                  },
                  pre: ({ children }) => <pre className="mb-3">{children}</pre>,
                  table: ({ children }) => (
                    <div className="mb-3 overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-slate-200">{children}</thead>,
                  th: ({ children }) => <th className="border border-slate-300 px-2 py-1 font-semibold">{children}</th>,
                  td: ({ children }) => <td className="border border-slate-300 px-2 py-1 align-top">{children}</td>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {detail.body_markdown}
              </ReactMarkdown>
            </div>
          </section>

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
                  <p className="text-xs text-slate-500">作者</p>
                  <p className="text-sm text-slate-800">{detail.content.author_id || '暂无'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">一句话用途</p>
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
