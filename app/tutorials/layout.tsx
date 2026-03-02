import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '教程资源',
  description: '教程列表与详情页面。',
};

export default function TutorialsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
