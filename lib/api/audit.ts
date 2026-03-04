import { loadAuditState, saveAuditState } from '@/lib/client/storage_audit';
import type { AuditLogItem, ListAuditLogsParams } from '@/types/audit';

interface AppendAuditLogInput extends Omit<AuditLogItem, 'id' | 'at'> {
  id?: string;
  at?: string;
}

function createId() {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendAuditLog(itemInput: AppendAuditLogInput): Promise<void> {
  const state = loadAuditState();
  const item: AuditLogItem = {
    id: itemInput.id ?? createId(),
    at: itemInput.at ?? new Date().toISOString(),
    actor: itemInput.actor ?? 'admin-local',
    action: itemInput.action,
    target_type: itemInput.target_type,
    target_id: itemInput.target_id,
    from_status: itemInput.from_status,
    to_status: itemInput.to_status,
    reason: itemInput.reason,
    meta: itemInput.meta,
  };

  state.logs.unshift(item);
  saveAuditState(state);
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<{ items: AuditLogItem[]; meta: { offset: number; limit: number; total: number } }> {
  const {
    action_type,
    actor_user_id,
    target_type,
    target_id,
    date_from,
    date_to,
    offset = 0,
    limit = 20,
  } = params;
  const state = loadAuditState();

  const from = date_from ? Date.parse(`${date_from}T00:00:00.000Z`) : null;
  const to = date_to ? Date.parse(`${date_to}T23:59:59.999Z`) : null;

  const filtered = state.logs.filter((log) => {
    if (action_type && action_type !== 'all' && log.action !== action_type) return false;
    if (actor_user_id && actor_user_id !== 'all' && log.actor !== actor_user_id) return false;
    if (target_type && log.target_type !== target_type) return false;
    if (target_id && log.target_id !== target_id) return false;

    if (from && !Number.isNaN(from) && Date.parse(log.at) < from) return false;
    if (to && !Number.isNaN(to) && Date.parse(log.at) > to) return false;

    return true;
  });

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);

  return {
    items: filtered.slice(safeOffset, safeOffset + safeLimit),
    meta: {
      offset: safeOffset,
      limit: safeLimit,
      total: filtered.length,
    },
  };
}
