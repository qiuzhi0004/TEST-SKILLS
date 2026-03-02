import type {
  ContentBaseDTO,
  ContentBaseVM,
  ContentSummaryDTO,
  ContentSummaryVM,
} from "@/types/content";
import type { CaseDTO, CaseMediaDTO, CaseMediaVM, CaseVM, McpDetailDTO, McpDetailVM } from "@/types/mcp";
import type { PromptDetailDTO, PromptDetailVM } from "@/types/prompt";
import type { SkillDetailDTO, SkillDetailVM } from "@/types/skill";
import type { TutorialDetailDTO, TutorialDetailVM } from "@/types/tutorial";

function normalizeCategoryIds(input: {
  category_ids?: string[];
  category_id?: string | null;
  category?: { id: string } | null;
}): string[] {
  if (input.category_ids && input.category_ids.length > 0) {
    return [...new Set(input.category_ids)];
  }
  if (input.category_id) {
    return [input.category_id];
  }
  if (input.category?.id) {
    return [input.category.id];
  }
  return [];
}

function stringifyAsBlock(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

function mapCaseMedia(dto: CaseMediaDTO): CaseMediaVM {
  return {
    id: dto.id,
    asset_id: dto.asset_id,
    external_url: dto.external_url ?? null,
    media_type: dto.media_type ?? "image",
    sort_order: dto.sort_order,
  };
}

function mapCase(dto: CaseDTO): CaseVM {
  return {
    id: dto.id,
    title: dto.title,
    user_input: dto.input_text ?? "",
    execution_process: dto.process_text ?? "",
    agent_output: dto.output_text ?? "",
    media: dto.media.map(mapCaseMedia),
    sort_order: dto.sort_order,
  };
}

export function mapContentBaseDtoToVm(dto: ContentBaseDTO): ContentBaseVM {
  return {
    id: dto.id,
    type: dto.type,
    status: dto.status,
    title: dto.title,
    one_liner: dto.one_liner,
    category_ids: normalizeCategoryIds(dto),
    tag_ids: dto.tag_ids ?? [],
    author_id: dto.author_id,
    cover_asset_id: dto.cover_asset_id,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  };
}

export function mapContentSummaryDtoToVm(dto: ContentSummaryDTO): ContentSummaryVM {
  return {
    id: dto.id,
    type: dto.type,
    status: dto.status,
    title: dto.title,
    one_liner: dto.one_liner,
    category_ids: normalizeCategoryIds(dto),
    tag_ids: dto.tag_ids ?? dto.tags.map((tag) => tag.id),
    author: dto.author,
    cover_asset_id: dto.cover_asset_id,
    stats_7d: dto.stats_7d,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
    highlight: dto.highlight,
  };
}

export function mapPromptDetailDtoToVm(dto: PromptDetailDTO): PromptDetailVM {
  return {
    content: mapContentBaseDtoToVm(dto.content) as PromptDetailVM["content"],
    model_name: dto.model_name,
    language: dto.language,
    prompt_text: dto.prompt_text,
    showcases: dto.showcases.map((showcase) => ({
      id: showcase.id,
      asset_id: showcase.asset_id,
      media_type: showcase.media_type,
      caption: showcase.caption,
      sort_order: showcase.sort_order,
    })),
  };
}

export function mapMcpDetailDtoToVm(dto: McpDetailDTO): McpDetailVM {
  // TODO(decision-4): 后端契约当前只给 object 字段，未来应直接提供三段原样文本字段.
  const howToUse = {
    json_config_text:
      dto.howto.json_config_text ?? stringifyAsBlock(dto.howto.standard_config),
    common_clients_json:
      dto.howto.common_clients_json ?? stringifyAsBlock(dto.howto.clients),
    runtime_modes_json:
      dto.howto.runtime_modes_json ?? stringifyAsBlock(dto.howto.runtime),
  };

  return {
    content: mapContentBaseDtoToVm(dto.content) as McpDetailVM["content"],
    source: dto.source,
    provider_name: dto.provider,
    repo_url: dto.repo_url,
    how_to_use: howToUse,
    cases: dto.cases.map(mapCase),
  };
}

export function mapSkillDetailDtoToVm(dto: SkillDetailDTO): SkillDetailVM {
  // TODO(decision-5): install_commands/usage_doc 应由后端补入正式 API 契约.
  // NOTE: zip_asset_id 在前端 VM 侧视为必有字段；mock 中保证有值.
  return {
    content: mapContentBaseDtoToVm(dto.content) as SkillDetailVM["content"],
    source: dto.source,
    provider_name: dto.provider,
    repo_url: dto.repo_url,
    zip_asset_id: dto.zip_asset_id ?? "",
    install_commands: dto.install_commands ?? [],
    usage_doc: dto.usage_doc ?? null,
    repo_snapshot: dto.repo_snapshot,
    cases: dto.cases.map(mapCase),
  };
}

export function mapTutorialDetailDtoToVm(dto: TutorialDetailDTO): TutorialDetailVM {
  return {
    content: mapContentBaseDtoToVm(dto.content) as TutorialDetailVM["content"],
    body_markdown: dto.body_markdown,
    media: dto.media.map((item) => ({
      id: item.id,
      asset_id: item.asset_id,
      media_type: item.media_type,
      sort_order: item.sort_order,
    })),
  };
}
