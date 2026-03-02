import type {
  ContentBaseDTO,
  ContentBaseVM,
  ContentType,
} from "@/types/content";

export type TutorialMediaType = "image" | "video";

export interface TutorialMediaDTO {
  id: string;
  asset_id: string;
  media_type: TutorialMediaType;
  sort_order: number;
}

export interface TutorialDetailDTO {
  content: ContentBaseDTO & { type: Extract<ContentType, "tutorial"> };
  body_markdown: string;
  media: TutorialMediaDTO[];
}

export interface TutorialMediaVM {
  id: string;
  asset_id: string;
  media_type: TutorialMediaType;
  sort_order: number;
}

export interface TutorialDetailVM {
  content: ContentBaseVM & { type: Extract<ContentType, "tutorial"> };
  body_markdown: string;
  media: TutorialMediaVM[];
}
