'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/common/Badge';
import { CodeBlock } from '@/components/common/CodeBlock';
import { Placeholder } from '@/components/layout/Placeholder';
import { TabNav } from '@/components/layout/TabNav';
import { DetailPageTemplate } from '@/components/page-templates/DetailPageTemplate';
import { CommentThread } from '@/components/social/CommentThread';
import { SocialBar } from '@/components/social/SocialBar';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { getPrompt } from '@/lib/api';
import type { PromptDetailVM } from '@/types/prompt';

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
      <DetailPageTemplate
        title={`Prompt 详情（未找到：${id}）`}
        subtitle="未找到对应 mock 或本地记录"
        tabsSlot={<TabNav items={[{ label: 'Overview' }, { label: 'Content' }, { label: 'Showcase' }]} />}
        sections={[
          { title: '空状态', content: <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" /> },
          { title: '后续功能', content: <Placeholder title="详情交互占位" todos={['点赞', '收藏', '评论']} /> },
        ]}
      />
    );
  }

  return (
    <DetailPageTemplate
      title={detail.content.title}
      subtitle="低保真块：首屏信息 + Tabs + 右侧元信息 + 评论置底"
      bannerSlot={<StatusBanner type="prompt" id={id} status={detail.content.status} />}
      tabsSlot={<TabNav items={[{ label: 'Overview' }, { label: 'Content' }, { label: 'Showcase' }]} />}
      sections={[
        {
          title: '基础信息',
          content: (
            <div className="space-y-3 text-sm text-slate-700">
              <p className="text-slate-600">{detail.content.one_liner ?? '暂无描述'}</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.content.tag_ids.map((tagId) => (
                  <Badge key={tagId} tone="info">#{tagId}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span>language: {detail.language}</span>
                <span>model: {detail.model_name}</span>
                <span>status: {detail.content.status}</span>
              </div>
            </div>
          ),
        },
        {
          title: '获取资源',
          content: (
            <div className="space-y-3">
              <CodeBlock title="Prompt 正文" value={detail.prompt_text} />
              <Placeholder title="Showcase 占位" todos={['showcases 媒体渲染', '预览切换']} />
            </div>
          ),
        },
      ]}
      metaSlot={<SocialBar target={target} />}
      commentsSlot={<CommentThread target={target} />}
    />
  );
}
