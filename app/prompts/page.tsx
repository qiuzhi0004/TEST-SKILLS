'use client';

import { ResourceListPage } from '@/components/resource/ResourceListPage';
import type { ContentSummaryVM } from '@/types/content';

const CATEGORY_OPTIONS = ['文本Prompt', '图像Prompt', '视频Prompt'];
const TOOL_OPTIONS = [
  'Nano Banana Pro',
  'Seedance 2.0',
  'GPT Image 1.5',
  'Seedream 4.5',
  'Gemini 3',
];

function promptCategoryMatcher(item: ContentSummaryVM, category: string): boolean {
  const haystack = `${item.title} ${item.one_liner ?? ''} ${item.tag_ids.join(' ')}`.toLowerCase();
  if (category === '视频Prompt')
    return haystack.includes('prompt_video') || haystack.includes('video') || haystack.includes('sora');
  if (category === '图像Prompt' || category === '图片Prompt')
    return haystack.includes('prompt_image') || haystack.includes('image');
  return haystack.includes('prompt_text') && !haystack.includes('prompt_image') && !haystack.includes('prompt_video');
}

function promptToolMatcher(item: ContentSummaryVM, tool: string): boolean {
  const haystack = `${item.title} ${item.one_liner ?? ''} ${item.tag_ids.join(' ')}`.toLowerCase();
  return haystack.includes(tool.toLowerCase());
}

export default function PromptsPage() {
  return (
    <ResourceListPage
      config={{
        type: 'prompt',
        categoryOptions: CATEGORY_OPTIONS,
        categoryLabel: '内容形态',
        showSidebarCategoryFilter: true,
        showCategoryCounts: true,
        defaultMediaTab: '',
        toolOptions: TOOL_OPTIONS,
        toolLabel: '适用平台/模型',
        matchCategory: promptCategoryMatcher,
        matchTool: promptToolMatcher,
      }}
    />
  );
}
