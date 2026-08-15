/**
 * Zat-DSH Engine — browser half.
 *
 * Mounts the strict Remote descriptors for the host's `pluginMarket`
 * namespace (wire field names mirror the host methods' parameter names, in
 * the same order — SRC contract), then registers the marketplace tab next to
 * the built-in plugin list in Settings → Plugins.
 */

import React, { useEffect, useRef, useState } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type {
  InvocationDescriptor,
  InvocationParameterDescriptor,
  RemoteResult,
  TypertClientRemote,
  TypertCodec,
  TypertRemoteNamespace,
} from '@deepseek-ai/dsh-typert-protocol'

// ── wire contracts ──────────────────────────────────────────────────────

interface MarketItem {
  fullName: string
  owner: string
  name: string
  description: string
  zhIntro: string
  needZh: boolean
  stars: number
  forks: number
  language: string
  topics: string[]
  updatedAt: string
  htmlUrl: string
  homepage: string
  installed: boolean
  installedName: string | null
  cover: string
  installedVersion?: string | null
  latestVersion?: string | null
  hasUpdate?: boolean
  isHarness?: boolean
  /** Installed as a dependency but absent from bundles (never loads). */
  disabled?: boolean
  /** Repo kind: plugin | nonplugin | multi | skill. */
  kind?: string
  /** The current GitHub user has starred this repo (needs a token). */
  starred?: boolean
}

interface MarketListResult {
  ok: boolean
  message?: string
  items: MarketItem[]
  total: number
  hasMore: boolean
  page: number
  llmUsable: boolean
  source: string
}

interface MarketJson {
  ok?: boolean
  message?: string
  [key: string]: unknown
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteMap {
    'pluginMarket/list': (page: number, sort: string, q: string, category: string) => Promise<RemoteResult<MarketListResult>>
    'pluginMarket/versions': () => Promise<RemoteResult<{ ok: boolean; map: Record<string, { local: string | null; remote: string | null; hasUpdate: boolean }> }>>
    'pluginMarket/translate': (items: Array<{ fullName: string; description: string }>) => Promise<RemoteResult<{ ok: boolean; map: Record<string, string>; llmUsable: boolean; pending: number }>>
    'pluginMarket/installed': () => Promise<RemoteResult<MarketJson>>
    'pluginMarket/detail': (owner: string, repo: string) => Promise<RemoteResult<MarketJson & { summary?: string; isMonorepo?: boolean }>>
    'pluginMarket/selfupdate': (doUpdate: boolean) => Promise<RemoteResult<MarketJson & { hasUpdate?: boolean; latestVersion?: string }>>
    'pluginMarket/subpackages': (owner: string, repo: string) => Promise<RemoteResult<MarketJson & { kind?: string; packages?: Array<{ dir: string; name: string; version: string }> }>>
    'pluginMarket/installPlugin': (owner: string, repo: string, subdir: string) => Promise<RemoteResult<MarketJson & { packageName?: string | null; kind?: string; packages?: Array<{ dir: string; name: string; version: string }> }>>
    'pluginMarket/update': (owner: string, repo: string, subdir: string) => Promise<RemoteResult<MarketJson & { version?: string }>>
    'pluginMarket/uninstall': (name: string) => Promise<RemoteResult<MarketJson>>
    'pluginMarket/star': (owner: string, repo: string) => Promise<RemoteResult<MarketJson & { starred?: boolean; needToken?: boolean; url?: string }>>
    'pluginMarket/starredList': () => Promise<RemoteResult<MarketJson & { starred?: string[] }>>
    'pluginMarket/setToken': (token: string) => Promise<RemoteResult<MarketJson & { hasToken?: boolean }>>
  }
  interface TypertRemoteNamespaceMap {
    pluginMarket: TypertRemoteNamespace<'pluginMarket'>
  }
}

interface MarketSubpackage {
  dir: string
  name: string
  version: string
}

interface MarketRemote extends TypertClientRemote {
  pluginMarket: {
    list(page: number, sort: string, q: string, category: string): Promise<RemoteResult<MarketListResult>>
    versions(): Promise<RemoteResult<{ ok: boolean; map: Record<string, { local: string | null; remote: string | null; hasUpdate: boolean }> }>>
    translate(items: Array<{ fullName: string; description: string }>): Promise<RemoteResult<{ ok: boolean; map: Record<string, string>; llmUsable: boolean; pending: number }>>
    installed(): Promise<RemoteResult<MarketJson>>
    detail(owner: string, repo: string): Promise<RemoteResult<MarketJson & { summary?: string; isMonorepo?: boolean }>>
    selfupdate(doUpdate: boolean): Promise<RemoteResult<MarketJson & { hasUpdate?: boolean; latestVersion?: string }>>
    subpackages(owner: string, repo: string): Promise<RemoteResult<MarketJson & { kind?: string; packages?: MarketSubpackage[] }>>
    installPlugin(owner: string, repo: string, subdir: string): Promise<RemoteResult<MarketJson & { packageName?: string | null; kind?: string; packages?: MarketSubpackage[] }>>
    update(owner: string, repo: string, subdir: string): Promise<RemoteResult<MarketJson & { version?: string }>>
    uninstall(name: string): Promise<RemoteResult<MarketJson>>
    star(owner: string, repo: string): Promise<RemoteResult<MarketJson & { starred?: boolean; needToken?: boolean; url?: string }>>
    starredList(): Promise<RemoteResult<MarketJson & { starred?: string[] }>>
    setToken(token: string): Promise<RemoteResult<MarketJson & { hasToken?: boolean }>>
  }
}

// ── strict descriptors (identity schema; the host validates on its side) ──

const jsonCodec: TypertCodec = {
  mode: 'strict',
  typeSymbol: 'zat-dsh-engine/json',
  schema: { parse: (value: unknown) => value },
}

function params(...names: string[]): InvocationParameterDescriptor[] {
  return names.map((name) => ({ name, wire: name, source: 'json' as const, codec: jsonCodec }))
}

function desc(method: string, parameterNames: string[]): InvocationDescriptor {
  return {
    id: `zat-dsh-engine#pluginMarket/${method}`,
    service: 'pluginMarket',
    namespace: 'pluginMarket',
    method,
    invocation: { kind: 'direct' },
    parameters: params(...parameterNames),
    result: jsonCodec,
  }
}

const marketDescriptors: InvocationDescriptor[] = [
  desc('list', ['page', 'sort', 'q', 'category']),
  desc('versions', []),
  desc('translate', ['items']),
  desc('installed', []),
  desc('detail', ['owner', 'repo']),
  desc('selfupdate', ['doUpdate']),
  desc('subpackages', ['owner', 'repo']),
  desc('installPlugin', ['owner', 'repo', 'subdir']),
  desc('update', ['owner', 'repo', 'subdir']),
  desc('uninstall', ['name']),
  desc('star', ['owner', 'repo']),
  desc('starredList', []),
  desc('setToken', ['token']),
]

// ── locales ─────────────────────────────────────────────────────────────

interface LocaleFace {
  getLocale(): { active?: string } | undefined
  subscribe(listener: () => void): (() => void) | undefined
}

interface SlotsFace {
  inject(name: string, callback: () => unknown): unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(options: Record<string, unknown>, component: React.ComponentType<any>): unknown
}

function isZh(id: string): boolean {
  return id === 'zh' || id === 'zh-CN' || id === 'zh-TW' || id === 'zh-Hans' || id === 'zh-Hant'
}

// ── styles ──────────────────────────────────────────────────────────────

const css = `
.zat-panel{display:flex;flex-direction:column;gap:12px;height:100%;min-height:0;color:var(--color-fg1,#e6e9ef);font-family:inherit}
.zat-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;position:sticky;top:0;z-index:20;background:var(--color-bg1,#121826);padding:4px 2px}
.zat-title{font-size:15px;font-weight:700;color:var(--color-fg1,#eef1f7);white-space:nowrap}
.zat-title small{font-size:11px;color:var(--color-fg3,#7c8698);font-weight:400;margin-left:6px}
.zat-updbtn{background:linear-gradient(90deg,#0ea5e9,#22d3ee);border:none;color:#fff;font-weight:600;border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.zat-updbtn:hover{filter:brightness(1.1)}
.zat-search{flex:1;min-width:160px;display:flex;align-items:center;gap:6px;background:var(--color-bg2,#181d28);border:1px solid var(--color-border,#ffffff14);border-radius:8px;padding:6px 10px}
.zat-search input{flex:1;background:transparent;border:none;outline:none;color:var(--color-fg1,#e6e9ef);font-size:13px}
.zat-search input::placeholder{color:var(--color-fg3,#5d6676)}
.zat-token{flex:1;min-width:200px;background:var(--color-bg2,#181d28);border:1px solid var(--color-border,#ffffff14);border-radius:8px;padding:5px 10px;font-size:12px;color:var(--color-fg1,#e6e9ef);outline:none}
.zat-token:focus{border-color:rgba(93,140,255,.5)}
.zat-btn{background:var(--color-bg2,#232a3a);color:var(--color-fg2,#dbe2ee);border:1px solid var(--color-border,#ffffff14);border-radius:8px;padding:5px 12px;font-size:12.5px;cursor:pointer;white-space:nowrap;transition:background .15s;text-decoration:none;display:inline-flex;align-items:center}
.zat-btn:hover{background:var(--color-bg3,#2e3750)}
.zat-btn.zat-primary{background:linear-gradient(90deg,#3d6bff,#7a4dff);border:none;color:#fff;font-weight:600}
.zat-btn.zat-danger{background:#2a1a1e;color:#f87171;border:1px solid rgba(248,113,113,.4)}
.zat-btn.zat-danger:hover{background:#3a2026}
.zat-btn.zat-update{background:linear-gradient(90deg,#0ea5e9,#22d3ee);border:none;color:#fff;font-weight:600}
.zat-btn.zat-installed{background:var(--color-bg3,#1d2b21);color:#34d399;border:1px solid rgba(52,211,153,.35)}
.zat-btn:disabled{opacity:.55;cursor:default}
.zat-sel{background:var(--color-bg2,#181d28);color:var(--color-fg2,#dbe2ee);border:1px solid var(--color-border,#ffffff14);border-radius:8px;padding:5px 8px;font-size:12.5px;outline:none;max-width:200px}
.zat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px;overflow-y:auto;min-height:0;padding:2px}
.zat-card{background:var(--color-bg2,#151a24);border:1px solid var(--color-border,#ffffff0f);border-radius:12px;overflow:hidden;cursor:pointer;transition:transform .18s,box-shadow .18s,border-color .18s;display:flex;flex-direction:column}
.zat-card:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.4);border-color:rgba(93,140,255,.4)}
.zat-cover{position:relative;aspect-ratio:16/9;background:linear-gradient(135deg,#1c2333,#26304a);overflow:hidden}
.zat-cover img{width:100%;height:100%;object-fit:cover;display:block}
.zat-coverfallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:rgba(255,255,255,.85);letter-spacing:2px}
.zat-badge{position:absolute;top:8px;right:8px;background:rgba(16,185,129,.92);color:#fff;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.zat-kindbadge{position:absolute;top:8px;left:8px;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.zat-kind-skill{background:rgba(217,119,6,.92);color:#fff}
.zat-kind-nonplugin{background:rgba(90,100,120,.92);color:#fff}
.zat-kind-multi{background:rgba(79,70,229,.92);color:#fff}
.zat-updbadge{position:absolute;top:8px;right:8px;background:rgba(14,165,233,.95);color:#fff;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.zat-zhbadge{position:absolute;bottom:6px;left:8px;background:rgba(20,30,60,.85);color:#9fc1ff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;border:1px solid rgba(93,140,255,.3)}
.zat-body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px;flex:1}
.zat-name{font-size:13.5px;font-weight:650;color:var(--color-fg1,#eef1f7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zat-owner{font-size:11px;color:var(--color-fg3,#7c8698);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zat-desc{font-size:11.5px;color:var(--color-fg2,#a8b2c4);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:34px}
.zat-meta{display:flex;align-items:center;gap:10px;font-size:11px;color:var(--color-fg3,#7c8698);margin-top:auto;flex-wrap:wrap}
.zat-star{color:#f5b942;font-weight:600;cursor:pointer;user-select:none}
.zat-star:hover{filter:brightness(1.25)}
.zat-star.zat-staroff{color:#8b94a5}
.zat-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.zat-cardbtn{margin-top:8px;padding:6px 0;border-radius:8px;border:none;font-size:12px;font-weight:600;cursor:pointer;text-align:center;transition:filter .15s}
.zat-cardbtn.zat-install{background:linear-gradient(90deg,#3d6bff,#7a4dff);color:#fff}
.zat-cardbtn.zat-update{background:linear-gradient(90deg,#0ea5e9,#22d3ee);color:#fff}
.zat-cardbtn.zat-installed{background:var(--color-bg3,#1d2b21);color:#34d399;border:1px solid rgba(52,211,153,.35)}
.zat-cardbtn.zat-noninstall{background:#3a2414;color:#fb923c;border:1px solid rgba(251,146,60,.4)}
.zat-cardbtn.zat-disabled{background:#33271a;color:#f0a94b;border:1px solid rgba(240,169,75,.35)}
.zat-cardbtn.zat-nonplugin{background:var(--color-bg3,#22252e);color:var(--color-fg3,#8b94a5);border:1px solid var(--color-border,#ffffff14)}
.zat-status{text-align:center;padding:40px 0;color:var(--color-fg3,#7c8698);font-size:13px}
.zat-status.zat-error{color:#f87171}
.zat-foot{display:flex;justify-content:center;align-items:center;gap:10px;padding:6px 0;flex-wrap:wrap}
.zat-count{font-size:11.5px;color:var(--color-fg3,#5d6676)}
.zat-legend{display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;background:var(--color-bg2,#151a24);border:1px solid var(--color-border,#ffffff0f);border-radius:10px;padding:6px 12px;font-size:11px;color:var(--color-fg3,#9aa4b5)}
.zat-legend .zat-lghead{font-weight:650;color:var(--color-fg2,#c3ccdb)}
.zat-legend .zat-lgi{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.zat-legend .zat-lgi i{width:10px;height:10px;border-radius:3px;display:inline-block;flex:none}
.zat-loading{color:var(--color-fg3,#7c8698);font-size:12px;text-align:center;padding:8px}
.zat-detail{display:flex;flex-direction:column;gap:12px;overflow-y:auto;min-height:0;padding:2px}
.zat-dcover{width:100%;max-width:480px;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:var(--color-bg2,#1c2333);border:1px solid var(--color-border,#ffffff14)}
.zat-dcover img{width:100%;height:100%;object-fit:cover}
.zat-dtitle{font-size:22px;font-weight:750;color:var(--color-fg1,#f2f5fa)}
.zat-downer{font-size:12.5px;color:var(--color-fg3,#7c8698);margin-top:2px}
.zat-dstats{display:flex;gap:16px;font-size:12.5px;color:var(--color-fg2,#a8b2c4);flex-wrap:wrap}
.zat-ver{background:var(--color-bg3,#1c2436);border:1px solid rgba(93,140,255,.25);border-radius:8px;padding:4px 10px;font-size:11.5px;color:#8ea6e8}
.zat-ver.zat-verold{color:#f87171;border-color:rgba(248,113,113,.4)}
.zat-summary{background:var(--color-bg2,#151a24);border:1px solid var(--color-border,#ffffff0f);border-radius:10px;padding:14px 16px;font-size:12.5px;line-height:1.75;color:var(--color-fg2,#c3ccdb);white-space:pre-wrap}
.zat-topics{display:flex;flex-wrap:wrap;gap:6px}
.zat-topic{background:var(--color-bg3,#1c2436);color:#8ea6e8;border:1px solid rgba(93,140,255,.25);border-radius:14px;padding:2px 10px;font-size:11px}
.zat-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.zat-notice{color:#fbbf24;font-size:12.5px;padding:4px 0}
.zat-zhlabel{color:#9fc1ff;font-size:11px;font-weight:600;margin-right:4px}
.zat-monobadge{background:#3a2a1a;color:#fbbf24;border:1px solid rgba(251,191,36,.35);border-radius:8px;padding:6px 12px;font-size:12px;display:inline-block}
.zat-subchoices{background:var(--color-bg2,#151a24);border:1px solid rgba(251,191,36,.35);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.zat-subchoices-title{font-size:12.5px;color:#fbbf24;font-weight:600}
.zat-subrow{display:flex;align-items:center;justify-content:space-between;gap:10px}
.zat-subname{font-size:12.5px;color:var(--color-fg1,#eef1f7)}
.zat-subname small{color:var(--color-fg3,#7c8698);margin-left:6px}
`

function injectCss(): () => void {
  const tagId = 'zat-dsh-engine/market'
  if (document.querySelector(`style[data-plugin-css="${tagId}"]`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = 'zat-dsh-engine'
  tag.dataset.pluginCss = tagId
  tag.textContent = css
  document.head.appendChild(tag)
  return () => { tag.remove() }
}

// ── UI constants ────────────────────────────────────────────────────────

const CATEGORIES: Array<{ label: string; en: string }> = [
  { label: '全部', en: 'All' },
  { label: '皮肤 / 主题', en: 'Theme' },
  { label: '工具 / 终端', en: 'Tools' },
  { label: '浏览器 / 自动化', en: 'Browser' },
  { label: '技能 Skills', en: 'Skills' },
  { label: '视觉 / 多媒体', en: 'Vision' },
  { label: '网络 / MCP', en: 'Network' },
  { label: '多智能体 / 编排', en: 'Agents' },
  { label: '数据 / 存储 / 记忆', en: 'Data' },
  { label: '硬件 / 桌面', en: 'Hardware' },
  { label: '设计 / 文档', en: 'Design' },
  { label: '安全 / 通知', en: 'Security' },
]

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', 'C#': '#178600',
  HTML: '#e34c26', CSS: '#563d7c', Rust: '#dea584', Go: '#00ADD8', Java: '#b07219',
  C: '#555555', 'C++': '#f34b7d', Shell: '#89e051', Lua: '#000080', Swift: '#F05138',
  Kotlin: '#A97BFF', Vue: '#41b883', Svelte: '#ff3e00', Ruby: '#701516', PHP: '#4F5D95',
}

function formatStars(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

// ── panel ───────────────────────────────────────────────────────────────

interface MarketPanelProps {
  pm: MarketRemote['pluginMarket']
  locale: LocaleFace
}

function MarketPanel({ pm, locale }: MarketPanelProps) {
  const [zh, setZh] = useState(() => {
    const snap = locale.getLocale()
    return snap?.active ? isZh(String(snap.active)) : true
  })
  const [items, setItems] = useState<MarketItem[] | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('stars')
  const [category, setCategory] = useState('全部')
  const [instFilter, setInstFilter] = useState<'all' | 'installed' | 'uninstalled' | 'installable'>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState('')
  const [detail, setDetail] = useState<MarketItem | null>(null)
  const [detailData, setDetailData] = useState<MarketJson | null>(null)
  const [notice, setNotice] = useState('')
  const [selfUpdate, setSelfUpdate] = useState<{ latestVersion?: string } | null>(null)
  const [subChoices, setSubChoices] = useState<{ owner: string; repo: string; packages: MarketSubpackage[] } | null>(null)
  const [profileInfo, setProfileInfo] = useState<{ profileName?: string; profileDir?: string } | null>(null)
  const [showLegend, setShowLegend] = useState(true)
  const [hasToken, setHasToken] = useState<boolean | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const loadingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const starredSetRef = useRef<Set<string> | null>(null)

  const t = (zhText: string, enText: string): string => (zh ? zhText : enText)

  /** Stamp `starred` onto a list from the cached starred-set (filled async). */
  function applyStars(list: MarketItem[]): MarketItem[] {
    const set = starredSetRef.current
    if (!set) return list
    return list.map((it) => ({ ...it, starred: set.has(it.fullName.toLowerCase()) }))
  }

  /** Fetch the current user's starred repos and restamp all visible cards. */
  function syncStars(): void {
    void pm.starredList().then((res) => {
      if (!res.ok || !res.value.ok) { setHasToken(false); return }
      const list = Array.isArray(res.value.starred) ? (res.value.starred as string[]) : []
      const set = new Set(list)
      starredSetRef.current = set
      setHasToken(true)
      setItems((prev) => (prev ? prev.map((it) => ({ ...it, starred: set.has(it.fullName.toLowerCase()) })) : prev))
    }).catch(() => { setHasToken(false) })
  }

  /** One-click star / unstar; falls back to the repo page when no credential. */
  function onStar(item: MarketItem): void {
    void pm.star(item.owner, item.name).then((res) => {
      const value = res.ok ? res.value : null
      if (res.ok && value && value.ok && typeof value.starred === 'boolean') {
        const key = item.fullName.toLowerCase()
        if (value.starred) starredSetRef.current?.add(key)
        else starredSetRef.current?.delete(key)
        setItems((prev) => (prev ? prev.map((it) => (it.fullName === item.fullName
          ? { ...it, starred: value.starred, stars: Math.max(0, it.stars + (value.starred ? 1 : -1)) }
          : it)) : prev))
        setNotice(String(value.message || ''))
      } else if (res.ok && value && value.needToken) {
        setNotice(String(value.message || t('需要 GitHub 凭据才能一键星标', 'A GitHub credential is required to star')))
        const u = String((value as { url?: string }).url || item.htmlUrl || `https://github.com/${item.fullName}`)
        window.open(u, '_blank', 'noopener')
      } else {
        setNotice(res.ok ? String(value?.message || t('星标失败', 'Star failed')) : res.error.message)
      }
    }).catch((err: unknown) => { setNotice(String((err as { message?: string })?.message || err)) })
  }

  function saveToken(): void {
    const tok = tokenInput.trim()
    if (!tok) { setNotice(t('先粘贴一个 Token 再保存', 'Paste a token first')); return }
    void pm.setToken(tok).then((res) => {
      if (res.ok && res.value.ok) {
        setHasToken(Boolean(res.value.hasToken))
        setTokenInput('')
        setNotice(String(res.value.message || ''))
        starredSetRef.current = null
        syncStars()
      } else {
        setNotice(res.ok ? String(res.value.message || '') : res.error.message)
      }
    }).catch((err: unknown) => setNotice(String((err as { message?: string })?.message || err)))
  }

  function clearToken(): void {
    void pm.setToken('').then((res) => {
      if (res.ok && res.value.ok) {
        setHasToken(false)
        starredSetRef.current = null
        setItems((prev) => (prev ? prev.map((it) => ({ ...it, starred: false })) : prev))
        setNotice(String(res.value.message || ''))
      } else {
        setNotice(res.ok ? String(res.value.message || '') : res.error.message)
      }
    }).catch((err: unknown) => setNotice(String((err as { message?: string })?.message || err)))
  }

  useEffect(() => {
    const off = locale.subscribe(() => {
      const snap = locale.getLocale()
      setZh(snap?.active ? isZh(String(snap.active)) : true)
    })
    return () => { off?.() }
  }, [locale])

  useEffect(() => {
    const dispose = injectCss()
    return dispose
  }, [])

  function load(p: number, s: string, q: string, cat: string, append: boolean): void {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError('')
    void pm.list(p, s, q, cat).then((res) => {
      loadingRef.current = false
      setLoading(false)
      if (!res.ok || !res.value.ok) {
        setError(res.ok ? String(res.value.message || '') : res.error.message)
        return
      }
      const data = res.value
      setItems((prev) => (append && prev ? [...prev, ...applyStars(data.items)] : applyStars(data.items)))
      setTotal(data.total || 0)
      setPage(p)
      requestZh(data.items)
      requestVersions(data.items)
    }).catch((err: unknown) => {
      loadingRef.current = false
      setLoading(false)
      setError(String((err as { message?: string })?.message || err))
    })
  }

  function requestZh(list: MarketItem[]): void {
    if (!zh) return
    const needZh = list.filter((it) => it.needZh).map((it) => ({ fullName: it.fullName, description: it.description || '' }))
    if (!needZh.length) return
    void pm.translate(needZh).then((tr) => {
      if (tr.ok && tr.value.ok && tr.value.map) {
        setItems((prev) => prev ? prev.map((it) => tr.value.map[it.fullName] ? { ...it, zhIntro: tr.value.map[it.fullName]!, needZh: false } : it) : prev)
      }
    }).catch(() => { /* best effort */ })
  }

  function requestVersions(list: MarketItem[]): void {
    const installed = list.filter((it) => it.installed)
    if (!installed.length) return
    void pm.versions().then((vr) => {
      if (vr.ok && vr.value.ok && vr.value.map) {
        setItems((prev) => prev ? prev.map((it) => {
          const entry = vr.value.map[it.fullName.toLowerCase()]
          if (!entry) return it
          return {
            ...it,
            installedVersion: entry.local,
            latestVersion: entry.remote,
            hasUpdate: entry.hasUpdate,
          }
        }) : prev)
      }
    }).catch(() => { /* best effort */ })
  }

  // Initial load.
  useEffect(() => {
    load(1, sort, '', category, false)
    void pm.selfupdate(false).then((r) => {
      if (r.ok && r.value.ok && r.value.hasUpdate) setSelfUpdate({ latestVersion: r.value.latestVersion })
    }).catch(() => { /* best effort */ })
    void pm.installed().then((r) => {
      if (r.ok && r.value.ok) {
        setProfileInfo({ profileName: String(r.value.profileName || ''), profileDir: String(r.value.profileDir || '') })
      }
    }).catch(() => { /* best effort */ })
    syncStars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced live search: typing pauses 300 ms, clearing returns to default.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      load(1, sort, query, category, false)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, category])

  function refreshItem(fullName: string, patch: Partial<MarketItem>): void {
    setItems((prev) => prev ? prev.map((it) => (it.fullName === fullName ? { ...it, ...patch } : it)) : prev)
    setDetail((d) => (d && d.fullName === fullName ? { ...d, ...patch } : d))
  }

  function doInstall(item: MarketItem): void {
    setInstalling(item.fullName)
    void pm.installPlugin(item.owner, item.name, '').then((res) => {
      setInstalling('')
      const value = res.ok ? res.value : null
      // Monorepo: the host returns the bundled sub-plugins; offer them.
      if (res.ok && value && value.kind === 'multi' && Array.isArray(value.packages) && value.packages.length > 0) {
        setSubChoices({ owner: item.owner, repo: item.name, packages: value.packages })
        setNotice(String(value.message || ''))
        return
      }
      setNotice(res.ok ? String(value?.message || (value?.ok ? t('✅ 已安装!重启 dsh 后生效。', '✅ Installed! Restart dsh to activate.') : t('安装失败', 'Install failed'))) : res.error.message)
      if (res.ok && value?.ok) refreshItem(item.fullName, { installed: true, installedName: (value.packageName as string | null) || null, hasUpdate: false })
    }).catch((err: unknown) => {
      setInstalling('')
      setNotice(t('安装出错:', 'Install error: ') + String((err as { message?: string })?.message || err))
    })
  }

  function doInstallSub(choice: { owner: string; repo: string; packages: MarketSubpackage[] }, sub: MarketSubpackage): void {
    setInstalling(choice.owner + '/' + choice.repo + '/' + sub.dir)
    void pm.installPlugin(choice.owner, choice.repo, sub.dir).then((res) => {
      setInstalling('')
      const value = res.ok ? res.value : null
      setNotice(res.ok ? String(value?.message || (value?.ok ? t('✅ 已安装!重启 dsh 后生效。', '✅ Installed! Restart dsh to activate.') : t('安装失败', 'Install failed'))) : res.error.message)
      if (res.ok && value?.ok) {
        setSubChoices(null)
        refreshItem(choice.owner + '/' + choice.repo, { installed: true, installedName: (value.packageName as string | null) || null, hasUpdate: false })
      }
    }).catch((err: unknown) => {
      setInstalling('')
      setNotice(String((err as { message?: string })?.message || err))
    })
  }

  function doUpdate(item: MarketItem): void {
    setInstalling(item.fullName)
    void pm.update(item.owner, item.name, '').then((res) => {
      setInstalling('')
      const value = res.ok ? res.value : null
      setNotice(res.ok ? String(value?.message || '') : res.error.message)
      if (res.ok && value?.ok) refreshItem(item.fullName, { hasUpdate: false, installedVersion: value.version as string | null, latestVersion: value.version as string | null })
    }).catch((err: unknown) => {
      setInstalling('')
      setNotice(String((err as { message?: string })?.message || err))
    })
  }

  function doUninstall(item: MarketItem): void {
    const name = item.installedName
    if (!name) return
    setInstalling(item.fullName)
    void pm.uninstall(name).then((res) => {
      setInstalling('')
      const value = res.ok ? res.value : null
      setNotice(res.ok ? String(value?.message || '') : res.error.message)
      if (res.ok && value?.ok) refreshItem(item.fullName, { installed: false, installedName: null, hasUpdate: false, installedVersion: null, latestVersion: null })
    }).catch((err: unknown) => {
      setInstalling('')
      setNotice(String((err as { message?: string })?.message || err))
    })
  }

  function cardAction(item: MarketItem): void {
    if (item.isHarness) { setDetail(item); return }
    if (item.disabled) { setDetail(item); return }
    if (item.kind === 'skill' || item.kind === 'nonplugin') { setDetail(item); return }
    if (item.installed && item.hasUpdate) doUpdate(item)
    else if (!item.installed) doInstall(item)
    else setDetail(item)
  }

  function openDetail(item: MarketItem): void {
    setDetail(item)
    setDetailData(null)
    void pm.detail(item.owner, item.name).then((res) => {
      if (!res.ok || !res.value.ok) { setDetailData(null); return }
      setDetailData(res.value)
    }).catch(() => setDetailData(null))
  }

  function onScroll(e: React.UIEvent<HTMLDivElement>): void {
    const el = e.currentTarget
    if (!el || loadingRef.current) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 260) {
      if (page * 100 < total) load(page + 1, sort, query, category, true)
    }
  }

  const filtered = items ? items.filter((it) => {
    if (instFilter === 'installed' && !(it.installed || it.disabled)) return false
    if (instFilter === 'uninstalled' && (it.installed || it.disabled)) return false
    if (instFilter === 'installable' && it.kind !== 'plugin' && it.kind !== 'multi') return false
    return true
  }) : []

  if (detail) {
    const dd = detailData
    const ddesc = (zh && detail.zhIntro) ? detail.zhIntro : (detail.description || '')
    const mainBtn = detail.isHarness || Boolean(dd && dd.notPlugin)
      ? null
      : !detail.installed
        ? <button className="zat-btn zat-primary" onClick={() => doInstall(detail)} disabled={!!installing}>{installing ? t('安装中…', 'Installing…') : t('安装插件', 'Install')}</button>
        : detail.installed && detail.hasUpdate
          ? <button className="zat-btn zat-update" onClick={() => doUpdate(detail)} disabled={!!installing}>{installing ? t('更新中…', 'Updating…') : `↑ ${t('更新到 v', 'Update to v')}${detail.latestVersion || ''}`}</button>
          : detail.installed
            ? <button className="zat-btn zat-installed" disabled>✓ {t('已是最新', 'Up to date')}</button>
            : null
    return (
      <div className="zat-panel">
        <div className="zat-bar">
          <button className="zat-btn" onClick={() => setDetail(null)}>{t('← 返回市场', '← Back')}</button>
          <span className="zat-title">{detail.name}</span>
        </div>
        <div className="zat-detail">
          <div className="zat-dcover"><img src={detail.cover} onError={(e) => { e.currentTarget.style.display = 'none' }} alt={detail.name} /></div>
          <div className="zat-dtitle">{detail.name}</div>
          <div className="zat-downer">{detail.fullName}</div>
          <div className="zat-dstats">
            <span>⭐ {formatStars(detail.stars)} stars</span>
            <span>⑂ {formatStars(detail.forks)} forks</span>
            {detail.language && <span><span className="zat-dot" style={{ background: LANG_COLORS[detail.language] || '#8b949e' }} /> {detail.language}</span>}
            <span>{t('更新 ', 'Updated ')}{String(detail.updatedAt || '').slice(0, 10)}</span>
            {detail.installed && detail.installedVersion && <span className={'zat-ver' + (detail.hasUpdate ? ' zat-verold' : '')}>{t('已装 v', 'v')}{detail.installedVersion}</span>}
            {detail.hasUpdate && detail.latestVersion && <span className="zat-ver">{t('最新 v', 'Latest v')}{detail.latestVersion}</span>}
          </div>
          {detail.isHarness && (
            <div className="zat-summary">
              <span className="zat-zhlabel">{t('DeepSeek Harness 本体:', 'DeepSeek Harness itself:')}</span>
              {dd && dd.harnessVersion
                ? `${t('你正在使用 v', 'You are running v')}${String(dd.harnessVersion)}。`
                : `${t('你正在使用它。', 'You are using it.')}`}
              {dd && dd.harnessHasUpdate && dd.harnessRemote
                ? ` ${t('官方已发布新版本 v', 'A newer version v')}${String(dd.harnessRemote)}${t(',请到官方 Release 页面按你的安装方式更新。', ', please update through the official release page using your install method.')}`
                : ''}
            </div>
          )}
          {Boolean(dd && dd.notPlugin) && (
            <div className="zat-subchoices">
              <div className="zat-subchoices-title">
                {t('这不是可安装的 dsh 插件:仓库里没有插件声明,它可能是一个技能包或代码仓库(只是打了 dsh-plugin 标签)。请到 GitHub 查看它的使用方式。', 'Not an installable dsh plugin: this repository declares no plugin — it may be a skill pack or code repo that merely carries the dsh-plugin topic. Check GitHub for usage instructions.')}
              </div>
            </div>
          )}
          {detail.disabled && !detail.isHarness && (
            <div className="zat-subchoices">
              <div className="zat-subchoices-title">
                {t('这个插件已安装,但不在启用列表里——重启 dsh 也不会加载。', 'This plugin is installed but missing from the bundle list — it will not load even after a restart.')}
                {' ' + t('重新点一次安装通常能修复;或手动运行 dsh plugin 命令启用。', 'Installing again usually fixes it, or enable it with the dsh plugin command.')}
              </div>
            </div>
          )}
          {ddesc && <div className="zat-summary"><span className="zat-zhlabel">{t('简介:', 'About:')}</span>{ddesc}</div>}
          {detail.topics && detail.topics.length > 0 && <div className="zat-topics">{detail.topics.map((tp) => <span key={tp} className="zat-topic">#{tp}</span>)}</div>}
          {dd
            ? <div className="zat-summary"><span className="zat-zhlabel">{t('README 摘要:', 'README:')}</span>{String(dd.summary || t('该仓库暂无 README 摘要', 'No README summary')).slice(0, 1200)}</div>
            : <div className="zat-status">{t('正在读取 README 简介…', 'Loading README…')}</div>}
          <div className="zat-actions">
            {mainBtn}
            {detail.installed && !detail.isHarness && <button className="zat-btn zat-danger" onClick={() => doUninstall(detail)} disabled={!!installing}>{t('卸载插件', 'Uninstall')}</button>}
            <a className="zat-btn" href={detail.htmlUrl} target="_blank" rel="noreferrer">{t('在 GitHub 查看 ↗', 'View on GitHub ↗')}</a>
          </div>
          {notice && <div className="zat-notice">{notice}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="zat-panel">
      <div className="zat-bar">
        <span className="zat-title">
          {t('插件市场', 'Plugin Market')}
          <small>{total ? `${t('共 ', '')}${total}${t(' 个', '')}` : ''}</small>
        </span>
        {selfUpdate && (
          <button
            className="zat-updbtn"
            title={t('检测到插件市场新版本 v', 'Plugin Market update available v') + (selfUpdate.latestVersion || '')}
            onClick={() => { void pm.selfupdate(true).then((r) => { setNotice(r.ok ? String(r.value.message || '') : r.error.message); if (r.ok && r.value.ok) setSelfUpdate(null) }).catch((err: unknown) => setNotice(String((err as { message?: string })?.message || err))) }}
          >
            ↑ {t('更新 v', 'Update v')}{selfUpdate.latestVersion || ''}
          </button>
        )}
        <div className="zat-search">
          <span>🔍</span>
          <input placeholder={t('输入即搜索…', 'Type to search…')} value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
        </div>
        <select className="zat-sel" value={category} onChange={(e) => setCategory(e.currentTarget.value)} title={t('分类', 'Category')}>
          {CATEGORIES.map((cat) => <option key={cat.label} value={cat.label}>{zh ? cat.label : cat.en}</option>)}
        </select>
        <select className="zat-sel" value={sort} onChange={(e) => setSort(e.currentTarget.value)}>
          <option value="stars">{t('最热门', 'Most stars')}</option>
          <option value="updated">{t('最新更新', 'Recently updated')}</option>
        </select>
        <select className="zat-sel" value={instFilter} onChange={(e) => setInstFilter(e.currentTarget.value as typeof instFilter)} title={t('安装状态', 'Install status')}>
          <option value="all">{t('全部插件', 'All')}</option>
          <option value="installed">{t('已安装', 'Installed')}</option>
          <option value="uninstalled">{t('未安装', 'Not installed')}</option>
          <option value="installable">{t('可安装', 'Installable')}</option>
        </select>
        <span className="zat-count">{t('显示 ', 'Showing ')}{filtered.length}/{items ? items.length : 0}</span>
        <button className="zat-btn" onClick={() => setShowLegend((v) => !v)} title={t('标签颜色说明', 'Badge color guide')}>{t('🏷 图例', '🏷 Legend')}</button>
      </div>
      {showLegend && (
        <div className="zat-legend">
          <span className="zat-lghead">{t('标签说明', 'Badge guide')}:</span>
          <span className="zat-lgi"><i style={{ background: '#10b981' }} />✓ {t('已安装(已启用)', 'Installed (enabled)')}</span>
          <span className="zat-lgi"><i style={{ background: '#0ea5e9' }} />↑ {t('有更新', 'Update available')}</span>
          <span className="zat-lgi"><i style={{ background: '#7a4dff' }} />{t('安装', 'Install')}</span>
          <span className="zat-lgi"><i style={{ background: '#d97706' }} />{t('技能·不可安装', 'Skill · not installable')}</span>
          <span className="zat-lgi"><i style={{ background: '#5a6478' }} />{t('非插件·不可安装', 'Not a plugin · not installable')}</span>
          <span className="zat-lgi"><i style={{ background: '#4f46e5' }} />{t('多插件·装时选择', 'Multi · pick one to install')}</span>
          <span className="zat-lgi"><i style={{ background: '#f0a94b' }} />{t('已装·未启用', 'Installed, disabled')}</span>
          <span className="zat-lgi"><i style={{ background: '#f5b942' }} />★ {t('已星标(点击切换)', 'Starred (click to toggle)')}</span>
        </div>
      )}
      {notice && <div className="zat-notice">{notice}</div>}
      {subChoices && (
        <div className="zat-subchoices">
          <div className="zat-subchoices-title">{t('这个插件包含多个部分,请选择要安装的:', 'This plugin bundles several parts — choose one to install:')}</div>
          {subChoices.packages.map((sub) => (
            <div key={sub.dir} className="zat-subrow">
              <span className="zat-subname">{sub.name}<small>({sub.dir}{sub.version ? ` v${sub.version}` : ''})</small></span>
              <button className="zat-btn zat-primary" onClick={() => doInstallSub(subChoices, sub)} disabled={!!installing}>{installing ? t('处理中…', '...') : t('安装', 'Install')}</button>
            </div>
          ))}
          <button className="zat-btn" onClick={() => setSubChoices(null)}>{t('取消', 'Cancel')}</button>
        </div>
      )}
      <div className="zat-grid" onScroll={onScroll}>
        {error && <div className="zat-status zat-error">⚠ {error}</div>}
        {!items && !error && <div className="zat-status">{t('正在加载插件列表…', 'Loading plugins…')}</div>}
        {items && items.length === 0 && <div className="zat-status">{t('没有找到插件', 'No plugins found')}</div>}
        {items && items.length > 0 && filtered.length === 0 && <div className="zat-status">{t('当前筛选条件下没有插件', 'No plugins match filters')}</div>}
        {filtered.map((it) => (
          <MarketCard key={it.fullName} item={it} zh={zh} t={t} installing={installing === it.fullName} onOpen={openDetail} onAction={cardAction} onStar={onStar} />
        ))}
        {loading && <div className="zat-loading">{t('正在加载…', 'Loading…')}</div>}
      </div>
      <div className="zat-foot">
        <span className="zat-count">
          {profileInfo && profileInfo.profileName ? `${t('当前 profile:', 'Profile: ')}${profileInfo.profileName} · ${profileInfo.profileDir} · ` : ''}
          {t('已加载 ', 'Loaded ')}{items ? items.length : 0} / {total}{t(' · 滚动到底自动加载 · GitHub 搜索上限 1000', ' · scroll to load more · GitHub cap 1000')}
        </span>
        {page * 100 < total && !loading && <button className="zat-btn" onClick={() => load(page + 1, sort, query, category, true)}>{t('加载更多 ↓', 'Load more ↓')}</button>}
      </div>
      <div className="zat-legend">
        <span className="zat-lghead">GitHub Token:</span>
        <input
          className="zat-token"
          type="password"
          placeholder={t('可选,用于一键星标;只保存在本机 profile 目录', 'Optional, for one-click star; stored only in your local profile')}
          value={tokenInput}
          onChange={(e) => setTokenInput(e.currentTarget.value)}
        />
        <button className="zat-btn" onClick={saveToken}>{t('保存', 'Save')}</button>
        <button className="zat-btn" onClick={clearToken}>{t('清除', 'Clear')}</button>
        {hasToken === true && <span className="zat-count">✓ {t('已配置,卡片上的★即当前账号的星标', 'Configured — ★ shows your account stars')}</span>}
      </div>
    </div>
  )
}

interface MarketCardProps {
  item: MarketItem
  zh: boolean
  t: (zh: string, en: string) => string
  installing: boolean
  onOpen: (item: MarketItem) => void
  onAction: (item: MarketItem) => void
  onStar: (item: MarketItem) => void
}

function MarketCard({ item, zh, t, installing, onOpen, onAction, onStar }: MarketCardProps) {
  const [coverErr, setCoverErr] = useState(false)
  const desc = (zh && item.zhIntro) ? item.zhIntro : (item.description || t('暂无简介', 'No description'))
  const hasUpdate = item.installed && item.hasUpdate
  const nonInstallable = item.kind === 'skill' || item.kind === 'nonplugin'
  const btnClass = item.disabled
    ? 'zat-disabled'
    : nonInstallable
      ? (item.kind === 'skill' ? 'zat-noninstall' : 'zat-nonplugin')
      : (hasUpdate ? 'zat-update' : (item.installed ? 'zat-installed' : 'zat-install'))
  const btnText = installing
    ? t('处理中…', '...')
    : item.isHarness
      ? (zh ? '✓ 使用中' : '✓ In use')
      : item.disabled
        ? (zh ? '已装·未启用' : 'Installed, disabled')
        : nonInstallable
          ? (item.kind === 'skill'
            ? (zh ? '技能 · 不可安装' : 'Skill · not installable')
            : (zh ? '非插件 · 不可安装' : 'Not a plugin'))
          : (hasUpdate ? t('更新', 'Update') : (item.installed ? t('已安装', 'Installed') : t('安装', 'Install')))
  return (
    <div className="zat-card" onClick={() => onOpen(item)}>
      <div className="zat-cover">
        {coverErr
          ? <div className="zat-coverfallback">{String(item.name || '?').slice(0, 1).toUpperCase()}</div>
          : <img src={item.cover} loading="lazy" onError={() => setCoverErr(true)} alt={item.name} />}
        {item.kind === 'skill' && <span className="zat-kindbadge zat-kind-skill">{zh ? '技能' : 'Skill'}</span>}
        {item.kind === 'nonplugin' && <span className="zat-kindbadge zat-kind-nonplugin">{zh ? '非插件' : 'Not a plugin'}</span>}
        {item.kind === 'multi' && <span className="zat-kindbadge zat-kind-multi">{zh ? '多插件' : 'Multi'}</span>}
        {hasUpdate
          ? <span className="zat-updbadge">↑ {t('有更新', 'Update')}</span>
          : item.installed
            ? <span className="zat-badge">{item.isHarness ? (zh ? '本机' : 'Local') : `✓ ${t('已安装', 'Installed')}`}</span>
            : null}
        {(zh && item.zhIntro) ? <span className="zat-zhbadge">中文简介</span> : null}
      </div>
      <div className="zat-body">
        <div className="zat-name" title={item.fullName}>{item.name}</div>
        <div className="zat-owner">{item.fullName}</div>
        <div className="zat-desc">{desc}</div>
        <div className="zat-meta">
          <span
            className={'zat-star' + (item.starred ? '' : ' zat-staroff')}
            title={item.starred ? t('已星标,点击取消', 'Starred — click to unstar') : t('点击星标', 'Click to star')}
            onClick={(e) => { e.stopPropagation(); onStar(item) }}
          >
            {item.starred ? '★' : '☆'} {formatStars(item.stars)}
          </span>
          {item.language && <span><span className="zat-dot" style={{ background: LANG_COLORS[item.language] || '#8b949e' }} /> {item.language}</span>}
        </div>
        <button className={`zat-cardbtn ${btnClass}`} onClick={(e) => { e.stopPropagation(); onAction(item) }} disabled={!!installing}>{btnText}</button>
      </div>
    </div>
  )
}

// ── plugin ──────────────────────────────────────────────────────────────

export const inject = ['slots', 'locale', 'remote']

export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const dispose = await (ctx.remote as MarketRemote).$mount({ package: 'zat-dsh-engine', descriptors: marketDescriptors })

  injectCss()

  const slots = ctx.slots as unknown as SlotsFace
  const locale = ctx.locale as unknown as LocaleFace
  // Resolve the mounted namespace after $mount; it is not available as an
  // injectable dependency because this plugin contributes it.
  const pm = ctx.get('remote.pluginMarket') as unknown as MarketRemote['pluginMarket']

  slots.inject('settings.plugins.tab', () => slots.register(
    {
      name: 'settings.plugins.tab',
      id: 'plugin-market',
      order: 20,
      label: () => {
        const snap = locale.getLocale()
        const zh = snap?.active ? isZh(String(snap.active)) : true
        return zh ? '🛒 插件市场' : '🛒 Plugin Market'
      },
      inject: (): MarketPanelProps => ({ pm, locale }),
    },
    MarketPanel,
  ))

  return async () => { await dispose() }
}
