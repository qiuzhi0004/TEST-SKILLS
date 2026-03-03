'use client';

import { ResourceListPage } from '@/components/resource/ResourceListPage';
import type { ContentSummaryVM } from '@/types/content';

const CATEGORY_OPTIONS = ['文本', '图像', '视频'];
const TOOL_OPTIONS = [
  'Nano Banana Pro',
  'Seedance 2.0',
  'GPT Image 1.5',
  'Seedream 4.5',
  'Gemini 3',
];

function promptCategoryMatcher(item: ContentSummaryVM, category: string): boolean {
  const haystack = `${item.title} ${item.one_liner ?? ''} ${item.tag_ids.join(' ')}`.toLowerCase();
  if (category === '视频') return haystack.includes('video') || haystack.includes('sora') || haystack.includes('prompt_video');
  if (category === '图像') return haystack.includes('image') || haystack.includes('prompt_image');
  return !haystack.includes('video') && !haystack.includes('prompt_video');
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
        toolOptions: TOOL_OPTIONS,
        matchCategory: promptCategoryMatcher,
        matchTool: promptToolMatcher,
      }}
    />
  );
}
