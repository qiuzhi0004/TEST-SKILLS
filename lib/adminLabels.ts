import type { AdminEventTarget, AdminEventType } from '@/types/admin';

const EVENT_TYPE_LABEL_MAP: Partial<Record<AdminEventType, string>> = {
  'taxonomy.create': '分类/标签新增',
  'taxonomy.update': '分类/标签更新',
  'taxonomy.toggle': '分类/标签启停',
  'system.seed': '系统数据初始化',
};

const EVENT_TARGET_LABEL_MAP: Partial<Record<AdminEventTarget, string>> = {
  category: '分类',
  tag: '标签',
  system: '系统',
};

export function getEventTypeLabel(type: string): string {
  return EVENT_TYPE_LABEL_MAP[type as AdminEventType] ?? type;
}

export function getEventTargetLabel(target: string): string {
  return EVENT_TARGET_LABEL_MAP[target as AdminEventTarget] ?? target;
}
