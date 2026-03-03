'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { FieldMultiSelect } from '@/components/forms/FieldMultiSelect';
import { FieldText } from '@/components/forms/FieldText';
import { FieldTextarea } from '@/components/forms/FieldTextarea';
import { FormActions } from '@/components/forms/FormActions';
import { Placeholder } from '@/components/layout/Placeholder';
import { FormPageTemplate } from '@/components/page-templates/FormPageTemplate';
import { categoryOptions, tagOptions } from '@/components/forms/authoring/options';
import {
  changeStatus,
  createDraft,
  getMyRecord,
  submitForReview,
  updateAfterSubmit,
  updateDraft,
} from '@/lib/api/authoring';
import { getPrompt } from '@/lib/api';
import type { ContentStatus } from '@/types/content';
import type { PromptDetailVM, PromptMediaType } from '@/types/prompt';

interface PromptAuthoringPageProps {
  mode: 'new' | 'edit';
  id?: string;
}

interface PromptFormState {
  title: string;
  description: string;
  model_name: string;
  prompt_body: string;
  showcases: Array<{
    id: string;
    asset_id: string;
    media_type: PromptMediaType;
  }>;
  category_ids: string[];
  tag_ids: string[];
}

const EMPTY_FORM: PromptFormState = {
  title: '',
  description: '',
  model_name: 'Custom',
  prompt_body: '',
  showcases: [],
  category_ids: [],
  tag_ids: [],
};

function formToDetail(id: string, status: ContentStatus, form: PromptFormState): PromptDetailVM {
  const now = new Date().toISOString();
  return {
    content: {
      id,
      type: 'prompt',
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
    model_name: form.model_name,
    language: 'zh-CN',
    prompt_text: form.prompt_body,
    showcases: form.showcases.map((item, index) => ({
      id: `${id}-showcase-${index + 1}`,
      asset_id: item.asset_id,
      media_type: item.media_type,
      caption: null,
      sort_order: index + 1,
    })),
  };
}

function detailToForm(detail: PromptDetailVM): PromptFormState {
  return {
    title: detail.content.title ?? '',
    description: detail.content.one_liner ?? '',
    model_name: detail.model_name || 'Custom',
    prompt_body: detail.prompt_text ?? '',
    showcases: detail.showcases.map((item, index) => ({
      id: item.id || `showcase-${index + 1}`,
      asset_id: item.asset_id,
      media_type: item.media_type,
    })),
    category_ids: detail.content.category_ids ?? [],
    tag_ids: detail.content.tag_ids ?? [],
  };
}

export function PromptAuthoringPage({ mode, id }: PromptAuthoringPageProps) {
  const [form, setForm] = useState<PromptFormState>(EMPTY_FORM);
  const [recordId, setRecordId] = useState<string | null>(id ?? null);
  const [status, setStatus] = useState<ContentStatus>('Draft');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');

  useEffect(() => {
    if (mode !== 'edit' || !id) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const mine = await getMyRecord('prompt', id);
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
        const base = await getPrompt(id);
        if (!cancelled) {
          setRecordId(id);
          setStatus(base.content.status);
          setForm(detailToForm(base));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setTip('未找到可编辑内容');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  const validationError = useMemo(() => {
    if (!form.title.trim()) return '标题必填';
    if (!form.model_name.trim()) return '模型名称必填';
    if (!form.prompt_body.trim()) return 'Prompt 正文必填';
    return '';
  }, [form]);

  async function handleUploadShowcases(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next = await Promise.all(
      Array.from(files)
        .filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
        .map(
          (file) =>
            new Promise<PromptFormState['showcases'][number]>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  asset_id: String(reader.result ?? ''),
                  media_type: file.type.startsWith('video/') ? 'video' : 'image',
                });
              };
              reader.onerror = () => reject(new Error('read file failed'));
              reader.readAsDataURL(file);
            }),
        ),
    );
    setForm((prev) => ({ ...prev, showcases: [...prev.showcases, ...next.filter((item) => item.asset_id)] }));
  }

  const persist = async (intent: 'save' | 'submit') => {
    if (validationError) {
      setTip(`校验失败：${validationError}`);
      return;
    }

    const actualId = recordId ?? `prompt-local-${Date.now()}`;
    const detail = formToDetail(actualId, status, form);

    if (!recordId) {
      const created = await createDraft('prompt', detail);
      setRecordId(created);
    }

    const targetId = recordId ?? actualId;
    const editableAfterSubmit = status === 'PendingReview' || status === 'Listed' || status === 'Reject';

    if (intent === 'save') {
      if (editableAfterSubmit) {
        await updateAfterSubmit('prompt', targetId, detail);
        setStatus('PendingReview');
        setTip('已保存，状态已回到 PendingReview');
      } else {
        await updateDraft('prompt', targetId, detail);
        setStatus('Draft');
        setTip('草稿已保存');
      }
      return;
    }

    if (editableAfterSubmit) {
      await updateAfterSubmit('prompt', targetId, detail);
    } else {
      await updateDraft('prompt', targetId, detail);
    }
    await submitForReview('prompt', targetId);
    setStatus('PendingReview');
    setTip('已提交审核（PendingReview）');
  };

  return (
    <FormPageTemplate
      title={mode === 'new' ? 'Prompt 创建' : `Prompt 编辑：${id}`}
      formSlot={
        loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : (
          <div className="space-y-4">
            <FieldText label="标题" required value={form.title} onChange={(title) => setForm((p) => ({ ...p, title }))} />
            <FieldTextarea
              label="一句话描述"
              value={form.description}
              onChange={(description) => setForm((p) => ({ ...p, description }))}
              rows={3}
            />
            <FieldText label="模型名称" required value={form.model_name} onChange={(model_name) => setForm((p) => ({ ...p, model_name }))} />
            <FieldTextarea
              label="Prompt 正文"
              required
              value={form.prompt_body}
              onChange={(prompt_body) => setForm((p) => ({ ...p, prompt_body }))}
              rows={8}
            />
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">案例上传区（可选）</p>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(event) => void handleUploadShowcases(event.target.files)}
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
              />
              {form.showcases.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {form.showcases.map((item, index) => (
                    <div key={item.id} className="overflow-hidden rounded border border-slate-200 bg-white p-2">
                      {item.media_type === 'video' ? (
                        <video src={item.asset_id} controls className="h-28 w-full rounded object-cover" />
                      ) : (
                        <img src={item.asset_id} alt={`案例 ${index + 1}`} className="h-28 w-full rounded object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            showcases: prev.showcases.filter((s) => s.id !== item.id),
                          }))
                        }
                        className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">可上传多个图片或视频，用于详情页案例展示区。</p>
              )}
            </div>
            <FieldMultiSelect
              label="分类（可多选）"
              required
              value={form.category_ids}
              options={categoryOptions}
              onChange={(category_ids) => setForm((p) => ({ ...p, category_ids }))}
            />
            <FieldMultiSelect
              label="标签（可多选）"
              value={form.tag_ids}
              options={tagOptions}
              onChange={(tag_ids) => setForm((p) => ({ ...p, tag_ids }))}
              allowCustom
              customPlaceholder="输入自定义标签后点击添加"
            />
          </div>
        )
      }
      sideSlot={
        <div className="space-y-3">
          <Badge tone="info">状态：{status}</Badge>
          {recordId ? <p className="text-xs text-slate-500">记录ID：{recordId}</p> : null}
          {tip ? <p className="text-xs text-slate-600">{tip}</p> : null}
          <Placeholder title="必填项" todos={['标题', '模型名称', 'Prompt 正文']} />
        </div>
      }
      actionSlot={
        <FormActions
          status={status}
          hint="保存草稿/提交审核目前为本地实现；后续可平滑替换服务端 API。"
          onSaveDraft={() => void persist('save')}
          onSubmitReview={() => void persist('submit')}
          onList={
            recordId
              ? () => {
                  void changeStatus('prompt', recordId, 'Listed');
                  setStatus('Listed');
                  setTip('已本地上架（Listed）');
                }
              : undefined
          }
          onUnlist={
            recordId
              ? () => {
                  void changeStatus('prompt', recordId, 'Unlisted');
                  setStatus('Unlisted');
                  setTip('已本地下架（Unlisted）');
                }
              : undefined
          }
          saveDisabled={loading}
          submitDisabled={loading}
        />
      }
    />
  );
}
