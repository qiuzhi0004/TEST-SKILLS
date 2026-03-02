import type { Metadata } from 'next';
import { getMcp } from '@/lib/api';
import { buildMetadata } from '@/components/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const detail = await getMcp(id);
    return buildMetadata({
      title: `${detail.content.title} | MCP`,
      description: detail.content.one_liner ?? 'MCP 详情页',
      path: `/mcps/${id}`,
    });
  } catch {
    return buildMetadata({ title: `MCP ${id}`, description: 'MCP 详情页', path: `/mcps/${id}` });
  }
}

export default function McpDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
