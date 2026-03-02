import type {
  ContentBaseDTO,
  ContentBaseVM,
  ContentType,
} from "@/types/content";

export type PromptMediaType = "image" | "video";

export interface PromptShowcaseDTO {
  id: string;
  asset_id: string;
  media_type: PromptMediaType;
  caption: string | null;
  sort_order: number;
}

export interface PromptDetailDTO {
  content: ContentBaseDTO & { type: Extract<ContentType, "prompt"> };
  model_name: string;
  language: string;
  prompt_text: string;
  showcases: PromptShowcaseDTO[];
}

export interface PromptShowcaseVM {
  id: string;
  asset_id: string;
  media_type: PromptMediaType;
  caption: string | null;
  sort_order: number;
}

export interface PromptDetailVM {
  content: ContentBaseVM & { type: Extract<ContentType, "prompt"> };
  model_name: string;
  language: string;
  prompt_text: string;
  showcases: PromptShowcaseVM[];
}
