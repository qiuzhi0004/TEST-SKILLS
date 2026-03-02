import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prompt 资源',
  description: 'Prompt 列表与详情页面。',
};

export default function PromptsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
