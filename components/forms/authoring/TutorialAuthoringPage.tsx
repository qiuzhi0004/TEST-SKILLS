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
import { changeStatus, createDraft, getMyRecord, submitForReview, updateAfterSubmit, updateDraft } from '@/lib/api/authoring';
import { getTutorial } from '@/lib/api';
import type { ContentStatus } from '@/types/content';
import type { TutorialDetailVM } from '@/types/tutorial';

interface TutorialAuthoringPageProps {
  mode: 'new' | 'edit';
  id?: string;
}

interface TutorialFormState {
  title: string;
  description: string;
  body_markdown: string;
  category_ids: string[];
  tag_ids: string[];
}

const EMPTY_FORM: TutorialFormState = {
  title: '',
  description: '',
  body_markdown: '',
  category_ids: [],
  tag_ids: [],
};

function formToDetail(id: string, status: ContentStatus, form: TutorialFormState): TutorialDetailVM {
  const now = new Date().toISOString();
  return {
    content: {
      id,
      type: 'tutorial',
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
    body_markdown: form.body_markdown,
    media: [],
  };
}

function detailToForm(detail: TutorialDetailVM): TutorialFormState {
  return {
    title: detail.content.title ?? '',
    description: detail.content.one_liner ?? '',
    body_markdown: detail.body_markdown ?? '',
    category_ids: detail.content.category_ids ?? [],
    tag_ids: detail.content.tag_ids ?? [],
  };
}

export function TutorialAuthoringPage({ mode, id }: TutorialAuthoringPageProps) {
  const [form, setForm] = useState<TutorialFormState>(EMPTY_FORM);
  const [recordId, setRecordId] = useState<string | null>(id ?? null);
  const [status, setStatus] = useState<ContentStatus>('Draft');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');

  useEffect(() => {
    if (mode !== 'edit' || !id) return;

    let cancelled = false;
    void (async () => {
      const mine = await getMyRecord('tutorial', id);
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
        const base = await getTutorial(id);
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
    if (!form.body_markdown.trim()) return '教程正文必填';
    return '';
  }, [form]);

  const persist = async (intent: 'save' | 'submit') => {
    if (validationError) {
      setTip(`校验失败：${validationError}`);
      return;
    }

    const actualId = recordId ?? `tutorial-local-${Date.now()}`;
    const detail = formToDetail(actualId, status, form);

    if (!recordId) {
      const created = await createDraft('tutorial', detail);
      setRecordId(created);
    }

    const targetId = recordId ?? actualId;
    const editableAfterSubmit = status === 'PendingReview' || status === 'Listed' || status === 'Reject';

    if (intent === 'save') {
      if (editableAfterSubmit) {
        await updateAfterSubmit('tutorial', targetId, detail);
        setStatus('PendingReview');
        setTip('已保存，状态已回到 PendingReview');
      } else {
        await updateDraft('tutorial', targetId, detail);
        setStatus('Draft');
        setTip('草稿已保存');
      }
      return;
    }

    if (editableAfterSubmit) {
      await updateAfterSubmit('tutorial', targetId, detail);
    } else {
      await updateDraft('tutorial', targetId, detail);
    }
    await submitForReview('tutorial', targetId);
    setStatus('PendingReview');
    setTip('已提交审核（PendingReview）');
  };

  return (
    <FormPageTemplate
      title={mode === 'new' ? '教程创建' : `教程编辑：${id}`}
      hideActionTitle
      formSlot={
        loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : (
          <div className="space-y-4">
            <FieldText label="标题" required value={form.title} onChange={(title) => setForm((p) => ({ ...p, title }))} />
            <FieldTextarea label="一句话描述" value={form.description} onChange={(description) => setForm((p) => ({ ...p, description }))} rows={3} />
            <FieldTextarea label="教程正文（Markdown）" required value={form.body_markdown} onChange={(body_markdown) => setForm((p) => ({ ...p, body_markdown }))} rows={10} />
            <FieldMultiSelect label="分类（可多选）" required value={form.category_ids} options={categoryOptions} onChange={(category_ids) => setForm((p) => ({ ...p, category_ids }))} />
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
          <Placeholder title="必填项" todos={['标题', '教程正文（Markdown）']} />
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
                  void changeStatus('tutorial', recordId, 'Listed');
                  setStatus('Listed');
                  setTip('已本地上架（Listed）');
                }
              : undefined
          }
          onUnlist={
            recordId
              ? () => {
                  void changeStatus('tutorial', recordId, 'Unlisted');
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
