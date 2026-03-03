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
import { getSkill } from '@/lib/api';
import { toDisplayTags } from '@/lib/tagDisplay';
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
      <SectionCard title={`Skill 详情（未找到：${id}）`}>
        <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" />
      </SectionCard>
    );
  }

  const displayTags = toDisplayTags(detail.content.tag_ids, 3);

  return (
    <div className="space-y-4">
      <StatusBanner type="skill" id={id} status={detail.content.status} />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <SectionCard title="案例展示">
            {detail.cases.length > 0 ? (
              <div className="space-y-4">
                {detail.cases.map((item) => (
                  <article key={item.id} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-4 py-6 text-center text-sm text-slate-600">
                      案例效果展示区（图片/视频占位，暂无内容）
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">用户输入</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.user_input}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">执行过程</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.execution_process}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">结果输出</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.agent_output}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">暂无案例</p>
            )}
          </SectionCard>

          <SectionCard title="如何使用">
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
                  <p className="text-sm text-slate-800">Skill</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">提供方</p>
                  <p className="text-sm text-slate-800">{detail.provider_name || '暂无'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">仓库地址</p>
                  {detail.repo_url ? (
                    <a
                      href={detail.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-all text-sm text-sky-700 hover:underline"
                    >
                      {detail.repo_url}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-800">暂无</p>
                  )}
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
