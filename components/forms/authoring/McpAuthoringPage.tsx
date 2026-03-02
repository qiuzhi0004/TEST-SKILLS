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
  provider_name: string;
  repo_url: string;
  json_config_text: string;
  common_clients_json: string;
  runtime_modes_json: string;
}

const EMPTY_FORM: McpFormState = {
  title: '',
  description: '',
  category_ids: [],
  tag_ids: [],
  provider_name: '',
  repo_url: '',
  json_config_text: '',
  common_clients_json: '',
  runtime_modes_json: '',
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
    provider_name: form.provider_name,
    repo_url: form.repo_url,
    how_to_use: {
      // NOTE(decision-3): 按字段文档 A 使用三段原样文本存储。
      json_config_text: form.json_config_text,
      common_clients_json: form.common_clients_json,
      runtime_modes_json: form.runtime_modes_json,
    },
    cases: [],
  };
}

function detailToForm(detail: McpDetailVM): McpFormState {
  return {
    title: detail.content.title,
    description: detail.content.one_liner ?? '',
    category_ids: detail.content.category_ids,
    tag_ids: detail.content.tag_ids,
    provider_name: detail.provider_name,
    repo_url: detail.repo_url,
    json_config_text: detail.how_to_use.json_config_text,
    common_clients_json: detail.how_to_use.common_clients_json,
    runtime_modes_json: detail.how_to_use.runtime_modes_json,
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
    if (!form.title.trim()) return 'title 必填';
    if (!form.provider_name.trim()) return 'provider_name 必填';
    if (!form.repo_url.trim()) return 'repo_url 必填';
    if (!form.json_config_text.trim()) return 'how_to_use.json_config_text 必填';
    return '';
  }, [form]);

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
      subtitle="NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。"
      formSlot={
        loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : (
          <div className="space-y-4">
            <FieldText label="标题" required value={form.title} onChange={(title) => setForm((p) => ({ ...p, title }))} />
            <FieldTextarea label="描述" value={form.description} onChange={(description) => setForm((p) => ({ ...p, description }))} rows={3} />
            <FieldText label="provider_name" required value={form.provider_name} onChange={(provider_name) => setForm((p) => ({ ...p, provider_name }))} />
            <FieldText label="repo_url" required value={form.repo_url} onChange={(repo_url) => setForm((p) => ({ ...p, repo_url }))} />
            <FieldMultiSelect label="category_ids[]" required value={form.category_ids} options={categoryOptions} onChange={(category_ids) => setForm((p) => ({ ...p, category_ids }))} />
            <FieldMultiSelect label="tag_ids[]" value={form.tag_ids} options={tagOptions} onChange={(tag_ids) => setForm((p) => ({ ...p, tag_ids }))} />
            {/* NOTE(decision-3): how_to_use 三段均按原样文本收集，不解析 object。 */}
            <FieldCodeText label="how_to_use.json_config_text" required value={form.json_config_text} onChange={(json_config_text) => setForm((p) => ({ ...p, json_config_text }))} />
            <FieldCodeText label="how_to_use.common_clients_json" value={form.common_clients_json} onChange={(common_clients_json) => setForm((p) => ({ ...p, common_clients_json }))} />
            <FieldCodeText label="how_to_use.runtime_modes_json" value={form.runtime_modes_json} onChange={(runtime_modes_json) => setForm((p) => ({ ...p, runtime_modes_json }))} />
          </div>
        )
      }
      sideSlot={
        <div className="space-y-3">
          <Badge tone="info">状态：{status}</Badge>
          {recordId ? <p className="text-xs text-slate-500">记录ID：{recordId}</p> : null}
          {tip ? <p className="text-xs text-slate-600">{tip}</p> : null}
          <Placeholder title="最小校验" todos={['title', 'provider_name', 'repo_url', 'json_config_text']} />
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
