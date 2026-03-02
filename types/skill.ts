import type {
  ContentBaseDTO,
  ContentBaseVM,
  ContentType,
} from "@/types/content";
import type { CaseDTO, CaseVM, SourceType } from "@/types/mcp";

export interface SkillDetailDTO {
  content: ContentBaseDTO & { type: Extract<ContentType, "skill"> };
  source: SourceType;
  provider: string;
  repo_url: string | null;
  zip_asset_id: string | null;
  repo_snapshot: {
    stars: number | null;
    forks: number | null;
    updated_at: string | null;
    synced_at: string | null;
  };
  cases: CaseDTO[];
  // NOTE(decision-5): API 契约未定义，前端先扩展为可选字段并在适配层补齐.
  install_commands?: string[];
  usage_doc?: string | null;
}

export interface SkillDetailVM {
  content: ContentBaseVM & { type: Extract<ContentType, "skill"> };
  source: SourceType;
  provider_name: string;
  repo_url: string | null;
  zip_asset_id: string;
  install_commands: string[];
  usage_doc: string | null;
  repo_snapshot: {
    stars: number | null;
    forks: number | null;
    updated_at: string | null;
    synced_at: string | null;
  };
  cases: CaseVM[];
}
