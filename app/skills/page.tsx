'use client';

import { ResourceListPage } from '@/components/resource/ResourceListPage';

const CATEGORY_OPTIONS = [
  '研究',
  '编程',
  '写作',
  '数据与分析',
  '设计',
  '规划',
  '沟通',
  '生产力',
  '开发运维',
  '人工智能与机器学习',
  '安全',
  '商业',
];

export default function SkillsPage() {
  return <ResourceListPage config={{ type: 'skill', categoryOptions: CATEGORY_OPTIONS }} />;
}
