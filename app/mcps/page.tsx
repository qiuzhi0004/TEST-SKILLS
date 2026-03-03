'use client';

import { ResourceListPage } from '@/components/resource/ResourceListPage';

const CATEGORY_OPTIONS = ['网页搜索', '浏览器自动化', '学术研究', '金融', '推理', '开发工具'];

export default function McpsPage() {
  return <ResourceListPage config={{ type: 'mcp', categoryOptions: CATEGORY_OPTIONS }} />;
}
