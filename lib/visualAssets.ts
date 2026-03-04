import type { ContentType } from '@/types/content';

const UNSPLASH_IMAGES = [
  'unsplash_5Qm7KlP8UFM.png',
  'unsplash_5g4yia90QA4.png',
  'unsplash_8YMbLoUWO_A.png',
  'unsplash_Ce3wzkvxNHk.png',
  'unsplash_J3NRFu2QWaw.png',
  'unsplash_JDlLaFMVxBA.png',
  'unsplash_L8LwAkEJsDM.png',
  'unsplash_OkO9BDH-IEc.png',
  'unsplash_RIrPihVB9R4.png',
  'unsplash_Rdu4hhYP-0s.png',
  'unsplash_UbDdynMmcX0.png',
  'unsplash_VTV9mpLLGks.png',
  'unsplash_XDI4V4lcs5A.png',
  'unsplash_bKG2oQvBYVU.png',
  'unsplash_c-BbocC_HJ4.png',
  'unsplash_dFQFgz1x2No.png',
  'unsplash_dNrySrwojYU.png',
  'unsplash_dxp8NcWrqGM.png',
  'unsplash_ePhpXlJ6H2g.png',
  'unsplash_eyOM6BAaCNE.png',
  'unsplash_iJSx-L_8_Jo.png',
  'unsplash_mAuGYtp2vh8.png',
  'unsplash_ntPnfs7GKyc.png',
  'unsplash_rwcONvax9qE.png',
  'unsplash_thc9qSpsuFI.png',
  'unsplash_uwu9UooMVsE.png',
  'unsplash_wNNdhPycLkU.png',
  'unsplash_y05PlbAxOKQ.png',
  'unsplash_zyaSij3LMzo.png',
] as const;

const TYPE_OFFSET: Record<ContentType, number> = {
  prompt: 3,
  mcp: 9,
  skill: 15,
  tutorial: 21,
};

function simpleHash(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function toAssetSrc(assetId?: string | null): string | null {
  if (!assetId) return null;
  if (assetId.startsWith('data:')) return assetId;
  if (assetId.startsWith('/')) return assetId;
  if (assetId.startsWith('http://') || assetId.startsWith('https://')) return assetId;
  if (assetId.startsWith('data/images/')) return `/${assetId.replace(/^data\//, '')}`;
  if (assetId.startsWith('data/videos/')) return `/${assetId.replace(/^data\//, '')}`;
  if (assetId.startsWith('images/')) return `/${assetId}`;
  if (assetId.startsWith('videos/')) return `/${assetId}`;
  if (assetId.includes('/')) return `/${assetId}`;
  return `/images/${assetId}`;
}

export function pickUnsplash(seed: string, type?: ContentType): string {
  const base = simpleHash(seed);
  const offset = type ? TYPE_OFFSET[type] : 0;
  const index = (base + offset) % UNSPLASH_IMAGES.length;
  return `/images/${UNSPLASH_IMAGES[index]}`;
}

export function resolveCoverSrc(options: {
  assetId?: string | null;
  seed: string;
  type?: ContentType;
}): string {
  const exact = toAssetSrc(options.assetId);
  if (exact) return exact;
  return pickUnsplash(options.seed, options.type);
}

