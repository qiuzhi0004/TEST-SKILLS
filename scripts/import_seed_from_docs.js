/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const DOC_PATH = path.join(ROOT, 'docs', '数据源信息.md');
const DATA_DIR = path.join(ROOT, 'data');

const MCP_PATH = path.join(DATA_DIR, 'mcps.json');
const SKILL_PATH = path.join(DATA_DIR, 'skills.json');
const PROMPT_PATH = path.join(DATA_DIR, 'prompts.json');
const TAXONOMY_PATH = path.join(DATA_DIR, 'taxonomies.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function parseReferences(markdown) {
  const refs = new Map();
  const refRegex = /^\[(\d+)\]:\s+(\S+)(?:\s+"[^"]*")?\s*$/gm;
  for (const match of markdown.matchAll(refRegex)) {
    const [, id, url] = match;
    refs.set(id, canonicalizeUrl(url));
  }
  return refs;
}

function canonicalizeUrl(raw) {
  try {
    const u = new URL(raw);
    for (const key of [...u.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_')) {
        u.searchParams.delete(key);
      }
    }
    return u.toString();
  } catch {
    return raw;
  }
}

function parseStars(starsTextRaw) {
  const starsText = starsTextRaw.trim().toLowerCase().replace(/,/g, '');
  const kMatch = starsText.match(/^([0-9]+(?:\.[0-9]+)?)k$/);
  if (kMatch) {
    return Math.round(Number(kMatch[1]) * 1000);
  }

  const numeric = Number(starsText);
  if (Number.isFinite(numeric)) {
    return Math.round(numeric);
  }
  return 0;
}

function extractRepoAndNote(repoWithNoteRaw) {
  const repoWithNote = repoWithNoteRaw.trim();
  const match = repoWithNote.match(/^([^（(]+?)(?:\s*[（(]([^）)]+)[）)])?$/);
  if (!match) {
    return { repo: repoWithNote, note: null };
  }
  return {
    repo: match[1].trim(),
    note: match[2] ? match[2].trim() : null,
  };
}

function safeSlug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function makeId(type, repo) {
  return `${type}_${safeSlug(repo.replace('/', '_'))}`;
}

function parseSeedEntries(markdown, refs) {
  const entries = [];
  const lines = markdown.split('\n');

  let currentType = null;
  let promptTag = null;

  // 例：1. **owner/repo（说明）** — **79.8k⭐**｜描述。 ([GitHub][1])
  const itemRegex = /^\d+\.\s+\*\*(.+?)\*\*\s+—\s+\*\*([0-9][0-9.,]*k?)⭐\*\*｜(.+?)\s*\(\[GitHub\]\[(\d+)\]\)\s*$/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (/^##\s+MCP/.test(line)) {
      currentType = 'mcp';
      promptTag = null;
      continue;
    }
    if (/^##\s+Skill/.test(line)) {
      currentType = 'skill';
      promptTag = null;
      continue;
    }
    if (/^##\s+Prompt/.test(line)) {
      currentType = 'prompt';
      promptTag = null;
      continue;
    }

    if (/^###\s+图片 Prompt/.test(line)) {
      currentType = 'prompt';
      promptTag = 'prompt_image';
      continue;
    }
    if (/^###\s+视频 Prompt/.test(line)) {
      currentType = 'prompt';
      promptTag = 'prompt_video';
      continue;
    }
    if (/^###\s+纯文本 Prompt/.test(line)) {
      currentType = 'prompt';
      promptTag = 'prompt_text';
      continue;
    }

    const m = line.match(itemRegex);
    if (!m || !currentType) {
      continue;
    }

    const [, repoWithNote, starsTextRaw, descRaw, refId] = m;
    const { repo, note } = extractRepoAndNote(repoWithNote);
    const url = refs.get(refId) || '';
    const stars = parseStars(starsTextRaw);
    const owner = repo.includes('/') ? repo.split('/')[0] : 'seed';

    entries.push({
      type: currentType,
      repo,
      owner,
      note,
      url,
      stars,
      starsText: starsTextRaw.trim(),
      desc: descRaw.trim().replace(/。$/, ''),
      promptTag,
    });
  }

  return entries;
}

function nowIso() {
  return new Date().toISOString();
}

function buildPromptSeed(entry, now) {
  const tagIds = ['github'];
  if (entry.promptTag) tagIds.push(entry.promptTag);

  return {
    content: {
      id: makeId('prompt', entry.repo),
      type: 'prompt',
      status: 'Listed',
      title: entry.repo,
      one_liner: entry.desc,
      category_id: null,
      category_ids: [],
      tag_ids: [...new Set(tagIds)],
      author_id: 'seed-importer',
      cover_asset_id: null,
      created_at: now,
      updated_at: now,
    },
    model_name: 'seed-import',
    language: 'multi',
    prompt_text: [
      '【来自种子数据】该仓库是提示词资源/合集，不是单条可执行 prompt。',
      `仓库：${entry.repo}`,
      `链接：${entry.url}`,
      `说明：${entry.desc}`,
    ].join('\n'),
    showcases: [],
    metrics: {
      github_stars: entry.stars,
      github_stars_text: entry.starsText,
    },
    source_meta: {
      kind: 'github',
      repo: entry.repo,
      url: entry.url,
      note: entry.note,
    },
  };
}

function buildMcpSeed(entry, now) {
  return {
    content: {
      id: makeId('mcp', entry.repo),
      type: 'mcp',
      status: 'Listed',
      title: entry.repo,
      one_liner: entry.desc,
      category_id: null,
      category_ids: [],
      tag_ids: ['github'],
      author_id: 'seed-importer',
      cover_asset_id: null,
      created_at: now,
      updated_at: now,
    },
    // NOTE(decisions): 现有 MCP schema 的 source 是 official|user 枚举，不能改成 source object。
    // GitHub 来源信息落到 source_meta，避免破坏既有契约。
    source: 'user',
    provider: entry.owner,
    repo_url: entry.url,
    // NOTE(decision-4): 字段文档要求 how_to_use 三段原样文本；种子数据缺失时以占位文本补齐。
    howto: {
      standard_config: {},
      clients: {},
      runtime: {},
      json_config_text: '来自种子数据，仅提供仓库链接，JSON 配置待补充。',
      common_clients_json: '来自种子数据，仅提供仓库链接，常用客户端配置待补充。',
      runtime_modes_json: '来自种子数据，仅提供仓库链接，运行形态说明待补充。',
    },
    cases: [],
    metrics: {
      github_stars: entry.stars,
      github_stars_text: entry.starsText,
    },
    source_meta: {
      kind: 'github',
      repo: entry.repo,
      url: entry.url,
      note: entry.note,
    },
  };
}

function buildSkillSeed(entry, now) {
  return {
    content: {
      id: makeId('skill', entry.repo),
      type: 'skill',
      status: 'Listed',
      title: entry.repo,
      one_liner: entry.desc,
      category_id: null,
      category_ids: [],
      tag_ids: ['github'],
      author_id: 'seed-importer',
      cover_asset_id: null,
      created_at: now,
      updated_at: now,
    },
    // NOTE(decisions): 现有 Skill schema 的 source 是 official|user 枚举，不能改成 source object。
    // GitHub 来源信息落到 source_meta，避免破坏既有契约。
    source: 'user',
    provider: entry.owner,
    repo_url: entry.url,
    // NOTE(decision-5): 字段文档要求 zip_asset_id 必有，种子数据无 zip 时写占位。
    zip_asset_id: 'TODO',
    install_commands: [`npx skills add ${entry.repo}`],
    usage_doc: `来自种子数据，仅提供仓库链接。请参考仓库文档：${entry.url}`,
    repo_snapshot: {
      stars: entry.stars,
      forks: null,
      updated_at: null,
      synced_at: now,
    },
    cases: [],
    metrics: {
      github_stars: entry.stars,
      github_stars_text: entry.starsText,
    },
    source_meta: {
      kind: 'github',
      repo: entry.repo,
      url: entry.url,
      note: entry.note,
    },
  };
}

function extractRepoFromUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'github.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

function dedupeKey(item) {
  const repo = item?.source_meta?.repo
    || extractRepoFromUrl(item?.source_meta?.url || '')
    || extractRepoFromUrl(item?.repo_url || '');

  if (repo) return `repo:${repo.toLowerCase()}`;

  const url = item?.source_meta?.url || item?.repo_url;
  if (url) return `url:${url.toLowerCase()}`;

  const title = item?.content?.title || item?.title || '';
  return `title:${String(title).trim().toLowerCase()}`;
}

function starsOf(item) {
  if (typeof item?.metrics?.github_stars === 'number') return item.metrics.github_stars;
  if (typeof item?.repo_snapshot?.stars === 'number') return item.repo_snapshot.stars;
  return 0;
}

function stableSort(items) {
  return [...items].sort((a, b) => {
    const starDiff = starsOf(b) - starsOf(a);
    if (starDiff !== 0) return starDiff;
    const at = a?.content?.title || '';
    const bt = b?.content?.title || '';
    return String(at).localeCompare(String(bt));
  });
}

function mergeByDedupe(existing, incoming) {
  const map = new Map();

  for (const item of existing) {
    map.set(dedupeKey(item), item);
  }

  for (const item of incoming) {
    const key = dedupeKey(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return stableSort([...map.values()]);
}

function updateTaxonomies() {
  const taxonomy = readJson(TAXONOMY_PATH);
  const requiredTags = [
    { id: 'prompt_image', name: 'Prompt-图片' },
    { id: 'prompt_video', name: 'Prompt-视频' },
    { id: 'prompt_text', name: 'Prompt-纯文本' },
    { id: 'github', name: 'GitHub' },
  ];

  const tagMap = new Map((taxonomy.tags || []).map((t) => [t.id, t]));
  for (const tag of requiredTags) {
    if (!tagMap.has(tag.id)) {
      tagMap.set(tag.id, tag);
    }
  }

  taxonomy.tags = [...tagMap.values()].sort((a, b) => a.id.localeCompare(b.id));
  writeJson(TAXONOMY_PATH, taxonomy);
}

function main() {
  const markdown = fs.readFileSync(DOC_PATH, 'utf8');
  const refs = parseReferences(markdown);
  const parsed = parseSeedEntries(markdown, refs);
  const now = nowIso();

  const mcpSeeds = parsed.filter((e) => e.type === 'mcp').map((e) => buildMcpSeed(e, now));
  const skillSeeds = parsed.filter((e) => e.type === 'skill').map((e) => buildSkillSeed(e, now));
  const promptSeeds = parsed.filter((e) => e.type === 'prompt').map((e) => buildPromptSeed(e, now));

  const mcps = readJson(MCP_PATH);
  const skills = readJson(SKILL_PATH);
  const prompts = readJson(PROMPT_PATH);

  const mergedMcps = mergeByDedupe(mcps, mcpSeeds);
  const mergedSkills = mergeByDedupe(skills, skillSeeds);
  const mergedPrompts = mergeByDedupe(prompts, promptSeeds);

  writeJson(MCP_PATH, mergedMcps);
  writeJson(SKILL_PATH, mergedSkills);
  writeJson(PROMPT_PATH, mergedPrompts);
  updateTaxonomies();

  console.log(`Imported seeds: MCP=${mcpSeeds.length}, Skill=${skillSeeds.length}, Prompt=${promptSeeds.length}`);
  console.log(`Merged totals: MCP=${mergedMcps.length}, Skill=${mergedSkills.length}, Prompt=${mergedPrompts.length}`);
}

main();
