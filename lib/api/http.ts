import type {
  ContentSummaryDTO,
  ContentSummaryVM,
  ListContentsParams,
  PaginationMeta,
} from "@/types/content";
import {
  mapContentSummaryDtoToVm,
  mapMcpDetailDtoToVm,
  mapPromptDetailDtoToVm,
  mapSkillDetailDtoToVm,
  mapTutorialDetailDtoToVm,
} from "@/types/adapters";
import type { McpDetailDTO, McpDetailVM } from "@/types/mcp";
import type { PromptDetailDTO, PromptDetailVM } from "@/types/prompt";
import type { SkillDetailDTO, SkillDetailVM } from "@/types/skill";
import type { TutorialDetailDTO, TutorialDetailVM } from "@/types/tutorial";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");

interface HttpErrorPayload {
  detail?: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as HttpErrorPayload;
      if (payload?.detail) {
        message = payload.detail;
      }
    } catch {
      // ignore JSON decode errors and preserve status text
    }
    throw new Error(`HTTP API error: ${message}`);
  }

  return (await response.json()) as T;
}

function buildSearch(params: ListContentsParams): string {
  const search = new URLSearchParams();

  if (params.type) {
    search.set("type", params.type);
  }
  if (params.q) {
    search.set("q", params.q);
  }
  for (const tagId of params.tag_ids ?? []) {
    search.append("tag_ids", tagId);
  }
  if (params.offset !== undefined) {
    search.set("offset", String(params.offset));
  }
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

interface ListContentsResponseDTO {
  items: ContentSummaryDTO[];
  meta: PaginationMeta;
}

export async function listContents(
  params: ListContentsParams,
): Promise<{ items: ContentSummaryVM[]; meta: PaginationMeta }> {
  const response = await apiFetch<ListContentsResponseDTO>(
    `/contents${buildSearch(params)}`,
  );
  return {
    items: response.items.map(mapContentSummaryDtoToVm),
    meta: response.meta,
  };
}

export async function getPrompt(id: string): Promise<PromptDetailVM> {
  const dto = await apiFetch<PromptDetailDTO>(`/prompts/${id}`);
  return mapPromptDetailDtoToVm(dto);
}

export async function getMcp(id: string): Promise<McpDetailVM> {
  const dto = await apiFetch<McpDetailDTO>(`/mcps/${id}`);
  return mapMcpDetailDtoToVm(dto);
}

export async function getSkill(id: string): Promise<SkillDetailVM> {
  const dto = await apiFetch<SkillDetailDTO>(`/skills/${id}`);
  return mapSkillDetailDtoToVm(dto);
}

export async function getTutorial(id: string): Promise<TutorialDetailVM> {
  const dto = await apiFetch<TutorialDetailDTO>(`/tutorials/${id}`);
  return mapTutorialDetailDtoToVm(dto);
}
