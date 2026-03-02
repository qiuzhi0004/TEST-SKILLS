import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Skill 资源',
  description: 'Skill 列表与详情页面。',
};

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
