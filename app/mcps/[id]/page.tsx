'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/common/Badge';
import { CopyButton } from '@/components/common/CopyButton';
import { Placeholder } from '@/components/layout/Placeholder';
import { SectionCard } from '@/components/layout/SectionCard';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { CommentThread } from '@/components/social/CommentThread';
import { SocialBar } from '@/components/social/SocialBar';
import { Select } from '@/components/ui/Select';
import { getMcp } from '@/lib/api';
import { toDisplayTags } from '@/lib/tagDisplay';
import { pickUnsplash, resolveCoverSrc, toAssetSrc } from '@/lib/visualAssets';
import type { McpDetailVM } from '@/types/mcp';

type OsOption = 'generic' | 'mac' | 'windows';
type IdeOption = 'generic' | 'cursor' | 'vscode';
type QuickClient = 'codex' | 'claude-code';
type QuickOs = 'mac' | 'windows';
type RuntimeIde = 'cursor' | 'vscode';

interface BaseServerSpec {
  command?: string;
  args?: unknown;
  env?: unknown;
  [key: string]: unknown;
}

function safeParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeCommand(command: string | undefined, os: OsOption): string | undefined {
  if (!command) return command;
  if (os === 'windows') {
    return command === 'npx' ? 'npx.cmd' : command;
  }
  if (os === 'mac') {
    return command === 'npx.cmd' ? 'npx' : command;
  }
  return command;
}

function extractBaseServerSpec(parsed: unknown): BaseServerSpec | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;

  if ('command' in obj || 'args' in obj || 'env' in obj) {
    return obj;
  }

  const mcpServers = obj.mcpServers;
  if (mcpServers && typeof mcpServers === 'object') {
    const first = Object.values(mcpServers as Record<string, unknown>)[0];
    if (first && typeof first === 'object') return first as BaseServerSpec;
  }

  const servers = obj.servers;
  if (servers && typeof servers === 'object') {
    const first = Object.values(servers as Record<string, unknown>)[0];
    if (first && typeof first === 'object') return first as BaseServerSpec;
  }

  return null;
}

function toReadableSlug(input: string): string {
  return input
    .replace(/^@/, '')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function deriveServerName(detail: McpDetailVM, baseSpec?: BaseServerSpec | null): string {
  const rawArgs = Array.isArray(baseSpec?.args) ? baseSpec?.args : [];
  const packageArg = rawArgs.find(
    (arg): arg is string => typeof arg === 'string' && !arg.startsWith('-'),
  );
  if (packageArg) {
    const fromPackage = toReadableSlug(packageArg);
    if (fromPackage) return fromPackage;
  }

  if (detail.repo_url) {
    const repoTail = detail.repo_url.split('/').filter(Boolean).pop() ?? '';
    const fromRepo = toReadableSlug(repoTail);
    if (fromRepo) return fromRepo;
  }

  const fromTitle = toReadableSlug(detail.content.title);
  if (fromTitle) return fromTitle;

  const fromId = toReadableSlug(detail.content.id.replace(/^mcp[_-]?/i, ''));
  return fromId || 'mcp-server';
}

function buildMcpConfigSnippet({
  baseSpec,
  os,
  ide,
  serverName,
}: {
  baseSpec: BaseServerSpec;
  os: OsOption;
  ide: IdeOption;
  serverName: string;
}): string {
  const normalized = { ...baseSpec };
  normalized.command = normalizeCommand(typeof normalized.command === 'string' ? normalized.command : undefined, os);

  if (ide === 'vscode') {
    const server = { type: 'stdio', ...normalized };
    return JSON.stringify({ servers: { [serverName]: server } }, null, 2);
  }

  return JSON.stringify({ mcpServers: { [serverName]: normalized } }, null, 2);
}

function extractPackageRef(baseSpec: BaseServerSpec | null): string | null {
  if (!baseSpec || !Array.isArray(baseSpec.args)) return null;
  const args = baseSpec.args.filter((item): item is string => typeof item === 'string');
  const packageRef = args.find((arg) => !arg.startsWith('-'));
  return packageRef ?? null;
}

function pickRunner(baseSpec: BaseServerSpec | null): 'npx' | 'npx.cmd' {
  if (typeof baseSpec?.command === 'string' && baseSpec.command.toLowerCase().includes('cmd')) {
    return 'npx.cmd';
  }
  return 'npx';
}

function commandForOs(runner: 'npx' | 'npx.cmd', os: QuickOs): 'npx' | 'npx.cmd' {
  if (os === 'windows') return runner === 'npx.cmd' ? 'npx.cmd' : 'npx';
  return runner === 'npx.cmd' ? 'npx' : 'npx';
}

function buildQuickCommand({
  client,
  os,
  serverName,
  packageRef,
  runner,
}: {
  client: QuickClient;
  os: QuickOs;
  serverName: string;
  packageRef: string;
  runner: 'npx' | 'npx.cmd';
}): string {
  const actualRunner = commandForOs(runner, os);
  if (client === 'claude-code') {
    return `claude mcp add ${serverName} ${actualRunner} ${packageRef}`;
  }
  return `codex mcp add ${serverName} ${actualRunner} "${packageRef}"`;
}

function buildRunCommand({ packageRef }: { packageRef: string }): string {
  return `npx ${packageRef} --port 8931`;
}

function buildRemoteUrlConfig({
  ide,
  serverName,
  port = 8931,
}: {
  ide: RuntimeIde;
  serverName: string;
  port?: number;
}): string {
  const url = `http://localhost:${port}/mcp`;
  if (ide === 'vscode') {
    return JSON.stringify(
      {
        servers: {
          [serverName]: {
            url,
          },
        },
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      mcpServers: {
        [serverName]: {
          url,
        },
      },
    },
    null,
    2,
  );
}

function looksLikeVideo(src?: string | null): boolean {
  if (!src) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

function toSourceLabel(source: McpDetailVM['source']): string {
  if (source === 'official') return '官方';
  return '社区';
}

function resolveCaseMedia(item: McpDetailVM['cases'][number], seed: string) {
  const media = item.media[0];
  const src = media?.external_url ?? toAssetSrc(media?.asset_id) ?? pickUnsplash(seed, 'mcp');
  const isVideo = media?.media_type === 'video' || looksLikeVideo(media?.asset_id) || looksLikeVideo(media?.external_url);
  return { src, isVideo };
}

export default function McpDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const target = { target_type: 'mcp' as const, target_id: id };
  const [detail, setDetail] = useState<McpDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [os, setOs] = useState<OsOption>('generic');
  const [ide, setIde] = useState<IdeOption>('generic');
  const [quickClient, setQuickClient] = useState<QuickClient>('codex');
  const [quickOs, setQuickOs] = useState<QuickOs>('mac');
  const [runtimeIde, setRuntimeIde] = useState<RuntimeIde>('cursor');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getMcp(id);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-sm text-slate-500">加载中...</p>;

  if (!detail) {
    return (
      <SectionCard title={`MCP 详情（未找到：${id}）`}>
        <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" />
      </SectionCard>
    );
  }

  const displayTags = toDisplayTags(detail.content.tag_ids, 6);
  const genericConfigText = detail.how_to_use.json_config_text || '';
  const parsedBaseSpec = extractBaseServerSpec(safeParseJson(genericConfigText));
  const quickServerName = deriveServerName(detail, parsedBaseSpec);
  const quickPackageRef = extractPackageRef(parsedBaseSpec);
  const quickRunner = pickRunner(parsedBaseSpec);
  const runtimePackageRef = quickPackageRef ?? quickServerName;
  const runCommand = buildRunCommand({ packageRef: runtimePackageRef });
  const runtimeConfigText = buildRemoteUrlConfig({ ide: runtimeIde, serverName: quickServerName, port: 8931 });
  const quickCommand = quickPackageRef
    ? buildQuickCommand({
        client: quickClient,
        os: quickOs,
        serverName: quickServerName,
        packageRef: quickPackageRef,
        runner: quickRunner,
      })
    : '暂无可用命令';

  const displayConfigText = (() => {
    if (os === 'generic' || ide === 'generic') {
      return genericConfigText;
    }

    const parsed = safeParseJson(genericConfigText);
    const baseSpec = extractBaseServerSpec(parsed);
    if (!baseSpec) {
      return genericConfigText;
    }

    return buildMcpConfigSnippet({
      baseSpec,
      os,
      ide,
      serverName: deriveServerName(detail, baseSpec),
    });
  })();

  const heroAsset = detail.content.cover_asset_id;
  const heroSrc = resolveCoverSrc({ assetId: heroAsset, seed: `mcp:${detail.content.id}:hero`, type: 'mcp' });
  const heroIsVideo = looksLikeVideo(heroAsset);

  return (
    <div className="space-y-4">
      <StatusBanner type="mcp" id={id} status={detail.content.status} />

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0">
          {heroIsVideo ? (
            <video src={heroSrc} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : (
            <Image
              src={heroSrc}
              alt={detail.content.title}
              fill
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        </div>

        <div className="relative p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-[#f8d3bf]">MCP Detail</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{detail.content.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">{detail.content.one_liner || '暂无一句话描述'}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-100">
            <span className="rounded-full border border-white/45 bg-black/20 px-3 py-1">来源：{toSourceLabel(detail.source)}</span>
            <span className="rounded-full border border-white/45 bg-black/20 px-3 py-1">提供方：{detail.provider_name || '暂无'}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <SectionCard title="案例展示" description="覆盖场景、调用、结果与风险，便于快速评估落地可行性。">
            {detail.cases.length > 0 ? (
              <div className="space-y-4">
                {detail.cases.map((item, index) => {
                  const media = resolveCaseMedia(item, `mcp:${detail.content.id}:case:${item.id || index}`);
                  return (
                    <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {media.isVideo ? (
                        <video src={media.src} controls playsInline className="aspect-[16/9] h-auto w-full object-cover" />
                      ) : (
                        <Image
                          src={media.src}
                          alt={item.title || '案例效果图'}
                          width={1280}
                          height={720}
                          className="aspect-[16/9] h-auto w-full object-cover"
                        />
                      )}

                      <div className="space-y-3 border-t border-slate-200 bg-white p-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">场景（我想让 Agent 做什么）</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.title || '暂无'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">调用（示例指令/对话）</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                            {item.user_input || item.execution_process || '暂无'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">结果（成功标志/返回示例）</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.agent_output || '暂无'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">风险（权限范围与注意事项）</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                            {item.execution_process || '请在最小权限范围内运行，并先在测试环境验证。'}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">暂无案例</p>
            )}
          </SectionCard>

          <SectionCard title="如何使用">
            <div className="space-y-3">
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700">标准配置</p>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Select
                      aria-label="系统选择"
                      value={os}
                      onChange={(event) => setOs(event.target.value as OsOption)}
                      className="h-8 !w-28 text-xs"
                    >
                      <option value="generic">通用</option>
                      <option value="mac">mac</option>
                      <option value="windows">windows</option>
                    </Select>
                    <Select
                      aria-label="IDE 选择"
                      value={ide}
                      onChange={(event) => setIde(event.target.value as IdeOption)}
                      className="h-8 !w-28 text-xs"
                    >
                      <option value="generic">通用</option>
                      <option value="cursor">cursor</option>
                      <option value="vscode">vscode</option>
                    </Select>
                    <CopyButton value={displayConfigText?.trim() ? displayConfigText : '暂无内容'} />
                  </div>
                </div>

                {(os === 'generic' || ide === 'generic') ? (
                  <p className="text-xs text-slate-500">请选择系统与 IDE 以生成专用配置。</p>
                ) : null}

                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
                  {displayConfigText?.trim() ? displayConfigText : '暂无内容'}
                </pre>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700">常用客户端</p>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Select
                      aria-label="客户端系统选择"
                      value={quickOs}
                      onChange={(event) => setQuickOs(event.target.value as QuickOs)}
                      className="h-8 !w-28 text-xs"
                    >
                      <option value="mac">mac</option>
                      <option value="windows">windows</option>
                    </Select>
                    <Select
                      aria-label="客户端选择"
                      value={quickClient}
                      onChange={(event) => setQuickClient(event.target.value as QuickClient)}
                      className="h-8 !w-32 text-xs"
                    >
                      <option value="codex">Codex</option>
                      <option value="claude-code">Claude Code</option>
                    </Select>
                    <CopyButton value={quickCommand} />
                  </div>
                </div>

                <pre className="overflow-auto whitespace-pre rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
                  {quickCommand}
                </pre>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">运行形态补充</p>

                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700">运行：</p>
                    <CopyButton value={runCommand} />
                  </div>
                  <pre className="overflow-auto whitespace-pre rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
                    {`# Bash\n${runCommand}`}
                  </pre>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700">配置：</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <Select
                        aria-label="运行形态配置 IDE 选择"
                        value={runtimeIde}
                        onChange={(event) => setRuntimeIde(event.target.value as RuntimeIde)}
                        className="h-8 !w-28 text-xs"
                      >
                        <option value="cursor">Cursor</option>
                        <option value="vscode">VS Code</option>
                      </Select>
                      <CopyButton value={runtimeConfigText} />
                    </div>
                  </div>
                  <pre className="max-h-72 overflow-auto whitespace-pre rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
                    {runtimeConfigText}
                  </pre>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="评论区">
            <CommentThread target={target} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
            <div className="bg-gradient-to-r from-[#fff5ef] via-[#fffaf8] to-white px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">基础信息</h3>
            </div>

            <div className="space-y-4 p-5 text-sm text-slate-700">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">标签</p>
                {displayTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {displayTags.map((tag) => (
                      <Badge key={tag.id} tone="info">
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">暂无</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">名称</p>
                <p className="text-sm text-slate-800">{detail.content.title}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">类型</p>
                <p className="text-sm text-slate-800">MCP</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">提供方</p>
                <p className="text-sm text-slate-800">{detail.provider_name || '暂无'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">仓库地址</p>
                <a
                  href={detail.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block break-all text-sm text-sky-700 hover:underline"
                >
                  {detail.repo_url || '暂无'}
                </a>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">用途一句话</p>
                <p className="text-sm text-slate-800">{detail.content.one_liner ?? '暂无'}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 p-5">
              <SocialBar target={target} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
