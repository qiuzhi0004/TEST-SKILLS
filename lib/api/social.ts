import { loadSocialState, saveSocialState } from '@/lib/client/storage';
import type { Comment, SocialTarget, TargetType, VoteValue } from '@/types/social';
import { makeTargetKey } from '@/types/social';

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getVote(target: SocialTarget): Promise<VoteValue> {
  const state = loadSocialState();
  return state.votes[makeTargetKey(target)] ?? null;
}

export async function getUpvoteCount(target: SocialTarget): Promise<number> {
  const vote = await getVote(target);
  return vote === 'up' ? 1 : 0;
}

export async function toggleVote(target: SocialTarget, value: 'up' | 'down'): Promise<VoteValue> {
  const key = makeTargetKey(target);
  const state = loadSocialState();
  const current = state.votes[key] ?? null;

  // NOTE: 依据 /docs/状态图与业务规则.md，投票互斥；同票再次点击即取消。
  state.votes[key] = current === value ? null : value;
  saveSocialState(state);

  return state.votes[key];
}

export async function isFavorite(target: SocialTarget): Promise<boolean> {
  const state = loadSocialState();
  return Boolean(state.favorites[makeTargetKey(target)]);
}

export async function getFavoriteCount(target: SocialTarget): Promise<number> {
  const favorited = await isFavorite(target);
  return favorited ? 1 : 0;
}

export async function toggleFavorite(target: SocialTarget): Promise<boolean> {
  const key = makeTargetKey(target);
  const state = loadSocialState();
  const next = !Boolean(state.favorites[key]);

  if (next) {
    state.favorites[key] = true;
  } else {
    delete state.favorites[key];
  }

  saveSocialState(state);
  return next;
}

export async function listComments(target: SocialTarget): Promise<Comment[]> {
  const state = loadSocialState();
  const key = makeTargetKey(target);
  return state.comments[key] ?? [];
}

export async function createComment(target: SocialTarget, content: string): Promise<Comment> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Comment content is required');
  }

  const state = loadSocialState();
  const key = makeTargetKey(target);
  const next: Comment = {
    id: createId(),
    target_type: target.target_type,
    target_id: target.target_id,
    content: trimmed,
    created_at: nowIso(),
  };

  state.comments[key] = [next, ...(state.comments[key] ?? [])];
  saveSocialState(state);
  return next;
}

export async function deleteComment(target: SocialTarget, comment_id: string): Promise<void> {
  const state = loadSocialState();
  const key = makeTargetKey(target);

  // NOTE: 评论“作者身份/权限”在本地 mock 阶段不可判定；当前实现允许本地删除。
  // TODO: 若后续文档明确“仅作者/资源作者/管理员可删”，需在服务端接口层落实权限校验。
  state.comments[key] = (state.comments[key] ?? []).filter((item) => item.id !== comment_id);
  saveSocialState(state);
}

export async function listFavoriteTargets(): Promise<SocialTarget[]> {
  const state = loadSocialState();

  return Object.keys(state.favorites)
    .filter((key) => Boolean(state.favorites[key]))
    .map((key) => {
      const [type, ...rest] = key.split(':');
      return {
        target_type: type as TargetType,
        target_id: rest.join(':'),
      };
    })
    .filter((item) => item.target_id.length > 0);
}
