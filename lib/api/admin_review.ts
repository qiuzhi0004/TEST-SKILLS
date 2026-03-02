import { appendAuditLog, listAuditLogs } from '@/lib/api/audit';
import { changeStatus, getMyRecord, listMyRecords } from '@/lib/api/authoring';
import { getMcp, getPrompt, getSkill, getTutorial } from '@/lib/api';
import type { AuditLogItem } from '@/types/audit';
import type { ContentStatus, ContentSummaryVM, ContentType } from '@/types/content';

export interface ListReviewQueueParams {
  status?: ContentStatus;
  type?: ContentType | 'all';
  q?: string;
  offset?: number;
  limit?: number;
}

function toSummary(record: Awaited<ReturnType<typeof listMyRecords>>[number]): ContentSummaryVM {
  return {
    id: record.id,
    type: record.type,
    status: record.status,
    title: record.data.content.title,
    one_liner: record.data.content.one_liner,
    category_ids: record.data.content.category_ids,
    tag_ids: record.data.content.tag_ids,
    author: {
      id: record.data.content.author_id,
      nickname: record.data.content.author_id,
      avatar_asset_id: null,
    },
    cover_asset_id: record.data.content.cover_asset_id,
    stats_7d: {
      views: 0,
      up: 0,
      comments: 0,
      hot_score: 0,
    },
    created_at: record.data.content.created_at,
    updated_at: record.data.content.updated_at,
    highlight: {
      title: null,
      one_liner: null,
      document: null,
    },
  };
}

export async function listReviewQueue(
  params: ListReviewQueueParams,
): Promise<{ items: ContentSummaryVM[]; meta: { offset: number; limit: number; total: number } }> {
  const {
    status,
    type = 'all',
    q = '',
    offset = 0,
    limit = 20,
  } = params;

  const records = await listMyRecords(type === 'all' ? undefined : type);

  const filtered = records.filter((record) => {
    if (status && record.status !== status) {
      return false;
    }

    if (q.trim()) {
      const text = `${record.data.content.title} ${record.data.content.one_liner ?? ''}`.toLowerCase();
      if (!text.includes(q.trim().toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);

  return {
    items: filtered.slice(safeOffset, safeOffset + safeLimit).map(toSummary),
    meta: {
      offset: safeOffset,
      limit: safeLimit,
      total: filtered.length,
    },
  };
}

export async function getReviewItem(type: ContentType, id: string): Promise<{ detailVM: unknown; auditLogs: AuditLogItem[] }> {
  const detailVM =
    type === 'prompt'
      ? await getPrompt(id)
      : type === 'mcp'
        ? await getMcp(id)
        : type === 'skill'
          ? await getSkill(id)
          : await getTutorial(id);

  const logs = await listAuditLogs({ target_type: type, target_id: id, limit: 100, offset: 0 });
  return {
    detailVM,
    auditLogs: logs.items,
  };
}

async function appendStatusAudit(action: AuditLogItem['action'], type: ContentType, id: string, fromStatus: ContentStatus, toStatus: ContentStatus, reason?: string, meta?: Record<string, unknown>) {
  await appendAuditLog({
    action,
    target_type: type,
    target_id: id,
    from_status: fromStatus,
    to_status: toStatus,
    reason,
    meta,
  });
}

async function getCurrentStatus(type: ContentType, id: string): Promise<ContentStatus> {
  const mine = await getMyRecord(type, id);
  if (!mine) {
    throw new Error(`Record not found: ${type}/${id}`);
  }
  return mine.status;
}

export async function approve(type: ContentType, id: string, opts?: { reason?: string; also_list?: boolean }): Promise<void> {
  const from = await getCurrentStatus(type, id);

  // NOTE(decision-2): 审核流口径按 /docs/接口契约方案.md（B）执行，不按状态图文档。
  await changeStatus(type, id, 'Approved');
  await appendStatusAudit('approve', type, id, from, 'Approved', opts?.reason);

  if (opts?.also_list) {
    await changeStatus(type, id, 'Listed');
    await appendStatusAudit('list', type, id, 'Approved', 'Listed', opts.reason, { via: 'approve_also_list' });
  }
}

export async function reject(type: ContentType, id: string, opts: { reason: string }): Promise<void> {
  if (!opts.reason.trim()) {
    throw new Error('reject reason is required');
  }

  const from = await getCurrentStatus(type, id);
  await changeStatus(type, id, 'Reject');
  await appendStatusAudit('reject', type, id, from, 'Reject', opts.reason);
}

export async function setListed(type: ContentType, id: string, opts?: { reason?: string }): Promise<void> {
  const from = await getCurrentStatus(type, id);
  await changeStatus(type, id, 'Listed');
  await appendStatusAudit('list', type, id, from, 'Listed', opts?.reason);
}

export async function setUnlisted(type: ContentType, id: string, opts: { reason: string }): Promise<void> {
  if (!opts.reason.trim()) {
    throw new Error('unlist reason is required');
  }

  const from = await getCurrentStatus(type, id);
  await changeStatus(type, id, 'Unlisted');
  await appendStatusAudit('unlist', type, id, from, 'Unlisted', opts.reason);
}

export async function rollback(type: ContentType, id: string, opts: { to_version?: number; reason: string }): Promise<void> {
  if (!opts.reason.trim()) {
    throw new Error('rollback reason is required');
  }

  const from = await getCurrentStatus(type, id);
  await appendStatusAudit('rollback', type, id, from, from, opts.reason, {
    to_version: opts.to_version ?? null,
    // TODO: 当前本地未实现版本快照回滚，仅记录审计日志。
    implemented: false,
  });
}
