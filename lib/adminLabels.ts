import type { AdminEventTarget, AdminEventType, AdminRole } from '@/types/admin';

export const BUILTIN_ROLE_NAME_MAP: Record<string, string> = {
  'role-super-admin': '超级管理员',
  'role-content-admin': '内容管理员',
  'role-auditor': '审计员',
  'role-ops': '运营管理员',
};

export const PERMISSION_GROUP_LABEL_MAP: Record<string, string> = {
  audit: '审计',
  rbac: '权限控制',
  taxonomy: '分类标签',
  users: '用户管理',
};

export const EVENT_TYPE_LABEL_MAP: Record<AdminEventType, string> = {
  'taxonomy.create': '分类/标签新增',
  'taxonomy.update': '分类/标签更新',
  'taxonomy.toggle': '分类/标签启停',
  'user.status': '用户状态变更',
  'user.roles': '用户角色变更',
  'role.create': '角色新增',
  'role.update': '角色更新',
  'role.toggle': '角色启停',
  'permission.create': '权限新增',
  'permission.update': '权限更新',
  'permission.toggle': '权限启停',
  'matrix.save': '权限矩阵保存',
  'matrix.toggle': '权限矩阵切换',
  'system.seed': '系统数据初始化',
};

export const EVENT_TARGET_LABEL_MAP: Record<AdminEventTarget, string> = {
  category: '分类',
  tag: '标签',
  user: '用户',
  role: '角色',
  permission: '权限',
  matrix: '权限矩阵',
  system: '系统',
};

export function getRoleDisplayName(role: Pick<AdminRole, 'id' | 'name'>): string {
  return BUILTIN_ROLE_NAME_MAP[role.id] ?? role.name;
}

export function getPermissionGroupLabel(group: string): string {
  return PERMISSION_GROUP_LABEL_MAP[group] ?? group;
}

export function getEventTypeLabel(type: AdminEventType): string {
  return EVENT_TYPE_LABEL_MAP[type] ?? type;
}

export function getEventTargetLabel(target: AdminEventTarget): string {
  return EVENT_TARGET_LABEL_MAP[target] ?? target;
}
