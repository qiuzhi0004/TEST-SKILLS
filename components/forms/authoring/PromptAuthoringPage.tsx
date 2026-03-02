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
import type { PromptDetailVM } from '@/types/prompt';

interface PromptAuthoringPageProps {
  mode: 'new' | 'edit';
  id?: string;
}

interface PromptFormState {
  title: string;
  description: string;
  language: string;
  prompt_body: string;
  category_ids: string[];
  tag_ids: string[];
}

const EMPTY_FORM: PromptFormState = {
  title: '',
  description: '',
  language: 'zh-CN',
  prompt_body: '',
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
    model_name: 'Custom',
    language: form.language,
    prompt_text: form.prompt_body,
    showcases: [],
  };
}

function detailToForm(detail: PromptDetailVM): PromptFormState {
  return {
    title: detail.content.title,
    description: detail.content.one_liner ?? '',
    language: detail.language,
    prompt_body: detail.prompt_text,
    category_ids: detail.content.category_ids,
    tag_ids: detail.content.tag_ids,
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
    if (!form.title.trim()) return 'title 必填';
    if (!form.language.trim()) return 'language 必填';
    if (!form.prompt_body.trim()) return 'prompt_body 必填';
    return '';
  }, [form]);

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
      subtitle="NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。"
      formSlot={
        loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : (
          <div className="space-y-4">
            <FieldText label="标题" required value={form.title} onChange={(title) => setForm((p) => ({ ...p, title }))} />
            <FieldTextarea
              label="描述"
              value={form.description}
              onChange={(description) => setForm((p) => ({ ...p, description }))}
              rows={3}
            />
            <FieldText label="language" required value={form.language} onChange={(language) => setForm((p) => ({ ...p, language }))} />
            <FieldTextarea
              label="prompt_body"
              required
              value={form.prompt_body}
              onChange={(prompt_body) => setForm((p) => ({ ...p, prompt_body }))}
              rows={8}
            />
            <FieldMultiSelect
              label="category_ids[]"
              required
              value={form.category_ids}
              options={categoryOptions}
              onChange={(category_ids) => setForm((p) => ({ ...p, category_ids }))}
            />
            <FieldMultiSelect
              label="tag_ids[]"
              value={form.tag_ids}
              options={tagOptions}
              onChange={(tag_ids) => setForm((p) => ({ ...p, tag_ids }))}
            />
          </div>
        )
      }
      sideSlot={
        <div className="space-y-3">
          <Badge tone="info">状态：{status}</Badge>
          {recordId ? <p className="text-xs text-slate-500">记录ID：{recordId}</p> : null}
          {tip ? <p className="text-xs text-slate-600">{tip}</p> : null}
          <Placeholder title="最小校验" todos={['title', 'language', 'prompt_body']} />
        </div>
      }
      actionSlot={
        <FormActions
          status={status}
          hint="保存草稿/提交审核为本地实现；后续可平滑替换服务端 API。"
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
