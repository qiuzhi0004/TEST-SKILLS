interface DisplayTag {
  id: string;
  label: string;
}

const TAG_LABEL_MAP: Record<string, string> = {
  'tag-agent': 'Agent',
  'tag-beginner': '入门',
  'tag-frontend': '前端',
  'tag-open-source': '开源',
  'tag-productivity': '效率',
  'tag-workflow': '工作流',
  prompt_text: '文本',
  prompt_image: '图像',
  prompt_video: '视频',
};

function isHiddenTag(tagId: string): boolean {
  return (
    tagId === 'github' ||
    tagId.startsWith('mcp_') ||
    tagId.startsWith('skill_') ||
    tagId.startsWith('source_') ||
    tagId.startsWith('repo_') ||
    tagId.startsWith('storage_')
  );
}

export function toDisplayTags(tagIds: string[], max = 3): DisplayTag[] {
  const normal: DisplayTag[] = [];
  const promptLike: DisplayTag[] = [];
  const seen = new Set<string>();

  for (const tagId of tagIds) {
    if (seen.has(tagId)) continue;
    seen.add(tagId);

    if (isHiddenTag(tagId)) continue;

    const label = TAG_LABEL_MAP[tagId];
    if (!label) continue;

    const target = tagId.startsWith('prompt_') ? promptLike : normal;
    target.push({ id: tagId, label });
  }

  return [...normal, ...promptLike].slice(0, max);
}

