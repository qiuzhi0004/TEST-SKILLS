'use client';

import { ResourceListPage } from '@/components/resource/ResourceListPage';

export default function TutorialsPage() {
  return <ResourceListPage config={{ type: 'tutorial', showFilters: false }} />;
}
