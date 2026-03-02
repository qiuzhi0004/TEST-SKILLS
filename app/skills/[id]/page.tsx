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
import { StatusBanner } from '@/components/admin/StatusBanner';
import { getSkill } from '@/lib/api';
import type { SkillDetailVM } from '@/types/skill';

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const target = { target_type: 'skill' as const, target_id: id };
  const [detail, setDetail] = useState<SkillDetailVM | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getSkill(id);
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
        title={`Skill 详情（未找到：${id}）`}
        subtitle="未找到对应 mock 或本地记录"
        tabsSlot={<TabNav items={[{ label: 'Overview' }, { label: 'Cases' }, { label: 'Files' }]} />}
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
      subtitle="低保真块：详情主体 + 右侧元信息 + 评论区"
      bannerSlot={<StatusBanner type="skill" id={id} status={detail.content.status} />}
      tabsSlot={<TabNav items={[{ label: 'Overview' }, { label: 'Cases' }, { label: 'Files' }]} />}
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
                <span>repo_url: {detail.repo_url ?? '(none)'}</span>
                <span>zip_asset_id: {detail.zip_asset_id || '(missing)'}</span>
              </div>
            </div>
          ),
        },
        {
          title: '安装/使用',
          content: (
            <div className="space-y-3 text-sm text-slate-700">
              {/* NOTE(decision-4): Skill install_commands/usage_doc 由前端模型补齐，后端契约待补。 */}
              {detail.install_commands.length > 0 ? (
                <div className="space-y-2">
                  {detail.install_commands.map((command) => (
                    <CodeBlock key={command} title="安装命令" value={command} />
                  ))}
                </div>
              ) : (
                <Placeholder title="安装命令为空" description="当前资源未提供 install_commands。" />
              )}

              {detail.usage_doc ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="mb-2 text-xs font-semibold text-slate-600">usage_doc</p>
                  <pre className="whitespace-pre-wrap">{detail.usage_doc}</pre>
                </div>
              ) : (
                <Placeholder title="usage_doc 为空" description="有 repo_url 时 usage_doc 可为空。" />
              )}
            </div>
          ),
        },
      ]}
      metaSlot={<SocialBar target={target} />}
      commentsSlot={<CommentThread target={target} />}
    />
  );
}
