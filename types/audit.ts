import type { ContentStatus, ContentType } from '@/types/content';

export type AuditAction =
  | 'approve'
  | 'reject'
  | 'list'
  | 'unlist'
  | 'rollback'
  | 'admin_edit'
  | 'rule_change';

export interface AuditLogItem {
  id: string;
  at: string;
  actor?: string;
  action: AuditAction;
  target_type: ContentType;
  target_id: string;
  from_status?: ContentStatus;
  to_status?: ContentStatus;
  reason?: string;
  meta?: Record<string, unknown>;
}

export interface AuditState {
  logs: AuditLogItem[];
}

export interface ListAuditLogsParams {
  action_type?: AuditAction | 'all';
  actor_user_id?: string | 'all';
  target_type?: ContentType;
  target_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export function makeAuditTargetKey(type: ContentType, id: string): string {
  return `${type}:${id}`;
}
