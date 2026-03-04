interface DisplayTag {
  id: string;
  label: string;
}

const TAG_LABEL_MAP: Record<string, string> = {
  'tag-agent': '智能体',
  'tag-beginner': '入门',
  'tag-frontend': '前端',
  'tag-open-source': '开源',
  'tag-productivity': '效率',
  'tag-workflow': '工作流',
  prompt_text: '文本',
  prompt_image: '图像',
  prompt_video: '视频',
  prompt_plan: '计划',
  prompt_excel: 'Excel',
  prompt_timer: '计时',
  prompt_notion: 'Notion',
  prompt_report: '日报',
  prompt_market: '市场',
  prompt_product: '产品',
  prompt_automotive: '汽车',
  prompt_portrait: '肖像',
  prompt_sports: '体育',
  prompt_skincare: '护肤',
  prompt_wildlife: '野生动物',
  prompt_cinematic: '电影感',
  post_text: '文字',
  post_image: '图像',
  post_video: '视频',
  post_audio: '音频',
  post_digital_human: '数字人',
  post_browser: '浏览器',
  post_coding: '编程',
  post_agent: 'Agent',
  post_workflow: '自动工作流',
  post_knowledge_base: '知识库',
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
