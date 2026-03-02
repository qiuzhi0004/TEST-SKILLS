import type { ContentStatus, ContentType } from '@/types/content';
import type { McpDetailVM } from '@/types/mcp';
import type { PromptDetailVM } from '@/types/prompt';
import type { SkillDetailVM } from '@/types/skill';
import type { TutorialDetailVM } from '@/types/tutorial';

export type DraftStatus = 'Draft' | 'PendingReview' | 'Listed' | 'Reject' | 'Approved' | 'Unlisted';

export type AuthoringDataMap = {
  prompt: PromptDetailVM;
  mcp: McpDetailVM;
  skill: SkillDetailVM;
  tutorial: TutorialDetailVM;
};

export type AuthoringData = AuthoringDataMap[keyof AuthoringDataMap];

export interface AuthoringRecord<T extends ContentType = ContentType> {
  id: string;
  type: T;
  status: ContentStatus;
  data: AuthoringDataMap[T];
  created_at: string;
  updated_at: string;
  version?: number;
}

export interface AuthoringState {
  records: AuthoringRecord[];
}
