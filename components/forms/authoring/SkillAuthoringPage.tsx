'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { FieldMultiSelect } from '@/components/forms/FieldMultiSelect';
import { FieldText } from '@/components/forms/FieldText';
import { FieldTextarea } from '@/components/forms/FieldTextarea';
import { FormActions } from '@/components/forms/FormActions';
import { RepeatableListInput } from '@/components/forms/RepeatableListInput';
import { Placeholder } from '@/components/layout/Placeholder';
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
  provider_name: string;
  repo_url: string;
  zip_asset_id: string;
  install_commands: string[];
  usage_doc: string;
}

const EMPTY_FORM: SkillFormState = {
  title: '',
  description: '',
  category_ids: [],
  tag_ids: [],
  provider_name: '',
  repo_url: '',
  zip_asset_id: '',
  install_commands: [''],
  usage_doc: '',
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
    provider_name: form.provider_name || 'Unknown',
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
    cases: [],
  };
}

function detailToForm(detail: SkillDetailVM): SkillFormState {
  return {
    title: detail.content.title,
    description: detail.content.one_liner ?? '',
    category_ids: detail.content.category_ids,
    tag_ids: detail.content.tag_ids,
    provider_name: detail.provider_name,
    repo_url: detail.repo_url ?? '',
    zip_asset_id: detail.zip_asset_id,
    install_commands: detail.install_commands.length > 0 ? detail.install_commands : [''],
    usage_doc: detail.usage_doc ?? '',
  };
}

export function SkillAuthoringPage({ mode, id }: SkillAuthoringPageProps) {
  const [form, setForm] = useState<SkillFormState>(EMPTY_FORM);
  const [recordId, setRecordId] = useState<string | null>(id ?? null);
  const [status, setStatus] = useState<ContentStatus>('Draft');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');

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
    if (!form.title.trim()) return 'title 必填';
    if (!form.zip_asset_id.trim()) return 'zip_asset_id 必填';
    const commands = form.install_commands.filter((item) => item.trim());
    if (commands.length === 0) return 'install_commands 至少 1 条';
    if (!form.repo_url.trim() && !form.usage_doc.trim()) {
      return 'repo_url 为空时 usage_doc 必填';
    }
    return '';
  }, [form]);

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
      subtitle="NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。"
      formSlot={
        loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : (
          <div className="space-y-4">
            <FieldText label="标题" required value={form.title} onChange={(title) => setForm((p) => ({ ...p, title }))} />
            <FieldTextarea label="描述" value={form.description} onChange={(description) => setForm((p) => ({ ...p, description }))} rows={3} />
            <FieldText label="provider_name" value={form.provider_name} onChange={(provider_name) => setForm((p) => ({ ...p, provider_name }))} />
            <FieldText label="repo_url" value={form.repo_url} onChange={(repo_url) => setForm((p) => ({ ...p, repo_url }))} />
            <FieldText label="zip_asset_id" required value={form.zip_asset_id} onChange={(zip_asset_id) => setForm((p) => ({ ...p, zip_asset_id }))} />
            <RepeatableListInput label="install_commands[]" required value={form.install_commands} onChange={(install_commands) => setForm((p) => ({ ...p, install_commands }))} />
            <FieldTextarea label="usage_doc" value={form.usage_doc} onChange={(usage_doc) => setForm((p) => ({ ...p, usage_doc }))} rows={6} />
            <FieldMultiSelect label="category_ids[]" required value={form.category_ids} options={categoryOptions} onChange={(category_ids) => setForm((p) => ({ ...p, category_ids }))} />
            <FieldMultiSelect label="tag_ids[]" value={form.tag_ids} options={tagOptions} onChange={(tag_ids) => setForm((p) => ({ ...p, tag_ids }))} />
          </div>
        )
      }
      sideSlot={
        <div className="space-y-3">
          <Badge tone="info">状态：{status}</Badge>
          {recordId ? <p className="text-xs text-slate-500">记录ID：{recordId}</p> : null}
          {tip ? <p className="text-xs text-slate-600">{tip}</p> : null}
          {/* NOTE(decision-4): Skill install_commands/usage_doc 当前前端补齐，后端契约待补。 */}
          <Placeholder title="最小校验" todos={['zip_asset_id', 'install_commands>=1', 'repo_url为空时usage_doc必填']} />
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
