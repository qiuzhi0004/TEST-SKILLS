import type { Metadata } from 'next';

interface BuildMetadataInput {
  title: string;
  description: string;
  path?: string;
}

const SITE_NAME = 'AI 资源站';
const BASE = 'http://localhost:3000';

export function buildMetadata({ title, description, path = '/' }: BuildMetadataInput): Metadata {
  const url = `${BASE}${path}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      url,
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export const siteMeta = {
  siteName: SITE_NAME,
  base: BASE,
};
