import * as httpApi from "@/lib/api/http";
import * as mockApi from "@/lib/api/mock";
import type {
  ContentSummaryVM,
  ListContentsParams,
  PaginationMeta,
} from "@/types/content";
import type { McpDetailVM } from "@/types/mcp";
import type { PromptDetailVM } from "@/types/prompt";
import type { SkillDetailVM } from "@/types/skill";
import type { TutorialDetailVM } from "@/types/tutorial";

type ApiSurface = {
  listContents: (
    params: ListContentsParams,
  ) => Promise<{ items: ContentSummaryVM[]; meta: PaginationMeta }>;
  getPrompt: (id: string) => Promise<PromptDetailVM>;
  getMcp: (id: string) => Promise<McpDetailVM>;
  getSkill: (id: string) => Promise<SkillDetailVM>;
  getTutorial: (id: string) => Promise<TutorialDetailVM>;
};

const useMock = process.env.NEXT_PUBLIC_API_MODE !== "http";
const activeApi: ApiSurface = useMock ? mockApi : httpApi;

export const listContents = activeApi.listContents;
export const getPrompt = activeApi.getPrompt;
export const getMcp = activeApi.getMcp;
export const getSkill = activeApi.getSkill;
export const getTutorial = activeApi.getTutorial;

export type { ContentSummaryVM, ListContentsParams, PaginationMeta };
export type { McpDetailVM } from "@/types/mcp";
export type { PromptDetailVM } from "@/types/prompt";
export type { SkillDetailVM } from "@/types/skill";
export type { TutorialDetailVM } from "@/types/tutorial";
