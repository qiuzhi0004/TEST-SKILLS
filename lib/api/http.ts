import type {
  ContentSummaryVM,
  ListContentsParams,
  PaginationMeta,
} from "@/types/content";
import type { McpDetailVM } from "@/types/mcp";
import type { PromptDetailVM } from "@/types/prompt";
import type { SkillDetailVM } from "@/types/skill";
import type { TutorialDetailVM } from "@/types/tutorial";

const notImplemented = (fn: string) =>
  new Error(`${fn} is not implemented in http.ts yet`);

export async function listContents(
  _params: ListContentsParams,
): Promise<{ items: ContentSummaryVM[]; meta: PaginationMeta }> {
  throw notImplemented("listContents");
}

export async function getPrompt(_id: string): Promise<PromptDetailVM> {
  throw notImplemented("getPrompt");
}

export async function getMcp(_id: string): Promise<McpDetailVM> {
  throw notImplemented("getMcp");
}

export async function getSkill(_id: string): Promise<SkillDetailVM> {
  throw notImplemented("getSkill");
}

export async function getTutorial(_id: string): Promise<TutorialDetailVM> {
  throw notImplemented("getTutorial");
}
