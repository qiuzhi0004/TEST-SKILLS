import { loadAuthoringState, saveAuthoringState } from '@/lib/client/storage_authoring';
import type { AuthoringDataMap, AuthoringRecord } from '@/types/authoring';
import type { ContentStatus, ContentType } from '@/types/content';

function nowIso() {
  return new Date().toISOString();
}

function createId(type: ContentType) {
  return `${type}-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function findRecordIndex(records: AuthoringRecord[], type: ContentType, id: string) {
  return records.findIndex((item) => item.type === type && item.id === id);
}

function withUpdatedMeta<T extends ContentType>(record: AuthoringRecord<T>): AuthoringRecord<T> {
  return {
    ...record,
    updated_at: nowIso(),
    version: (record.version ?? 0) + 1,
  };
}

function assertCanEditAfterSubmit(status: ContentStatus) {
  // NOTE(decision-1): /docs/DECISIONS.md 规定按接口契约 B 口径：
  // PendingReview/Listed/Reject 允许编辑保存，保存后统一回 PendingReview。
  if (status !== 'PendingReview' && status !== 'Listed' && status !== 'Reject') {
    throw new Error(`Status ${status} is not editable after submit`);
  }
}

export async function createDraft<T extends ContentType>(
  type: T,
  initialData: AuthoringDataMap[T],
): Promise<string> {
  const state = loadAuthoringState();
  const id = initialData.content.id || createId(type);
  const createdAt = nowIso();

  const record: AuthoringRecord<T> = {
    id,
    type,
    status: 'Draft',
    data: {
      ...initialData,
      content: {
        ...initialData.content,
        id,
        status: 'Draft',
        created_at: initialData.content.created_at || createdAt,
        updated_at: createdAt,
      },
    },
    created_at: createdAt,
    updated_at: createdAt,
    version: 1,
  };

  state.records.unshift(record as AuthoringRecord);
  saveAuthoringState(state);
  return id;
}

export async function updateDraft<T extends ContentType>(
  type: T,
  id: string,
  patch: Partial<AuthoringDataMap[T]>,
): Promise<void> {
  const state = loadAuthoringState();
  const index = findRecordIndex(state.records, type, id);
  if (index < 0) {
    throw new Error(`Record not found: ${type}/${id}`);
  }

  const current = state.records[index] as AuthoringRecord<T>;
  const nextStatus: ContentStatus = 'Draft';

  const nextRecord: AuthoringRecord<T> = withUpdatedMeta({
    ...current,
    status: nextStatus,
    data: {
      ...current.data,
      ...patch,
      content: {
        ...current.data.content,
        ...(patch as Partial<AuthoringDataMap[T]>)?.content,
        id,
        status: nextStatus,
        updated_at: nowIso(),
      },
    },
  });

  state.records[index] = nextRecord as AuthoringRecord;
  saveAuthoringState(state);
}

export async function submitForReview(type: ContentType, id: string): Promise<void> {
  const state = loadAuthoringState();
  const index = findRecordIndex(state.records, type, id);
  if (index < 0) {
    throw new Error(`Record not found: ${type}/${id}`);
  }

  const current = state.records[index];
  const nextStatus: ContentStatus = 'PendingReview';
  const next = withUpdatedMeta({
    ...current,
    status: nextStatus,
    data: {
      ...current.data,
      content: {
        ...current.data.content,
        status: nextStatus,
        updated_at: nowIso(),
      },
    } as AuthoringRecord["data"],
  } as AuthoringRecord);

  state.records[index] = next;
  saveAuthoringState(state);
}

export async function updateAfterSubmit<T extends ContentType>(
  type: T,
  id: string,
  patch: Partial<AuthoringDataMap[T]>,
): Promise<void> {
  const state = loadAuthoringState();
  const index = findRecordIndex(state.records, type, id);
  if (index < 0) {
    throw new Error(`Record not found: ${type}/${id}`);
  }

  const current = state.records[index] as AuthoringRecord<T>;
  assertCanEditAfterSubmit(current.status);

  const nextStatus: ContentStatus = 'PendingReview';
  const next = withUpdatedMeta({
    ...current,
    status: nextStatus,
    data: {
      ...current.data,
      ...patch,
      content: {
        ...current.data.content,
        ...(patch as Partial<AuthoringDataMap[T]>)?.content,
        id,
        status: nextStatus,
        updated_at: nowIso(),
      },
    },
  });

  state.records[index] = next as AuthoringRecord;
  saveAuthoringState(state);
}

export async function changeStatus(type: ContentType, id: string, nextStatus: ContentStatus): Promise<void> {
  const state = loadAuthoringState();
  const index = findRecordIndex(state.records, type, id);
  if (index < 0) {
    throw new Error(`Record not found: ${type}/${id}`);
  }

  const current = state.records[index];

  // NOTE(decision-2): Unlisted 重新上架遵循接口契约 B 口径；此处用最小本地化状态跳转。
  // TODO: 接后端后应以服务端状态机校验为准，并区分“未修改直上架/已修改重审”。
  const next = withUpdatedMeta({
    ...current,
    status: nextStatus,
    data: {
      ...current.data,
      content: {
        ...current.data.content,
        status: nextStatus,
        updated_at: nowIso(),
      },
    } as AuthoringRecord["data"],
  } as AuthoringRecord);

  state.records[index] = next;
  saveAuthoringState(state);
}

export async function deleteMyRecord(type: ContentType, id: string): Promise<void> {
  const state = loadAuthoringState();
  const index = findRecordIndex(state.records, type, id);
  if (index < 0) {
    throw new Error(`Record not found: ${type}/${id}`);
  }
  state.records.splice(index, 1);
  saveAuthoringState(state);
}

export async function listMyRecords(type?: ContentType): Promise<AuthoringRecord[]> {
  const state = loadAuthoringState();
  const records = type ? state.records.filter((item) => item.type === type) : state.records;
  return [...records].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getMyRecord<T extends ContentType>(type: T, id: string): Promise<AuthoringRecord<T> | null> {
  const state = loadAuthoringState();
  const found = state.records.find((item) => item.type === type && item.id === id) as AuthoringRecord<T> | undefined;
  return found ?? null;
}
