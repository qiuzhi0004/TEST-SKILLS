'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/common/Badge';
import { Placeholder } from '@/components/layout/Placeholder';
import { TabNav } from '@/components/layout/TabNav';
import { DetailPageTemplate } from '@/components/page-templates/DetailPageTemplate';
import { CommentThread } from '@/components/social/CommentThread';
import { SocialBar } from '@/components/social/SocialBar';
import { StatusBanner } from '@/components/admin/StatusBanner';
import { getTutorial } from '@/lib/api';
import type { TutorialDetailVM } from '@/types/tutorial';

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
      <DetailPageTemplate
        title={`教程详情（未找到：${id}）`}
        subtitle="未找到对应 mock 或本地记录"
        tabsSlot={<TabNav items={[{ label: 'Overview' }, { label: 'Content' }, { label: 'Media' }]} />}
        sections={[
          { title: '空状态', content: <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" /> },
          { title: '后续功能', content: <Placeholder title="详情交互占位" todos={['评论', '收藏', '分享']} /> },
        ]}
      />
    );
  }

  return (
    <DetailPageTemplate
      title={detail.content.title}
      subtitle="低保真块：正文 + Media + 评论"
      bannerSlot={<StatusBanner type="tutorial" id={id} status={detail.content.status} />}
      tabsSlot={<TabNav items={[{ label: 'Overview' }, { label: 'Content' }, { label: 'Media' }]} />}
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
              <div className="text-xs text-slate-500">status: {detail.content.status}</div>
            </div>
          ),
        },
        {
          title: '正文内容',
          content: <pre className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{detail.body_markdown}</pre>,
        },
        {
          title: '媒体区',
          content: (
            <div className="space-y-2 text-sm text-slate-700">
              <p>媒体数量：{detail.media.length}</p>
              <ul className="space-y-1">
                {detail.media.map((item) => (
                  <li key={item.id} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs">
                    {item.media_type} · asset_id: {item.asset_id}
                  </li>
                ))}
              </ul>
              <Placeholder title="媒体预览占位" description="图片/视频播放器在后续步骤增强。" />
            </div>
          ),
        },
      ]}
      metaSlot={<SocialBar target={target} />}
      commentsSlot={<CommentThread target={target} />}
    />
  );
}
