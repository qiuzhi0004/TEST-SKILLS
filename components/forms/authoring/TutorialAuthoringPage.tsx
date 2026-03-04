'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { FieldMultiSelect } from '@/components/forms/FieldMultiSelect';
import { FieldText } from '@/components/forms/FieldText';
import { FieldTextarea } from '@/components/forms/FieldTextarea';
import { FormActions } from '@/components/forms/FormActions';
import { FormPageTemplate } from '@/components/page-templates/FormPageTemplate';
import { categoryOptions, tagOptions } from '@/components/forms/authoring/options';
import { changeStatus, createDraft, getMyRecord, submitForReview, updateAfterSubmit, updateDraft } from '@/lib/api/authoring';
import { getTutorial } from '@/lib/api';
import type { ContentStatus } from '@/types/content';
import type { TutorialDetailVM } from '@/types/tutorial';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  zip_asset_id: string;
  zip_file_name: string;
}

const EMPTY_FORM: TutorialFormState = {
  title: '',
  description: '',
  body_markdown: '',
  category_ids: [],
  tag_ids: [],
  zip_asset_id: '',
  zip_file_name: '',
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
    zip_asset_id: '',
    zip_file_name: '',
  };
}

export function TutorialAuthoringPage({ mode, id }: TutorialAuthoringPageProps) {
  const [form, setForm] = useState<TutorialFormState>(EMPTY_FORM);
  const [recordId, setRecordId] = useState<string | null>(id ?? null);
  const [status, setStatus] = useState<ContentStatus>('Draft');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [previewMode, setPreviewMode] = useState(false);

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
    if (!form.body_markdown.trim()) return '帖子正文必填';
    return '';
  }, [form]);
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!form.title.trim()) errors.push('标题未填写');
    if (!form.body_markdown.trim()) errors.push('帖子正文未填写');
    return errors;
  }, [form]);
  const checklist = useMemo(
    () => [
      { label: '标题', passed: Boolean(form.title.trim()) },
      { label: '帖子正文（Markdown）', passed: Boolean(form.body_markdown.trim()) },
      { label: 'Zip 上传（可选）', passed: true },
      { label: '分类（>=1）', passed: form.category_ids.length > 0 },
    ],
    [form],
  );

  async function readFileAsDataUrl(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('read file failed'));
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadZip(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const asset = await readFileAsDataUrl(file);
    setForm((prev) => ({
      ...prev,
      zip_asset_id: asset,
      zip_file_name: file.name,
    }));
  }

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
      title={mode === 'new' ? '创建帖子' : `教程编辑：${id}`}
      hideActionTitle
      formSlot={
        loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : previewMode ? (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">效果预览</h3>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                返回编辑
              </button>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              <h4 className="mb-3 text-xl font-semibold text-slate-900">{form.title || '（未填写标题）'}</h4>
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
                }}
              >
                {form.body_markdown || '（帖子正文预览区）'}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FieldText label="标题" required value={form.title} onChange={(title) => setForm((p) => ({ ...p, title }))} />
            <FieldTextarea label="一句话描述" value={form.description} onChange={(description) => setForm((p) => ({ ...p, description }))} rows={3} />
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">Zip 上传区（可选）</p>
              <input
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(event) => void handleUploadZip(event.target.files)}
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
              />
              {form.zip_file_name ? (
                <div className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                  <span>已上传：{form.zip_file_name}</span>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, zip_asset_id: '', zip_file_name: '' }))}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                  >
                    移除
                  </button>
                </div>
              ) : null}
            </div>
            <FieldTextarea label="帖子正文（Markdown）" required value={form.body_markdown} onChange={(body_markdown) => setForm((p) => ({ ...p, body_markdown }))} rows={10} />
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
          <button
            type="button"
            onClick={() => setPreviewMode((value) => !value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            {previewMode ? '返回编辑表单' : '效果预览'}
          </button>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium text-slate-700">实时检查清单</p>
            <ul className="space-y-1">
              {checklist.map((item) => (
                <li key={item.label} className={`text-xs ${item.passed ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {item.passed ? '✓' : '○'} {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="mb-2 text-xs font-medium text-rose-700">错误汇总</p>
            {validationErrors.length > 0 ? (
              <ul className="space-y-1">
                {validationErrors.map((error) => (
                  <li key={error} className="text-xs text-rose-700">
                    - {error}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-700">当前无错误，可保存或提交。</p>
            )}
          </div>
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
