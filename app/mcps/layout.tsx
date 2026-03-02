import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MCP 资源',
  description: 'MCP 列表与详情页面。',
};

export default function McpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
