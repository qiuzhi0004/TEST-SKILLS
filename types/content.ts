export type ContentType = "prompt" | "mcp" | "skill" | "tutorial";

export type ContentStatus =
  | "Draft"
  | "PendingReview"
  | "Reject"
  | "Approved"
  | "Listed"
  | "Unlisted"
  | "Deleted";

export interface NamedRefDTO {
  id: string;
  name: string;
}

export interface AuthorDTO {
  id: string;
  nickname: string;
  avatar_asset_id: string | null;
}

export interface Stats7dDTO {
  views: number;
  up: number;
  comments: number;
  hot_score: number;
}

export interface HighlightDTO {
  title: string | null;
  one_liner: string | null;
  document: string | null;
}

export interface ContentSummaryDTO {
  id: string;
  type: ContentType;
  status: ContentStatus;
  title: string;
  one_liner: string | null;
  category?: NamedRefDTO | null;
  tags: NamedRefDTO[];
  author: AuthorDTO;
  cover_asset_id: string | null;
  stats_7d: Stats7dDTO;
  created_at: string;
  updated_at: string;
  highlight?: HighlightDTO;
  // NOTE(decision-3): API 契约主要是 category/category_id，前端在适配层统一为 category_ids[].
  category_ids?: string[];
  category_id?: string | null;
  tag_ids?: string[];
}

export interface ContentBaseDTO {
  id: string;
  type: ContentType;
  status: ContentStatus;
  title: string;
  one_liner: string | null;
  category_id?: string | null;
  tag_ids: string[];
  author_id: string;
  cover_asset_id: string | null;
  created_at: string;
  updated_at: string;
  // NOTE(decision-3): 非 API 契约标准字段，预留多类目扩展输入.
  category_ids?: string[];
}

export interface ContentSummaryVM {
  id: string;
  type: ContentType;
  status: ContentStatus;
  title: string;
  one_liner: string | null;
  category_ids: string[];
  tag_ids: string[];
  author: AuthorDTO;
  cover_asset_id: string | null;
  stats_7d: Stats7dDTO;
  created_at: string;
  updated_at: string;
  highlight?: HighlightDTO;
}

export interface ContentBaseVM {
  id: string;
  type: ContentType;
  status: ContentStatus;
  title: string;
  one_liner: string | null;
  category_ids: string[];
  tag_ids: string[];
  author_id: string;
  cover_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListContentsParams {
  type?: ContentType | "all";
  q?: string;
  tag_ids?: string[];
  sort?: string;
  order?: string;
  offset?: number;
  limit?: number;
}

export interface PaginationMeta {
  offset: number;
  limit: number;
  total: number;
}
