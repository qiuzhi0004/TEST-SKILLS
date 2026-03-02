export type TargetType = 'prompt' | 'mcp' | 'skill' | 'tutorial';
export type VoteValue = 'up' | 'down' | null;

export interface SocialTarget {
  target_type: TargetType;
  target_id: string;
}

export interface Comment {
  id: string;
  target_type: TargetType;
  target_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface SocialState {
  favorites: Record<string, boolean>;
  votes: Record<string, VoteValue>;
  comments: Record<string, Comment[]>;
}

export function makeTargetKey(target: SocialTarget): string {
  return `${target.target_type}:${target.target_id}`;
}
