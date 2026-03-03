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
import { getMcp } from '@/lib/api';
import { toDisplayTags } from '@/lib/tagDisplay';
import type { McpDetailVM } from '@/types/mcp';

export default function McpDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const target = { target_type: 'mcp' as const, target_id: id };
  const [detail, setDetail] = useState<McpDetailVM | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getMcp(id);
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
      <SectionCard title={`MCP 详情（未找到：${id}）`}>
        <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" />
      </SectionCard>
    );
  }

  const displayTags = toDisplayTags(detail.content.tag_ids, 6);

  return (
    <div className="space-y-4">
      <StatusBanner type="mcp" id={id} status={detail.content.status} />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <SectionCard title="如何使用">
            <div className="space-y-3">
              {/* NOTE(decision-3): 按字段文档 A，三段 how_to_use 以原样文本展示。 */}
              <CodeBlock title="标准配置（json_config_text）" value={detail.how_to_use.json_config_text} />
              <CodeBlock title="常用客户端（common_clients_json）" value={detail.how_to_use.common_clients_json} />
              <CodeBlock title="运行形态（runtime_modes_json）" value={detail.how_to_use.runtime_modes_json} />
              <Placeholder title="Cases 展示占位" todos={['案例列表', '案例媒体画廊']} />
            </div>
          </SectionCard>
          <SectionCard title="评论区">
            <CommentThread target={target} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="右侧元信息栏">
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
                  <p className="text-xs text-slate-500">提供方</p>
                  <p className="text-sm text-slate-800">{detail.provider_name || '暂无'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">仓库地址</p>
                  <a
                    href={detail.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all text-sm text-sky-700 hover:underline"
                  >
                    {detail.repo_url || '暂无'}
                  </a>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">用途一句话</p>
                  <p className="text-sm text-slate-800">{detail.content.one_liner ?? '暂无'}</p>
                </div>
              </div>
              <SocialBar target={target} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
