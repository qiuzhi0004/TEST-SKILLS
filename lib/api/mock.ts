import mcpsRaw from "@/data/mcps.json";
import promptsRaw from "@/data/prompts.json";
import skillsRaw from "@/data/skills.json";
import taxonomiesRaw from "@/data/taxonomies.json";
import tutorialsRaw from "@/data/tutorials.json";
import { loadAuthoringState } from "@/lib/client/storage_authoring";
import {
  mapContentSummaryDtoToVm,
  mapMcpDetailDtoToVm,
  mapPromptDetailDtoToVm,
  mapSkillDetailDtoToVm,
  mapTutorialDetailDtoToVm,
} from "@/types/adapters";
import type { AuthoringRecord } from "@/types/authoring";
import type {
  AuthorDTO,
  ContentStatus,
  ContentSummaryDTO,
  ContentSummaryVM,
  ContentType,
  ListContentsParams,
  PaginationMeta,
} from "@/types/content";
import type { McpDetailDTO, McpDetailVM } from "@/types/mcp";
import type { PromptDetailDTO, PromptDetailVM } from "@/types/prompt";
import type { SkillDetailDTO, SkillDetailVM } from "@/types/skill";
import type { TutorialDetailDTO, TutorialDetailVM } from "@/types/tutorial";

const prompts = promptsRaw as PromptDetailDTO[];
const mcps = mcpsRaw as McpDetailDTO[];
const skills = skillsRaw as SkillDetailDTO[];
const tutorials = tutorialsRaw as TutorialDetailDTO[];

const taxonomies = taxonomiesRaw as {
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
};

const categoryMap = new Map(
  taxonomies.categories.map((category) => [category.id, category.name]),
);
const tagMap = new Map(taxonomies.tags.map((tag) => [tag.id, tag.name]));

const authorMap: Record<string, AuthorDTO> = {
  "user-001": { id: "user-001", nickname: "Alice", avatar_asset_id: null },
  "user-002": { id: "user-002", nickname: "Bob", avatar_asset_id: null },
  "user-003": { id: "user-003", nickname: "Carol", avatar_asset_id: null },
};

function buildStats(index: number) {
  const views = 120 + index * 17;
  const up = 22 + index * 5;
  const comments = 8 + index * 3;
  return {
    views,
    up,
    comments,
    hot_score: views + up * 5 + comments * 3,
  };
}

function toSummaryDTO(input: {
  id: string;
  type: ContentType;
  status: ContentStatus;
  title: string;
  one_liner: string | null;
  category_id?: string | null;
  category_ids?: string[];
  tag_ids: string[];
  author_id: string;
  cover_asset_id: string | null;
  created_at: string;
  updated_at: string;
}, index: number): ContentSummaryDTO {
  const categoryId = input.category_id ?? input.category_ids?.[0] ?? null;
  const categoryName = categoryId ? categoryMap.get(categoryId) : null;

  return {
    id: input.id,
    type: input.type,
    status: input.status,
    title: input.title,
    one_liner: input.one_liner,
    category: categoryId && categoryName ? { id: categoryId, name: categoryName } : null,
    tags: input.tag_ids.map((id) => ({ id, name: tagMap.get(id) ?? id })),
    author: authorMap[input.author_id] ?? {
      id: input.author_id,
      nickname: input.author_id,
      avatar_asset_id: null,
    },
    cover_asset_id: input.cover_asset_id,
    stats_7d: buildStats(index),
    created_at: input.created_at,
    updated_at: input.updated_at,
    highlight: {
      title: null,
      one_liner: null,
      document: null,
    },
    category_id: categoryId,
    category_ids: input.category_ids,
    tag_ids: input.tag_ids,
  };
}

function allSummaries(): ContentSummaryVM[] {
  const summariesDto: ContentSummaryDTO[] = [
    ...prompts.map((item, index) => toSummaryDTO(item.content, index + 1)),
    ...mcps.map((item, index) => toSummaryDTO(item.content, index + 101)),
    ...skills.map((item, index) => toSummaryDTO(item.content, index + 201)),
    ...tutorials.map((item, index) => toSummaryDTO(item.content, index + 301)),
  ];

  const base = summariesDto.map(mapContentSummaryDtoToVm);
  return mergeWithAuthoringOverlay(base);
}

function getAuthoringOverlayRecords(): AuthoringRecord[] {
  return loadAuthoringState().records;
}

function recordToSummary(record: AuthoringRecord): ContentSummaryVM {
  return {
    id: record.id,
    type: record.type,
    status: record.status,
    title: record.data.content.title,
    one_liner: record.data.content.one_liner,
    category_ids: record.data.content.category_ids,
    tag_ids: record.data.content.tag_ids,
    author: authorMap[record.data.content.author_id] ?? {
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

function mergeWithAuthoringOverlay(base: ContentSummaryVM[]): ContentSummaryVM[] {
  const overlayRecords = getAuthoringOverlayRecords();
  if (overlayRecords.length === 0) {
    return base;
  }

  const merged = new Map<string, ContentSummaryVM>();
  for (const item of base) {
    merged.set(`${item.type}:${item.id}`, item);
  }

  for (const record of overlayRecords) {
    merged.set(`${record.type}:${record.id}`, recordToSummary(record));
  }

  return [...merged.values()].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function listContents(
  params: ListContentsParams = {},
): Promise<{ items: ContentSummaryVM[]; meta: PaginationMeta }> {
  const {
    type = "all",
    q = "",
    tag_ids = [],
    offset = 0,
    limit = 20,
  } = params;

  // NOTE: 当前阶段只做轻量过滤 + 分页；sort/order 参数已保留签名，排序策略后续补齐.
  const normalizedQuery = q.trim().toLowerCase();
  const filtered = allSummaries().filter((item) => {
    if (type !== "all" && item.type !== type) {
      return false;
    }

    if (tag_ids.length > 0) {
      const allSelected = tag_ids.every((tagId) => item.tag_ids.includes(tagId));
      if (!allSelected) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${item.title} ${item.one_liner ?? ""}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);
  const paged = filtered.slice(safeOffset, safeOffset + safeLimit);

  return {
    items: paged,
    meta: {
      offset: safeOffset,
      limit: safeLimit,
      total: filtered.length,
    },
  };
}

export async function getPrompt(id: string): Promise<PromptDetailVM> {
  const overlay = getAuthoringOverlayRecords().find(
    (record) => record.type === "prompt" && record.id === id,
  );
  if (overlay) {
    return overlay.data as PromptDetailVM;
  }

  const found = prompts.find((item) => item.content.id === id);
  if (!found) {
    throw new Error(`Prompt not found: ${id}`);
  }
  return mapPromptDetailDtoToVm(found);
}

export async function getMcp(id: string): Promise<McpDetailVM> {
  const overlay = getAuthoringOverlayRecords().find(
    (record) => record.type === "mcp" && record.id === id,
  );
  if (overlay) {
    return overlay.data as McpDetailVM;
  }

  const found = mcps.find((item) => item.content.id === id);
  if (!found) {
    throw new Error(`MCP not found: ${id}`);
  }
  return mapMcpDetailDtoToVm(found);
}

export async function getSkill(id: string): Promise<SkillDetailVM> {
  const overlay = getAuthoringOverlayRecords().find(
    (record) => record.type === "skill" && record.id === id,
  );
  if (overlay) {
    return overlay.data as SkillDetailVM;
  }

  const found = skills.find((item) => item.content.id === id);
  if (!found) {
    throw new Error(`Skill not found: ${id}`);
  }
  return mapSkillDetailDtoToVm(found);
}

export async function getTutorial(id: string): Promise<TutorialDetailVM> {
  const overlay = getAuthoringOverlayRecords().find(
    (record) => record.type === "tutorial" && record.id === id,
  );
  if (overlay) {
    return overlay.data as TutorialDetailVM;
  }

  const found = tutorials.find((item) => item.content.id === id);
  if (!found) {
    throw new Error(`Tutorial not found: ${id}`);
  }
  return mapTutorialDetailDtoToVm(found);
}
