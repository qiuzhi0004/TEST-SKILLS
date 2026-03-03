'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { FieldCodeText } from '@/components/forms/FieldCodeText';
import { FieldMultiSelect } from '@/components/forms/FieldMultiSelect';
import { FieldText } from '@/components/forms/FieldText';
import { FieldTextarea } from '@/components/forms/FieldTextarea';
import { FormActions } from '@/components/forms/FormActions';
import { Placeholder } from '@/components/layout/Placeholder';
import { FormPageTemplate } from '@/components/page-templates/FormPageTemplate';
import { categoryOptions, tagOptions } from '@/components/forms/authoring/options';
import { changeStatus, createDraft, getMyRecord, submitForReview, updateAfterSubmit, updateDraft } from '@/lib/api/authoring';
import { getMcp } from '@/lib/api';
import type { ContentStatus } from '@/types/content';
import type { McpDetailVM } from '@/types/mcp';

interface McpAuthoringPageProps {
  mode: 'new' | 'edit';
  id?: string;
}

interface McpFormState {
  title: string;
  description: string;
  category_ids: string[];
  tag_ids: string[];
  repo_url: string;
  json_config_text: string;
  common_clients_json: string;
  runtime_modes_json: string;
  cases: Array<{
    id: string;
    title: string;
    user_input: string;
    execution_process: string;
    agent_output: string;
    media: Array<{
      id: string;
      asset_id: string;
      media_type: 'image' | 'video';
    }>;
  }>;
}

const EMPTY_FORM: McpFormState = {
  title: '',
  description: '',
  category_ids: [],
  tag_ids: [],
  repo_url: '',
  json_config_text: '',
  common_clients_json: '',
  runtime_modes_json: '',
  cases: [],
};

function formToDetail(id: string, status: ContentStatus, form: McpFormState): McpDetailVM {
  const now = new Date().toISOString();
  return {
    content: {
      id,
      type: 'mcp',
      status,
      title: form.title,
      one_liner: form.description || null,
      category_ids: form.category_ids,
      tag_ids: form.tag_ids,
      author_id: 'user-001',
      cover_asset_id: null,
      created_at: now,
      updated_at: now,
    },
    source: 'user',
    provider_name: 'user-001',
    repo_url: form.repo_url,
    how_to_use: {
      // NOTE(decision-3): 按字段文档 A 使用三段原样文本存储。
      json_config_text: form.json_config_text,
      common_clients_json: form.common_clients_json,
      runtime_modes_json: form.runtime_modes_json,
    },
    cases: form.cases
      .filter((item) => item.title.trim() || item.user_input.trim() || item.execution_process.trim() || item.agent_output.trim())
      .map((item, index) => ({
        id: `${id}-case-${index + 1}`,
        title: item.title || `案例 ${index + 1}`,
        user_input: item.user_input,
        execution_process: item.execution_process,
        agent_output: item.agent_output,
        media: item.media.map((media, mediaIndex) => ({
          id: `${id}-case-${index + 1}-media-${mediaIndex + 1}`,
          asset_id: media.asset_id,
          external_url: null,
          media_type: media.media_type,
          sort_order: mediaIndex + 1,
        })),
        sort_order: index + 1,
      })),
  };
}

function detailToForm(detail: McpDetailVM): McpFormState {
  return {
    title: detail.content.title ?? '',
    description: detail.content.one_liner ?? '',
    category_ids: detail.content.category_ids ?? [],
    tag_ids: detail.content.tag_ids ?? [],
    repo_url: detail.repo_url ?? '',
    json_config_text: detail.how_to_use.json_config_text ?? '',
    common_clients_json: detail.how_to_use.common_clients_json ?? '',
    runtime_modes_json: detail.how_to_use.runtime_modes_json ?? '',
    cases: detail.cases.map((item, index) => ({
      id: item.id || `case-${index + 1}`,
      title: item.title,
      user_input: item.user_input,
      execution_process: item.execution_process,
      agent_output: item.agent_output,
      media: (item.media ?? []).map((media, mediaIndex) => ({
        id: media.id || `case-${index + 1}-media-${mediaIndex + 1}`,
        asset_id: media.asset_id ?? '',
        media_type: media.media_type === 'video' ? 'video' : 'image',
      })),
    })),
  };
}

export function McpAuthoringPage({ mode, id }: McpAuthoringPageProps) {
  const [form, setForm] = useState<McpFormState>(EMPTY_FORM);
  const [recordId, setRecordId] = useState<string | null>(id ?? null);
  const [status, setStatus] = useState<ContentStatus>('Draft');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');

  useEffect(() => {
    if (mode !== 'edit' || !id) return;

    let cancelled = false;
    void (async () => {
      const mine = await getMyRecord('mcp', id);
      if (mine) {
        if (!cancelled) {
          setRecordId(mine.id);
          setStatus(mine.status);
          setForm(detailToForm(mine.data));
          setLoading(false);
        }
        return;
      }
      try {
        const base = await getMcp(id);
        if (!cancelled) {
          setRecordId(id);
          setStatus(base.content.status);
          setForm(detailToForm(base));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setTip('未找到可编辑内容');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  const validationError = useMemo(() => {
    if (!form.title.trim()) return '标题必填';
    if (!form.repo_url.trim()) return '仓库地址必填';
    if (!form.json_config_text.trim()) return '标准配置必填';
    return '';
  }, [form]);

  async function readFileAsDataUrl(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('read file failed'));
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadCaseMedia(caseId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    const mediaItems = await Promise.all(
      Array.from(files)
        .filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
        .map(async (file) => ({
          id: `${caseId}-media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          asset_id: await readFileAsDataUrl(file),
          media_type: file.type.startsWith('video/') ? ('video' as const) : ('image' as const),
        })),
    );
    setForm((prev) => ({
      ...prev,
      cases: prev.cases.map((item) =>
        item.id === caseId
          ? {
              ...item,
              media: [...(item.media ?? []), ...mediaItems],
            }
          : item,
      ),
    }));
  }

  const persist = async (intent: 'save' | 'submit') => {
    if (validationError) {
      setTip(`校验失败：${validationError}`);
      return;
    }

    const actualId = recordId ?? `mcp-local-${Date.now()}`;
    const detail = formToDetail(actualId, status, form);

    if (!recordId) {
      const created = await createDraft('mcp', detail);
      setRecordId(created);
    }

    const targetId = recordId ?? actualId;
    const editableAfterSubmit = status === 'PendingReview' || status === 'Listed' || status === 'Reject';

    if (intent === 'save') {
      if (editableAfterSubmit) {
        await updateAfterSubmit('mcp', targetId, detail);
        setStatus('PendingReview');
        setTip('已保存，状态已回到 PendingReview');
      } else {
        await updateDraft('mcp', targetId, detail);
        setStatus('Draft');
        setTip('草稿已保存');
      }
      return;
    }

    if (editableAfterSubmit) {
      await updateAfterSubmit('mcp', targetId, detail);
    } else {
      await updateDraft('mcp', targetId, detail);
    }
    await submitForReview('mcp', targetId);
    setStatus('PendingReview');
    setTip('已提交审核（PendingReview）');
  };

  return (
    <FormPageTemplate
      title={mode === 'new' ? 'MCP 创建' : `MCP 编辑：${id}`}
      hideActionTitle
      formSlot={
        loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : (
          <div className="space-y-4">
            <FieldText label="标题" required value={form.title} onChange={(title) => setForm((p) => ({ ...p, title }))} />
            <FieldTextarea label="一句话描述" value={form.description} onChange={(description) => setForm((p) => ({ ...p, description }))} rows={3} />
            <FieldText label="仓库地址" required value={form.repo_url} onChange={(repo_url) => setForm((p) => ({ ...p, repo_url }))} />
            <FieldMultiSelect label="分类（可多选）" required value={form.category_ids} options={categoryOptions} onChange={(category_ids) => setForm((p) => ({ ...p, category_ids }))} />
            <FieldMultiSelect
              label="标签（可多选）"
              value={form.tag_ids}
              options={tagOptions}
              onChange={(tag_ids) => setForm((p) => ({ ...p, tag_ids }))}
              allowCustom
              customPlaceholder="输入自定义标签后点击添加"
            />
            {/* NOTE(decision-3): how_to_use 三段均按原样文本收集，不解析 object。 */}
            <FieldCodeText label="标准配置（JSON 文本）" required value={form.json_config_text} onChange={(json_config_text) => setForm((p) => ({ ...p, json_config_text }))} />
            <FieldCodeText label="常用客户端（JSON 文本）" value={form.common_clients_json} onChange={(common_clients_json) => setForm((p) => ({ ...p, common_clients_json }))} />
            <FieldCodeText label="运行形态补充（JSON 文本）" value={form.runtime_modes_json} onChange={(runtime_modes_json) => setForm((p) => ({ ...p, runtime_modes_json }))} />
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">案例展示（可多条）</p>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      cases: [
                        ...prev.cases,
                        {
                          id: `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                          title: '',
                          user_input: '',
                          execution_process: '',
                          agent_output: '',
                          media: [],
                        },
                      ],
                    }))
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                >
                  新增案例
                </button>
              </div>
              {form.cases.length === 0 ? <p className="text-xs text-slate-500">暂无案例，详情页会显示“暂无案例”。</p> : null}
              <div className="space-y-3">
                {form.cases.map((item, index) => (
                  <div key={item.id} className="space-y-2 rounded border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-600">案例 {index + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            cases: prev.cases.filter((c) => c.id !== item.id),
                          }))
                        }
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                      >
                        删除
                      </button>
                    </div>
                    <FieldText
                      label="案例标题"
                      value={item.title}
                      onChange={(title) =>
                        setForm((prev) => ({
                          ...prev,
                          cases: prev.cases.map((c) => (c.id === item.id ? { ...c, title } : c)),
                        }))
                      }
                    />
                    <FieldTextarea
                      label="用户输入"
                      value={item.user_input}
                      onChange={(user_input) =>
                        setForm((prev) => ({
                          ...prev,
                          cases: prev.cases.map((c) => (c.id === item.id ? { ...c, user_input } : c)),
                        }))
                      }
                      rows={2}
                    />
                    <FieldTextarea
                      label="执行过程"
                      value={item.execution_process}
                      onChange={(execution_process) =>
                        setForm((prev) => ({
                          ...prev,
                          cases: prev.cases.map((c) => (c.id === item.id ? { ...c, execution_process } : c)),
                        }))
                      }
                      rows={2}
                    />
                    <FieldTextarea
                      label="结果输出"
                      value={item.agent_output}
                      onChange={(agent_output) =>
                        setForm((prev) => ({
                          ...prev,
                          cases: prev.cases.map((c) => (c.id === item.id ? { ...c, agent_output } : c)),
                        }))
                      }
                      rows={2}
                    />
                    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                      <p className="text-xs font-medium text-slate-700">图片/视频上传区（可多选）</p>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(event) => void handleUploadCaseMedia(item.id, event.target.files)}
                        className="block w-full text-xs text-slate-700 file:mr-2 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2 file:py-1"
                      />
                      {(item.media ?? []).length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {(item.media ?? []).map((media) => (
                            <div key={media.id} className="overflow-hidden rounded border border-slate-200 bg-white p-2">
                              {media.media_type === 'video' ? (
                                <video src={media.asset_id} controls className="h-24 w-full rounded object-cover" />
                              ) : (
                                <img src={media.asset_id} alt="案例素材" className="h-24 w-full rounded object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    cases: prev.cases.map((c) =>
                                      c.id === item.id
                                        ? {
                                            ...c,
                                            media: (c.media ?? []).filter((m) => m.id !== media.id),
                                          }
                                        : c,
                                    ),
                                  }))
                                }
                                className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                              >
                                删除素材
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">未上传案例素材。</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
      sideSlot={
        <div className="space-y-3">
          <Badge tone="info">状态：{status}</Badge>
          {recordId ? <p className="text-xs text-slate-500">记录ID：{recordId}</p> : null}
          {tip ? <p className="text-xs text-slate-600">{tip}</p> : null}
          <Placeholder title="必填项" todos={['标题', '仓库地址', '标准配置（JSON）']} />
        </div>
      }
      actionSlot={
        <FormActions
          status={status}
          onSaveDraft={() => void persist('save')}
          onSubmitReview={() => void persist('submit')}
          onList={
            recordId
              ? () => {
                  void changeStatus('mcp', recordId, 'Listed');
                  setStatus('Listed');
                  setTip('已本地上架（Listed）');
                }
              : undefined
          }
          onUnlist={
            recordId
              ? () => {
                  void changeStatus('mcp', recordId, 'Unlisted');
                  setStatus('Unlisted');
                  setTip('已本地下架（Unlisted）');
                }
              : undefined
          }
        />
      }
    />
  );
}
