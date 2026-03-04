'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { FieldMultiSelect } from '@/components/forms/FieldMultiSelect';
import { FieldText } from '@/components/forms/FieldText';
import { FieldTextarea } from '@/components/forms/FieldTextarea';
import { FormActions } from '@/components/forms/FormActions';
import { RepeatableListInput } from '@/components/forms/RepeatableListInput';
import { FormPageTemplate } from '@/components/page-templates/FormPageTemplate';
import { categoryOptions, tagOptions } from '@/components/forms/authoring/options';
import { changeStatus, createDraft, getMyRecord, submitForReview, updateAfterSubmit, updateDraft } from '@/lib/api/authoring';
import { getSkill } from '@/lib/api';
import type { ContentStatus } from '@/types/content';
import type { SkillDetailVM } from '@/types/skill';

interface SkillAuthoringPageProps {
  mode: 'new' | 'edit';
  id?: string;
}

interface SkillFormState {
  title: string;
  description: string;
  category_ids: string[];
  tag_ids: string[];
  repo_url: string;
  zip_asset_id: string;
  zip_file_name: string;
  install_commands: string[];
  usage_doc: string;
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

const EMPTY_FORM: SkillFormState = {
  title: '',
  description: '',
  category_ids: [],
  tag_ids: [],
  repo_url: '',
  zip_asset_id: '',
  zip_file_name: '',
  install_commands: [''],
  usage_doc: '',
  cases: [],
};

function formToDetail(id: string, status: ContentStatus, form: SkillFormState): SkillDetailVM {
  const now = new Date().toISOString();
  return {
    content: {
      id,
      type: 'skill',
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
    repo_url: form.repo_url || null,
    zip_asset_id: form.zip_asset_id,
    install_commands: form.install_commands.filter((item) => item.trim()),
    usage_doc: form.usage_doc || null,
    repo_snapshot: {
      stars: null,
      forks: null,
      updated_at: null,
      synced_at: null,
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

function detailToForm(detail: SkillDetailVM): SkillFormState {
  return {
    title: detail.content.title ?? '',
    description: detail.content.one_liner ?? '',
    category_ids: detail.content.category_ids ?? [],
    tag_ids: detail.content.tag_ids ?? [],
    repo_url: detail.repo_url ?? '',
    zip_asset_id: detail.zip_asset_id ?? '',
    zip_file_name: detail.zip_asset_id ? (detail.zip_asset_id.startsWith('data:') ? '已上传 zip 文件' : detail.zip_asset_id) : '',
    install_commands: detail.install_commands.length > 0 ? detail.install_commands : [''],
    usage_doc: detail.usage_doc ?? '',
    cases: detail.cases.map((item, index) => ({
      id: item.id || `case-${index + 1}`,
      title: item.title,
      user_input: item.user_input,
      execution_process: item.execution_process,
      agent_output: item.agent_output,
      media: item.media.map((media, mediaIndex) => ({
        id: media.id || `case-${index + 1}-media-${mediaIndex + 1}`,
        asset_id: media.asset_id ?? '',
        media_type: media.media_type === 'video' ? 'video' : 'image',
      })),
    })),
  };
}

export function SkillAuthoringPage({ mode, id }: SkillAuthoringPageProps) {
  const [form, setForm] = useState<SkillFormState>(EMPTY_FORM);
  const [recordId, setRecordId] = useState<string | null>(id ?? null);
  const [status, setStatus] = useState<ContentStatus>('Draft');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;

    let cancelled = false;
    void (async () => {
      const mine = await getMyRecord('skill', id);
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
        const base = await getSkill(id);
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
    if (!form.repo_url.trim() && !form.zip_asset_id.trim()) return '仓库地址 与 Zip 上传至少填写一项';
    const commands = form.install_commands.filter((item) => item.trim());
    if (commands.length === 0) return '安装命令至少 1 条';
    if (!form.repo_url.trim() && !form.usage_doc.trim()) {
      return '仓库地址为空时，使用文档必填';
    }
    return '';
  }, [form]);
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!form.title.trim()) errors.push('标题未填写');
    if (!form.repo_url.trim() && !form.zip_asset_id.trim()) errors.push('仓库地址 与 Zip 上传至少填写一项');
    if (form.install_commands.filter((item) => item.trim()).length === 0) errors.push('安装命令至少 1 条');
    if (!form.repo_url.trim() && !form.usage_doc.trim()) errors.push('仓库地址为空时，使用文档必填');
    return errors;
  }, [form]);
  const checklist = useMemo(
    () => [
      { label: '标题', passed: Boolean(form.title.trim()) },
      { label: '仓库地址 或 Zip 上传（至少 1 项）', passed: Boolean(form.repo_url.trim() || form.zip_asset_id.trim()) },
      { label: '安装命令（>=1）', passed: form.install_commands.filter((item) => item.trim()).length > 0 },
      { label: '仓库地址或使用文档', passed: Boolean(form.repo_url.trim() || form.usage_doc.trim()) },
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
              media: [...item.media, ...mediaItems],
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

    const actualId = recordId ?? `skill-local-${Date.now()}`;
    const detail = formToDetail(actualId, status, form);

    if (!recordId) {
      const created = await createDraft('skill', detail);
      setRecordId(created);
    }

    const targetId = recordId ?? actualId;
    const editableAfterSubmit = status === 'PendingReview' || status === 'Listed' || status === 'Reject';

    if (intent === 'save') {
      if (editableAfterSubmit) {
        await updateAfterSubmit('skill', targetId, detail);
        setStatus('PendingReview');
        setTip('已保存，状态已回到 PendingReview');
      } else {
        await updateDraft('skill', targetId, detail);
        setStatus('Draft');
        setTip('草稿已保存');
      }
      return;
    }

    if (editableAfterSubmit) {
      await updateAfterSubmit('skill', targetId, detail);
    } else {
      await updateDraft('skill', targetId, detail);
    }
    await submitForReview('skill', targetId);
    setStatus('PendingReview');
    setTip('已提交审核（PendingReview）');
  };

  return (
    <FormPageTemplate
      title={mode === 'new' ? 'Skill 创建' : `Skill 编辑：${id}`}
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
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="text-base font-semibold text-slate-900">{form.title || '（未填写标题）'}</h4>
              <p className="mt-2 text-sm text-slate-600">{form.description || '（暂无一句话描述）'}</p>
              <div className="mt-4 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">如何使用（安装命令）</p>
                {form.install_commands.filter((item) => item.trim()).length > 0 ? (
                  form.install_commands
                    .filter((item) => item.trim())
                    .map((cmd, index) => (
                      <p key={`${cmd}-${index}`} className="font-mono text-xs text-slate-800">
                        {index + 1}. {cmd}
                      </p>
                    ))
                ) : (
                  <p className="text-xs text-slate-500">暂无安装命令</p>
                )}
              </div>
              <div className="mt-4 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">案例展示</p>
                {form.cases.length > 0 ? (
                  <p className="text-xs text-slate-700">
                    已配置 {form.cases.length} 条案例，详情页将展示用户输入/执行过程/结果输出。
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">暂无案例</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FieldText label="标题" required value={form.title} onChange={(title) => setForm((p) => ({ ...p, title }))} />
            <FieldTextarea label="一句话描述" value={form.description} onChange={(description) => setForm((p) => ({ ...p, description }))} rows={3} />
            <FieldText label="仓库地址" value={form.repo_url} onChange={(repo_url) => setForm((p) => ({ ...p, repo_url }))} />
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">
                Zip 上传区
                <span className="ml-1 text-slate-500">（与仓库地址二选一）</span>
              </p>
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
            <RepeatableListInput label="安装命令（填写仓库地址后可自动生成）" required value={form.install_commands} onChange={(install_commands) => setForm((p) => ({ ...p, install_commands }))} />
            <FieldTextarea label="使用文档（仓库地址为空时必填）" value={form.usage_doc} onChange={(usage_doc) => setForm((p) => ({ ...p, usage_doc }))} rows={6} />
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
                      {item.media.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {item.media.map((media) => (
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
                                            media: c.media.filter((m) => m.id !== media.id),
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
                  void changeStatus('skill', recordId, 'Listed');
                  setStatus('Listed');
                  setTip('已本地上架（Listed）');
                }
              : undefined
          }
          onUnlist={
            recordId
              ? () => {
                  void changeStatus('skill', recordId, 'Unlisted');
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
