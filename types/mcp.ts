import type {
  ContentBaseDTO,
  ContentBaseVM,
  ContentType,
} from "@/types/content";

export type SourceType = "official" | "user";
export type CaseMediaType = "image" | "video";

export interface CaseMediaDTO {
  id: string;
  asset_id: string | null;
  external_url?: string | null;
  media_type?: CaseMediaType;
  sort_order: number;
}

export interface CaseDTO {
  id: string;
  title: string;
  input_text: string | null;
  process_text: string | null;
  output_text: string | null;
  media: CaseMediaDTO[];
  sort_order: number;
}

export interface McpDetailDTO {
  content: ContentBaseDTO & { type: Extract<ContentType, "mcp"> };
  source: SourceType;
  provider: string;
  repo_url: string;
  howto: {
    standard_config?: Record<string, unknown>;
    clients?: Record<string, unknown>;
    runtime?: Record<string, unknown>;
    // NOTE(decision-4): 字段文档要求三段原样文本，这里扩展可选字段承载该口径.
    json_config_text?: string;
    common_clients_json?: string;
    runtime_modes_json?: string;
  };
  cases: CaseDTO[];
}

export interface CaseMediaVM {
  id: string;
  asset_id: string | null;
  external_url: string | null;
  media_type: CaseMediaType;
  sort_order: number;
}

export interface CaseVM {
  id: string;
  title: string;
  user_input: string;
  execution_process: string;
  agent_output: string;
  media: CaseMediaVM[];
  sort_order: number;
}

export interface McpDetailVM {
  content: ContentBaseVM & { type: Extract<ContentType, "mcp"> };
  source: SourceType;
  provider_name: string;
  repo_url: string;
  how_to_use: {
    json_config_text: string;
    common_clients_json: string;
    runtime_modes_json: string;
  };
  cases: CaseVM[];
}
