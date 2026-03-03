'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { toDisplayTags } from '@/lib/tagDisplay';
import { changeStatus, deleteMyRecord, listMyRecords } from '@/lib/api/authoring';
import type { AuthoringRecord } from '@/types/authoring';
import type { ContentStatus, ContentType } from '@/types/content';

function editPath(type: ContentType, id: string) {
  if (type === 'prompt') return `/prompts/${id}/edit`;
  if (type === 'mcp') return `/mcps/${id}/edit`;
  if (type === 'skill') return `/skills/${id}/edit`;
  return `/tutorials/${id}/edit`;
}

export function MyRecordsPanel() {
  const [items, setItems] = useState<AuthoringRecord[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listMyRecords().then((list) => {
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">暂无本地发布记录</p>;
  }

  const statusLabelMap: Record<ContentStatus, string> = {
    Draft: '草稿',
    PendingReview: '待审核',
    Reject: '已拒绝',
    Approved: '已通过',
    Listed: '已上架',
    Unlisted: '已下架',
    Deleted: '已删除',
  };

  const typeLabelMap: Record<ContentType, string> = {
    prompt: 'Prompt',
    skill: 'Skill',
    mcp: 'MCP',
    tutorial: '教程',
  };

  const filteredItems = items.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const keyword = query.trim().toLowerCase();
    const title = item.data.content.title.toLowerCase();
    const id = item.id.toLowerCase();
    const oneLiner = (item.data.content.one_liner ?? '').toLowerCase();
    return title.includes(keyword) || id.includes(keyword) || oneLiner.includes(keyword);
  });

  const selectedSet = new Set(selectedKeys);
  const selectedCount = selectedKeys.length;

  async function handleBatchDelete() {
    if (selectedKeys.length === 0 || updating) return;
    setUpdating(true);
    try {
      await Promise.all(
        items
          .filter((item) => selectedSet.has(`${item.type}:${item.id}`))
          .map((item) => deleteMyRecord(item.type, item.id)),
      );
      setItems((prev) => prev.filter((item) => !selectedSet.has(`${item.type}:${item.id}`)));
      setSelectedKeys([]);
    } finally {
      setUpdating(false);
    }
  }

  async function handleBatchStatus(nextStatus: ContentStatus) {
    if (selectedKeys.length === 0 || updating) return;
    setUpdating(true);
    try {
      await Promise.all(
        items
          .filter((item) => selectedSet.has(`${item.type}:${item.id}`))
          .map((item) => changeStatus(item.type, item.id, nextStatus)),
      );
      setItems((prev) =>
        prev.map((item) =>
          selectedSet.has(`${item.type}:${item.id}`)
            ? {
                ...item,
                status: nextStatus,
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      setSelectedKeys([]);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索标题 / ID / 一句话用途"
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 sm:w-80"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ContentStatus | 'all')}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
        >
          <option value="all">全部状态</option>
          <option value="Draft">草稿</option>
          <option value="PendingReview">待审核</option>
          <option value="Reject">已拒绝</option>
          <option value="Approved">已通过</option>
          <option value="Listed">已上架</option>
          <option value="Unlisted">已下架</option>
          <option value="Deleted">已删除</option>
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as ContentType | 'all')}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
        >
          <option value="all">全部类型</option>
          <option value="prompt">Prompt</option>
          <option value="skill">Skill</option>
          <option value="mcp">MCP</option>
          <option value="tutorial">教程</option>
        </select>
        <button
          type="button"
          onClick={() => void handleBatchDelete()}
          disabled={selectedCount === 0 || updating}
          className="h-9 rounded-md border border-rose-300 bg-white px-3 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          批量删除
        </button>
        <button
          type="button"
          onClick={() => void handleBatchStatus('Listed')}
          disabled={selectedCount === 0 || updating}
          className="h-9 rounded-md border border-emerald-300 bg-white px-3 text-sm text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          批量上架
        </button>
        <button
          type="button"
          onClick={() => void handleBatchStatus('Unlisted')}
          disabled={selectedCount === 0 || updating}
          className="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          批量下架
        </button>
        <span className="text-xs text-slate-500">已选 {selectedCount} 项</span>
      </div>

      {filteredItems.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">当前筛选下暂无发布记录</p>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => {
        const displayTags = toDisplayTags(item.data.content.tag_ids, 3);
        const key = `${item.type}:${item.id}`;
        const checked = selectedSet.has(key);
        return (
          <li key={key} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.data.content.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="muted">{typeLabelMap[item.type]}</Badge>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const nextChecked = event.target.checked;
                    setSelectedKeys((prev) => {
                      if (nextChecked) return [...prev, key];
                      return prev.filter((value) => value !== key);
                    });
                  }}
                  className="h-4 w-4 accent-sky-600"
                  aria-label={`选择 ${item.data.content.title}`}
                />
              </div>
            </div>
            {displayTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <Badge key={tag.id} tone="muted">
                    {tag.label}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="mt-auto pt-3">
              <div className="mb-2">
                <Badge tone="info">{statusLabelMap[item.status]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">更新：{new Date(item.updated_at).toLocaleDateString('zh-CN')}</span>
                <Link href={editPath(item.type, item.id)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700">
                  继续编辑
                </Link>
              </div>
            </div>
          </li>
        );
        })}
      </ul>
    </div>
  );
}
