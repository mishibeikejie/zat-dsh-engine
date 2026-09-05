/**
 * Zat-DSH Engine — host half.
 *
 * A Typert Remote service (`pluginMarket` namespace) that powers the browser
 * marketplace: GitHub `dsh-plugin` discovery with a China mirror fallback,
 * bilingual intros (999 pre-translated entries bundled, plus an LLM fallback
 * for new plugins), and one-click install/update/uninstall through the dsh
 * profile's pnpm forwarder.
 *
 * The Gateway discovers the `@Remote`-marked methods at runtime (SRC mode):
 * parameter names are the wire field names, so the client half's descriptors
 * must keep the same names and order.
 */

import type { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
import { defineTool } from '@deepseek-ai/dsh-tools'
import * as yaml from 'js-yaml'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { spawn as nodeSpawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import bundledZh from '../data/zh-intro.json'
import bundledKinds from '../data/kinds.json'
import marketSnapshot from '../data/market-snapshot.json'

/** 内置市场快照条目(短字段压缩体积,生成自 scripts/gen-market-snapshot.mjs)。 */
interface SnapshotEntry {
  f: string; n: string; o: string; d: string; s: number; k: number; l: string
  t: string[]; u: string; h: string; p: string
}

/** Host platform facts (this package is a plain Node ESM module). */
const IS_WIN = process.platform === 'win32'

/**
 * The dsh loader's `cordis.patch.yml` dialect: `!!js` scalars round-trip as
 * `{ __jsExpr }` nodes. We mirror the harness's own `entryListSchema`
 * (JSON_SCHEMA + one `!!js` type) so reading/writing the profile patch layer
 * can never drift from what the include mounts or corrupt a user's `!!js`
 * entries.
 */
function isJsExpr(value: unknown): boolean {
  return value instanceof Object && '__jsExpr' in (value as object)
}
const JS_EXPR_TYPE = new yaml.Type('tag:yaml.org,2002:js', {
  kind: 'scalar',
  resolve: (data) => typeof data === 'string',
  construct: (data) => ({ __jsExpr: data }),
  predicate: isJsExpr as (data: unknown) => boolean,
  represent: (data) => (data as { __jsExpr: string }).__jsExpr,
})
const PATCH_SCHEMA = yaml.JSON_SCHEMA.extend(JS_EXPR_TYPE)

/** Repositories that ARE the DeepSeek Harness itself (never installable). */
const HARNESS_REPOS = ['deepseek-ai/deepseek-harness']

/**
 * Marketplace / plugin-manager plugins. Two of these running at once
 * register conflicting pages and services and crash the Web UI — a
 * beginner trap that has already bricked real profiles. The install gate
 * refuses to install a second one.
 */
const KNOWN_MARKET_REPOS: Record<string, string> = {
  'mishibeikejie/zat-dsh-engine': 'zat-dsh-engine',
  'lx2000wasd/dsh-web-plugin-manager': 'dsh-web-plugin-manager',
  'sanqi-normal/dsh-webui-market-plugin': '@sanqi-normal/dsh-webui-market-plugin',
}

/** Heuristic: does a package/repo name look like a market/manager plugin? */
function isMarketishName(name: string): boolean {
  return /(?:plugin|dsh|harness)[-_ .]*(?:market|manager)|(?:market|manager)[-_ .]*(?:plugin|dsh|harness)/i.test(String(name))
}

/**
 * Behavior-based market detection: plugin-management machinery in the host
 * half (pnpm / dsh plugin / GitHub plugin search) plus a market-style UI in
 * the client half. Names are irrelevant — only what the code does.
 */
function isMarketPluginText(hostText: string, clientText: string): boolean {
  const machinery = /pnpm\s+(?:add|remove|install)|dsh\s+plugin|search\/repositories|topic:dsh-plugin|api\.github\.com/.test(hostText || '')
  const marketUi = /plugin\s*market|marketplace|插件市场|插件商店/i.test(clientText || '') && /slots\.register|settings\./.test(clientText || '')
  return machinery && marketUi
}

/** Names a plugin REGISTERS: host services/provides, client slot registrations. */
function extractRegisteredNames(text: string, side: 'host' | 'client'): Set<string> {
  const names = new Set<string>()
  const src = String(text || '')
  if (side === 'host') {
    const re = /(?:provide|service)\s*\(\s*['"]([^'"]{3,})['"]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src)) !== null) names.add(m[1]!)
  } else {
    // 字符串形式:register('xxx') / slots.register('xxx')。
    const reStr = /register\s*\(\s*['"]([^'"]{3,})['"]/g
    let m: RegExpExecArray | null
    while ((m = reStr.exec(src)) !== null) names.add(m[1]!)
    // 对象形式:register({ ... id: 'xxx' ... })。槽位 item 的 id 是它在那个
    // 槽位里的唯一身份 —— 两个主题如果抢同一个 id,就是"改同一个位置"的冲突。
    const reId = /register\s*\(\s*\{[\s\S]{0,200}?\bid\s*:\s*['"]([^'"]{2,})['"]/g
    while ((m = reId.exec(src)) !== null) names.add(m[1]!)
  }
  return names
}

/** 包有没有会触发 pnpm 构建拦截的脚本(prepare/preinstall/install/postinstall)。 */
function hasBuildScript(scripts?: Record<string, string>): boolean {
  if (!scripts) return false
  return ['prepare', 'preinstall', 'install', 'postinstall'].some((k) => Boolean(scripts[k]))
}

/** 从 pnpm 的 PREPARE_NOT_ALLOWED 报错里抠出要放行的包名(或 pnpm 11 的 包名@spec 完整键)。 */
function extractBuildName(errText: string): string | null {
  // pnpm 11 的 git 托管依赖:报错末尾会给出可直接写进 allowBuilds 的完整键
  //   allowBuilds:
  //     dsh-better-sidebar@https://codeload.github.com/.../tar.gz/<commit>: true
  const m3 = /\n\s{2}([^\n]+?):\s*true\s*\n/.exec(errText)
  if (m3?.[1] && m3[1].includes('@')) return m3[1].trim()
  const m1 = /prepare\s+script of\s+(?:dependency\s+)?["']?([^"'\s,]+)/i.exec(errText)
  if (m1?.[1]) return m1[1].trim()
  // "Ignored build scripts: theme-x, other-pkg."(版本号含点,不能按点截断)
  const m2 = /Ignored build scripts:\s*([^,\r\n]+)/i.exec(errText)
  if (m2?.[1]) {
    const first = m2[1].split(',')[0]!.trim()
    if (first) return first
  }
  // 退路:从 The git-hosted package "name@0.13.1" 里取裸包名(pnpm 11 裸名可能不生效,但聊胜于无)。
  const m4 = /The git-hosted package "([^"@]+)@[^"]*"/i.exec(errText)
  if (m4?.[1]) return m4[1].trim()
  return null
}

/**
 * 发布在 npm 上的 @deepseek-ai 辅助库(不是宿主挂载的核心服务包)。
 * 直接依赖它们可以正常安装;host 核心包(cordis、dsh 系、typert 系)必须走 peer。
 */
const ALLOWED_OFFICIAL_DEPS = new Set(['@deepseek-ai/schemastery', '@deepseek-ai/cosmokit'])

/** 判断一个 @deepseek-ai/* 包是不是宿主核心(必须 peer 引用,不能直接依赖)。 */
function isHostCorePackage(name: string): boolean {
  if (!name.startsWith('@deepseek-ai/')) return false
  if (ALLOWED_OFFICIAL_DEPS.has(name)) return false
  const bare = name.slice('@deepseek-ai/'.length)
  return /^cordis$/i.test(bare) || /^dsh-/.test(bare) || /^typert/.test(bare) || /^invariants$/i.test(bare)
}

/** 从宿主/界面代码里提取"这个插件装完怎么用"的可读提示。 */
function describeUsage(hostText: string, clientText: string): string[] {
  const out: string[] = []
  // 模型工具:defineTool({... name: 'xxx' ...})。
  const tools = new Set<string>()
  const toolRe = /defineTool\s*\(\s*\{[\s\S]{0,300}?name\s*:\s*['"]([^'"]{2,48})['"]/g
  let m: RegExpExecArray | null
  while ((m = toolRe.exec(String(hostText || ''))) !== null) tools.add(m[1]!)
  if (tools.size > 0) out.push(`模型工具:${[...tools].slice(0, 6).join('、')} — 对话里直接说需求,模型会自动调用`)
  // 界面/命令/设置槽位:register('xxx') 或 slots.register('xxx')。
  const regs = extractRegisteredNames(String(clientText || ''), 'client')
  const userFacing = [...regs].filter((r) => /command|settings|slot|conversation|sidebar|toolbar|menu|panel|\.tab/.test(r))
  if (userFacing.length > 0) out.push(`界面/命令:${userFacing.slice(0, 6).join('、')} — 重启后到对应菜单或设置里找`)
  if (out.length === 0) out.push('没检测到工具/界面注册,用法见简介(README)。')
  return out
}

// ── minimal service faces (the real contracts come from the dsh services) ──

interface CollectedStream {
  readFrom(offset: number): { text?: string }
}

interface SpawnHandle {
  done: Promise<{ exitCode: number }>
  collected?: { stdout?: CollectedStream; stderr?: CollectedStream }
}

interface SubprocessFace {
  resolveExecutable(name: string): Promise<string>
  spawn(opts: {
    argv: string[]
    cwd: string
    stdio: { stdin: 'ignore' | { data: string }; stdout: { maxBytes: number }; stderr: { maxBytes: number } }
    graceMs: number
  }): SpawnHandle
}

interface ZhEntry {
  at?: number
  zh?: string
}

interface PluginListItem {
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
  installedVersion?: string | null
  isHarness?: boolean
  /** Installed as a dependency but absent from dsh.profile.bundles (never loads). */
  disabled?: boolean
  /** Repo kind: plugin | nonplugin | multi | skill | unknown. */
  kind?: string
  /** Installed from npm/link with no GitHub repo address (no update/star/detail). */
  noRepo?: boolean
  cover: string
}

interface MarketListResult {
  ok: boolean
  message?: string
  items?: PluginListItem[]
  total?: number
  hasMore?: boolean
  page?: number
  llmUsable?: boolean
  source?: string
}

interface JsonObject {
  [key: string]: unknown
}

/** installedMap 的返回形状(装了什么、是否启用)。 */
type InstalledMap = Record<string, { name: string; spec: string; owner?: string; repo?: string; subdir?: string; enabled: boolean; stars?: number }>

// 列表缓存 24h:仓库列表变化很慢,重启后同查询直接读磁盘缓存(见 plugin-market-list.json),
// 不消耗 GitHub 配额;安装/卸载会主动清缓存,版本更新检测走独立通道不受影响。
const TTL = 24 * 60 * 60 * 1000
const ZH_TTL = 365 * 24 * 60 * 60 * 1000
const MIRROR = 'https://gh-proxy.com/'
const SELF_REPO = 'mishibeikejie/zat-dsh-engine'
const SELF_VERSION = '0.7.1'

const CATEGORY_QUERY: Record<string, string> = {
  '全部': '',
  // GitHub 仓库搜索不支持括号分组和 OR 组合(会 422),所以每个分类只用一个代表关键词。
  '皮肤 / 主题': 'theme',
  '工具 / 终端': 'tool',
  '浏览器 / 自动化': 'browser',
  '技能 Skills': 'skill',
  '视觉 / 多媒体': 'vision',
  '网络 / MCP': 'network',
  '多智能体 / 编排': 'agent',
  '数据 / 存储 / 记忆': 'data',
  '硬件 / 桌面': 'desktop',
  '设计 / 文档': 'design',
  '安全 / 通知': 'security',
}

function encodeQueryPart(s: string): string {
  // Full percent-encoding keeps every character the user types (Chinese,
  // %, &, #, +, …) inside the query value instead of breaking the URL or
  // being parsed as a GitHub query operator. Then neutralize the tokens that
  // make GitHub's search API answer 400/422:
  //  - quotes/backslashes/parentheses → spaces;
  //  - `:` → space, so a qualifier-looking word like `repo:foo` becomes plain text;
  //  - bare OR/AND/NOT (word-boundary, case-insensitive) → space, so a lone
  //    "OR" can't become a trailing boolean operator.
  return encodeURIComponent(
    String(s)
      .replace(/["\\()]/g, ' ')
      .replace(/:/g, ' ')
      .replace(/\b(?:OR|AND|NOT)\b/gi, ' '),
  ).replace(/%20/g, '+')
}

/** Reject anything that is not a plain GitHub owner/repo segment. */
function safeSegment(value: string): string {
  const v = String(value || '').trim()
  return /^[\w.-]+$/.test(v) ? v : ''
}

/** Resolve a repo-relative path against the host entry's directory (POSIX). */
function resolveRel(dir: string, ref: string): string {
  const out: string[] = []
  for (const part of (dir + '/' + ref).split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return out.join('/')
}

/** Extract loader row ids from a patch YAML text (line-based, tolerant). */
function extractPatchIds(yaml: string): Set<string> {
  const ids = new Set<string>()
  for (const rawLine of String(yaml).split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue // comments are not rows
    const m = line.match(/(?:^|\s)id:\s*['"]?([^'"#,\s}]+)/)
    if (m) ids.add(m[1])
  }
  return ids
}

/** True when a simple `^x`/`x`/`x.y`/`x.y.z` range wants a different major than installed. */
function simpleMajorConflict(range: string, installed: string): boolean {
  const m = String(range).trim().match(/^\^?(\d+)(?:\.\d+){0,2}$/)
  if (!m) return false
  const want = Number(m[1])
  const have = Number(String(installed).split('.')[0])
  return Number.isFinite(want) && Number.isFinite(have) && want !== have
}

/**
 * Compare two dotted versions (numeric triple, optional leading v).
 * Returns -1 when a<b, 0 when equal, 1 when a>b. Unparseable versions fall
 * back to numeric-aware string comparison.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (s: string): number[] | null => {
    const m = String(s).trim().replace(/^v/i, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
    if (!m) return null
    return [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)]
  }
  const pa = parse(a)
  const pb = parse(b)
  if (!pa || !pb) return String(a).localeCompare(String(b), undefined, { numeric: true })
  for (let i = 0; i < 3; i++) {
    if (pa[i]! < pb[i]!) return -1
    if (pa[i]! > pb[i]!) return 1
  }
  return 0
}

/**
 * npm `os`/`cpu` field semantics: entries starting with `!` form a blocklist
 * (support everything except these), otherwise the array is an allowlist.
 * An empty/absent field means "no restriction".
 */
export function fieldSupports(field: readonly string[] | undefined, current: string): boolean {
  if (!Array.isArray(field) || field.length === 0) return true
  const negated = field.filter((e) => e.startsWith('!')).map((e) => e.slice(1))
  const allowed = field.filter((e) => !e.startsWith('!'))
  if (negated.length > 0) return !negated.includes(current)
  return allowed.includes(current)
}

/** Subdirectory spec: nested path segments, no traversal, no shell chars. */
function safeSubdir(value: string): string | null {
  const v = String(value || '').trim().replace(/^\/+/, '')
  if (v === '') return ''
  return /^[\w.-]+(?:\/[\w.-]+)*$/.test(v) ? v : null
}

/** npm package name (scoped or bare). */
function safePackageName(value: string): string | null {
  const v = String(value || '').trim()
  return /^@?[\w.-]+(?:\/[\w.-]+)?$/.test(v) ? v : null
}

/** 读取 SKILL.md / 平铺 .md 的 frontmatter `name`;与 dsh 的发现规则一致,必须同时有 name + description。 */
function skillNameFrom(file: string): string | null {
  let text: string
  try { text = readFileSync(file, 'utf8') } catch { return null }
  const m = text.match(/^\uFEFF?---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/)
  if (!m) return null
  const fm = m[1] || ''
  const name = fm.match(/^name:\s*(.+?)\s*$/m)
  const desc = fm.match(/^description:\s*(.+?)\s*$/m)
  if (!name || !desc) return null
  return String(name[1]).replace(/^['"]|['"]$/g, '').trim()
}

/** 扫描一个仓库工作树里的 dsh 技能:顶层 `x/SKILL.md` 目录包,或顶层 `x.md` 平铺技能(跳过 README)。 */
function scanSkills(root: string): Array<{ dir: string; name: string }> {
  const out: Array<{ dir: string; name: string }> = []
  let entries
  try { entries = readdirSync(root, { withFileTypes: true }) } catch { return out }
  for (const e of entries as Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>) {
    if (!safeSkillEntryName(e.name)) continue
    if (e.isDirectory()) {
      const nm = skillNameFrom(join(root, e.name, 'SKILL.md'))
      if (nm) out.push({ dir: e.name, name: nm })
    } else if (e.isFile() && e.name.endsWith('.md') && !/^readme(\.|$)/i.test(e.name)) {
      const nm = skillNameFrom(join(root, e.name))
      if (nm) out.push({ dir: e.name, name: nm })
    }
  }
  return out
}

/** 技能目录/文件名必须是单一安全段(无 / 或 \、不为 . / ..、不以 . 开头),防清单被手改后删到别处。 */
function safeSkillEntryName(v: string): boolean {
  return v.length > 0 && v !== '.' && v !== '..' && !v.includes('/') && !v.includes('\\') && !v.startsWith('.')
}

/** 装前体检的一条结论。 */
interface HealthIssue {
  level: 'error' | 'warn'
  title: string
  detail: string
}

/** 装前体检结果:status = ok | warn | error | unknown | skip。 */
interface HealthResult {
  status: string
  summary: string
  checks: HealthIssue[]
}

/** 单个候选的体检时间上限,超时按 unknown 处理(模型调用不能被网络拖死)。 */
const HEALTH_TIMEOUT_MS = 12000

/** 最多对前几个候选做体检,避免一次工具调用打爆 GitHub 配额。 */
const HEALTH_MAX = 5

/** 常见系统命令不算"外部依赖";其余被 spawn/resolveExecutable 调用的都提示。 */
const COMMON_BINS = new Set(['node', 'npm', 'pnpm', 'yarn', 'npx', 'git', 'cmd', 'powershell', 'pwsh', 'sh', 'bash', 'curl', 'wget', 'tar', 'unzip', '7z', 'python', 'python3'])

// ── 安全扫描(静态) ─────────────────────────────────────────────────────
//
// 前提:DSH 插件是跑在宿主进程里的任意代码,与 dsh 同权限,没有沙箱。
// 静态扫描不能证明一个插件"安全",但能把三种危险摆到明面上:
//   1. 混淆/动态执行 —— 正常插件不这么写;
//   2. 偷凭据/外发数据 —— 读 ~/.ssh、浏览器数据、往粘贴板/机器人钩子发数据;
//   3. 网络去向透明化 —— 装之前先看清楚它到底会连哪些服务器。

/** 知名服务的域名:出现了不报警,只属于"正常业务去向"。 */
const ALLOWED_HOSTS = new Set([
  'github.com', 'api.github.com', 'raw.githubusercontent.com', 'objects.githubusercontent.com', 'githubusercontent.com', 'gh-proxy.com', 'ghfast.top', 'gitee.com',
  'deepseek.com', 'api.deepseek.com', 'platform.deepseek.com', 'chat.deepseek.com', 'status.deepseek.com',
  'openai.com', 'api.openai.com', 'anthropic.com', 'api.anthropic.com', 'claude.ai',
  'openrouter.ai', 'groq.com', 'api.groq.com', 'mistral.ai', 'api.mistral.ai', 'googleapis.com', 'generativelanguage.googleapis.com',
  'huggingface.co', 'hf.co', 'npmjs.com', 'npmjs.org', 'registry.npmjs.org', 'unpkg.com', 'jsdelivr.net', 'cdn.jsdelivr.net',
  'aliyuncs.com', 'aliyun.com', 'dashscope.aliyuncs.com', 'baidu.com', 'aip.baidubce.com', 'qcloud.com', 'tencentcloud.com', 'tencentcloudapi.com',
  'siliconflow.cn', 'api.siliconflow.cn', 'bigmodel.cn', 'open.bigmodel.cn', 'moonshot.cn', 'api.moonshot.cn', 'deepinfra.com', 'api.deepinfra.com',
  'volces.com', 'ark.cn-beijing.volces.com', 'zhipuai.cn', 'open.zhipuai.cn', 'qwen.ai', 'dashscope-intl.aliyuncs.com',
  'localhost', '127.0.0.1', '0.0.0.0', '::1', 'example.com', 'w3.org', 'www.w3.org', 'json-schema.org', 'schemastore.org', 'nodejs.org', 'crates.io', 'pypi.org',
  // 库/文档类噪声域名(react-dom 错误链接、封面图 CDN 等),不构成"网络去向"。
  'githubassets.com', 'opengraph.githubassets.com', 'avatars.githubusercontent.com', 'camo.githubusercontent.com', 'reactjs.org', 'react.dev', 'mozilla.org', 'developer.mozilla.org', 'mdn.io', 'jsfiddle.net', 'codepen.io', 'stackoverflow.com', 'typescriptlang.org',
])

/** 一次性域名/裸 IP/免费可疑顶级域 —— 正常插件不会把数据发到这里。 */
function isSuspiciousHost(host: string): boolean {
  const h = host.toLowerCase()
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)) return true
  if (!h.includes('.')) return true
  const tld = h.split('.').pop() || ''
  if (['tk', 'ml', 'ga', 'cf', 'gq', 'top', 'xyz', 'cc', 'pw', 'click', 'link', 'buzz', 'monster', 'icu', 'lol', 'work', 'rest', 'ru', 'su'].includes(tld)) return true
  return /pastebin|paste\.ee|termbin|0x0\.st|hastebin|requestbin|webhook|ngrok|serveo|localtunnel|trycloudflare|duckdns|nip\.io/i.test(h)
}

/** 收集代码文本里出现的全部外部主机(不含允许名单)。 */
function extractHosts(text: string): string[] {
  const hosts = new Set<string>()
  const re = /https?:\/\/[A-Za-z0-9._-]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    let h = m[0].slice(m[0].indexOf('//') + 2).toLowerCase()
    h = h.replace(/\.+$/, '')
    if (h && !ALLOWED_HOSTS.has(h)) hosts.add(h)
  }
  return [...hosts]
}

/**
 * 对一段插件代码做静态安全扫描。返回的 findings 里 error 级是"几乎不可能是
 * 正常插件"的模式(安装门直接拦截);warn 级是透明度提示(装前人工确认)。
 */
export function scanSecurity(text: string, where: string): HealthIssue[] {
  const out: HealthIssue[] = []
  if (!text) return out
  if (/\beval\s*\(|new\s+Function\s*\(|atob\s*\(|fromCharCode\s*\(\s*(?:\d+\s*,\s*){40,}|Buffer\.from\s*\(\s*['"][A-Za-z0-9+/=]{200,}/i.test(text)) {
    out.push({ level: 'error', title: `${where}包含混淆/动态执行代码`, detail: '检测到 eval/new Function/超长 base64 块。正常插件不会这样写,混淆常用来藏恶意行为,建议不要安装。' })
  }
  // 读取敏感凭据文件:必须落在真实 I/O 调用的参数窗口里才算数。这样既不会
  // 把翻译数据、README 说明里的词误报,也不会命中扫描器自身内置的规则字面量。
  const ioRe = /(?:readFileSync|readFile|createReadStream|openSync|accessSync|statSync|copyFileSync|renameSync|cpSync|rmSync|existsSync|execSync|execFileSync|spawnSync|spawn)\s*\(/g
  const sensPath = /~\/\.(?:ssh|aws)|\.git-credentials|id_rsa|id_ed25519|known_hosts|(?:AppData|Application Support)[^'"\n]{0,40}(?:Chrome|Edge|Firefox|Chromium)/i
  let iom: RegExpExecArray | null
  while ((iom = ioRe.exec(text)) !== null) {
    if (sensPath.test(text.slice(iom.index, iom.index + 200))) {
      out.push({ level: 'error', title: `${where}有读取敏感凭据的痕迹`, detail: '代码在读写文件/执行命令的同时引用了 SSH 私钥、云凭据、浏览器数据等敏感路径;插件功能几乎用不到这些,极可能是偷凭据,建议不要安装。' })
      break
    }
  }
  if (/discord(?:app)?\.com\/api\/webhooks|api\.telegram\.org\/bot|pastebin\.com|paste\.ee|termbin\.com|0x0\.st|hastebin\.com|webhook\.site|requestbin\.com/i.test(text)) {
    out.push({ level: 'error', title: `${where}包含可疑的数据外发地址`, detail: '代码里有消息机器人钩子或匿名粘贴板地址,常被用来把数据静默发走,建议不要安装。' })
  }
  if (/reg\s+(?:add|import)|schtasks\s|netsh\s+firewall|Set-ItemProperty[^;]{0,60}Registry/i.test(text)) {
    out.push({ level: 'warn', title: `${where}会修改系统设置(注册表/计划任务/防火墙)`, detail: '插件一般不需要动系统级配置;装前确认这是它功能的一部分。' })
  }
  const hosts = extractHosts(text)
  // 占位域名(host、x、your-mineru-host 这类)不是外发风险,而是"功能没配好",
  // 降为 warn;裸 IP/可疑顶级域/粘贴板钩子才是 error。
  const placeholders = hosts.filter((h) => !h.includes('.') || /^(?:your|my|example|xxx|test|demo)[-_]/i.test(h))
  const suspicious = hosts.filter((h) => !placeholders.includes(h) && isSuspiciousHost(h))
  if (suspicious.length > 0) {
    out.push({ level: 'error', title: `${where}可疑网络去向:${suspicious.slice(0, 5).join('、')}`, detail: '裸 IP、一次性域名或可疑顶级域,不像正规服务;插件可能把数据发往这里,建议不要安装。' })
  } else if (placeholders.length > 0) {
    out.push({ level: 'warn', title: `${where}有占位/无效域名:${placeholders.slice(0, 5).join('、')}`, detail: '代码里的这个地址是占位符,没有真实域名——说明功能还没配置好,装完不配置就用不了;不是外发风险。' })
  } else if (hosts.length > 0) {
    out.push({ level: 'warn', title: `${where}会连接外部服务:${hosts.slice(0, 10).join('、')}`, detail: '装之前确认这些服务器就是插件功能要用的;数量很多或和功能对不上时要警惕。' })
  }
  return out
}

export class ZatMarketGateway extends TypertRemoteService {
  static inject = ['subprocess']

  private readonly subprocess: SubprocessFace

  private home: string | null = null
  private profileDirValue: string | null = null
  private profileNameValue: string | null = null
  private zhCacheFile: string | null = null
  private cacheDirty = false
  private listCacheFile: string | null = null
  private listCacheLoaded = false
  /** 缓存世代:安装/卸载等变更时 +1,后台刷新/写盘发现世代变了就丢弃,避免旧状态回写。 */
  private cacheEpoch = 0
  private mirrorDown = false
  private directDown = false
  private zhLoaded = false

  private readonly caches = new Map<string, { at: number; data: unknown }>()
  private readonly zhCache = new Map<string, { at: number; zh: string }>()
  /** Repo kind (plugin/nonplugin/multi/skill) merged from bundled data + live scan. */
  private readonly kindCache = new Map<string, string>()
  /** 装前体检结果缓存(20 分钟),模型重复问同一批插件时不重复打网络。 */
  private readonly healthCache = new Map<string, { at: number; data: HealthResult }>()
  /** GitHub 搜索结果缓存(10 分钟),模型连发相近查询时不烧匿名配额。 */
  private readonly searchCache = new Map<string, { at: number; body: string }>()
  /** 每个仓库声明的 os/cpu 支持范围缓存(30 分钟),给卡片打"支持系统"标签。 */
  private readonly osCache = new Map<string, { at: number; os: string[]; cpu: string[] }>()
  /** 市场自己最近报过的错(安装失败/网络/pnpm 等),一键检测会把这些也列出来。 */
  private readonly recentIssues: Array<{ at: number; level: string; title: string; detail: string }> = []
  private kindScanStarted = false

  constructor(ctx: Context) {
    super(ctx, 'pluginMarket')
    this.subprocess = this.ctx.get('subprocess') as unknown as SubprocessFace
    // Agent tool: the model can discover plugins by describing a need, then
    // hand the user an install command — the same data the market uses.
    const tools = this.ctx.get('tools') as unknown as { register(definition: unknown): () => void } | undefined
    if (tools !== undefined) {
      const hostCtx = this.ctx as unknown as { effect(callback: () => (() => void) | void, label?: string): unknown }
      hostCtx.effect(() => {
        const dispose = tools.register(this.buildFindPluginTool())
        return () => dispose()
      }, 'zat-market: find_plugin tool')
    }
  }

  private buildFindPluginTool(): unknown {
    return defineTool({
      name: 'find_plugin',
      description: '在 DeepSeek Harness 插件市场里按需求搜索插件(中文或英文)。返回候选列表:名称、星数、简介、中文简介、是否可直接安装、安装命令,以及每个候选的「装前体检」(health)结果——体检检查入口文件是否真的存在、挂载补丁是否缺失、官方依赖是否写错、peer 依赖本机是否有、安装脚本是否要联网下载、是否依赖外部命令、仓库是否归档/停更,并对宿主和界面代码做安全扫描(混淆/动态执行、读取 SSH/云凭据/浏览器数据、可疑外发地址、外部网络去向清单)。用户描述一个能力需求时调用;用户选定后,用返回的 install 命令安装(装完提示重启 dsh),并建议用户在插件市场里点「一键检测」确认与已装插件没有冲突。重要:体检结果是让你判断"能不能推荐"用的——带 ❌/[error] 硬伤(包括安全问题)的候选,装了大概率用不了或根本不该装,必须把问题如实告诉用户,不要盲目推荐安装。',
      parameters: {
        query: { type: 'string', required: true, description: '能力需求,例如"OCR 截图转文字"或"终端 TUI"。' },
        limit: { type: 'number', description: '最多返回几个候选,1-10,默认 5。' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            items: {
              type: 'array',
              required: true,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  fullName: { type: 'string', required: true },
                  name: { type: 'string', required: true },
                  stars: { type: 'number' },
                  description: { type: 'string' },
                  zhIntro: { type: 'string' },
                  kind: { type: 'string' },
                  installable: { type: 'boolean' },
                  install: { type: 'string' },
                  url: { type: 'string' },
                  health: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      status: { type: 'string', required: true },
                      summary: { type: 'string', required: true },
                      checks: {
                        type: 'array',
                        required: true,
                        items: {
                          type: 'object',
                          additionalProperties: false,
                          properties: {
                            level: { type: 'string', required: true },
                            title: { type: 'string', required: true },
                            detail: { type: 'string', required: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            notice: { type: 'string' },
          },
        },
        render: (_args, value) => {
          const v = value as { items?: Array<Record<string, unknown>>; notice?: string }
          const lines: string[] = []
          for (const [i, it] of (v.items || []).entries()) {
            const zh = it.zhIntro ? ` · ${String(it.zhIntro)}` : ''
            const desc = String(it.description || '') + zh
            lines.push(`${i + 1}. ${String(it.fullName)} — ${Number(it.stars)}★ [${String(it.kind)}]${it.installable ? ' 可安装' : ' 不可直接安装'}`)
            if (desc.trim()) lines.push(`   ${desc.slice(0, 200)}`)
            const health = it.health as { status?: string; summary?: string; checks?: Array<{ level?: string; title?: string; detail?: string }> } | undefined
            const status = health?.status || 'unknown'
            const mark = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : status === 'error' ? '❌' : '❓'
            lines.push(`   体检: ${mark} ${String(health?.summary || '未完成')}`)
            for (const c of health?.checks || []) {
              lines.push(`      [${String(c.level)}] ${String(c.title)} — ${String(c.detail || '').slice(0, 140)}`)
            }
            if (it.installable && typeof it.install === 'string' && String(it.install).trim()) lines.push(`   安装: ${String(it.install)}`)
            else if (it.installable) lines.push('   安装: 多子包仓库,请在插件市场页面里选好子包再装')
            lines.push(`   详情: ${String(it.url)}`)
          }
          if (v.notice) lines.push(String(v.notice))
          return [{ type: 'text', text: lines.join('\n') }]
        },
      },
      isConcurrencySafe: () => true,
      execute: async (args) => {
        const query = String((args as { query?: unknown }).query || '').trim()
        const limitRaw = Number((args as { limit?: unknown }).limit)
        const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(10, Math.floor(limitRaw))) : 5
        if (!query) return { items: [], notice: '需求描述是空的,请说明想要什么功能的插件' }
        const q = 'topic:dsh-plugin+' + encodeQueryPart(query)
        const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=${limit}&page=1`
        const r = await this.ghSearch(url)
        if (r.status !== 200) {
          const why = r.status === 403 || r.status === 429 ? '搜索太频繁被限流,稍后再试。' : r.status === 400 || r.status === 422 ? '搜索词无效,换个说法试试。' : '连不上 GitHub,请开代理或稍后重试。'
          return { items: [], notice: `搜索失败(${r.status})。${why}` }
        }
        let raw: unknown[] = []
        try { raw = (JSON.parse(r.body) as { items?: unknown[] }).items ?? [] } catch { /* keep empty */ }
        let broadUsed = false
        if (raw.length === 0) {
          // 精确 topic 匹配为空时,放宽成全文搜"需求 + dsh-plugin",给没打标签
          // 的仓库一次机会;结果会照常体检,装不上的照样标出来。
          const broad = `https://api.github.com/search/repositories?q=${encodeQueryPart(query)}+dsh-plugin&sort=stars&order=desc&per_page=${limit}&page=1`
          const br = await this.ghSearch(broad)
          if (br.status === 200) {
            try { raw = (JSON.parse(br.body) as { items?: unknown[] }).items ?? [] } catch { /* keep empty */ }
            broadUsed = raw.length > 0
          }
        }
        await this.loadZhCache()
        const picked = raw.slice(0, limit).map((entry) => {
          const it = entry as { full_name?: string; name?: string; stargazers_count?: number; description?: string | null; html_url?: string }
          const fullName = String(it.full_name || '')
          const seg = fullName.split('/')
          return {
            fullName,
            name: String(it.name || fullName),
            owner: safeSegment(seg[0] || ''),
            repo: safeSegment(seg.slice(1).join('/')),
            stars: Number(it.stargazers_count || 0),
            description: String(it.description || ''),
            url: String(it.html_url || `https://github.com/${fullName}`),
          }
        }).filter((it) => it.fullName.toLowerCase() !== SELF_REPO) // 市场自己不作为候选体检
        // 先给 unknown 的候选补一次真实分类(读根 package.json,不行再查子包),
        // 避免把多子包仓库误标成"不可直接安装"。
        await Promise.all(picked.map(async (it) => {
          if (!it.owner || !it.repo) return
          const lower = it.fullName.toLowerCase()
          if (this.kindOf(lower) !== 'unknown') return
          try {
            const kind = await this.detectKind(it.owner, it.repo)
            this.kindCache.set(lower, kind)
          } catch { /* 保持 unknown */ }
        }))
        // 装前体检:最多查前 HEALTH_MAX 个候选,每批 3 个并发,单个 12 秒兜底。
        const healths: HealthResult[] = []
        for (let i = 0; i < picked.length; i += 3) {
          const batch = picked.slice(i, i + 3)
          const results = await Promise.all(batch.map((it, j) => {
            const lower = it.fullName.toLowerCase()
            const cached = this.healthCacheGet(lower)
            if (cached) return cached
            if (!it.owner || !it.repo) {
              const bad: HealthResult = { status: 'skip', summary: '仓库名无法识别,跳过体检', checks: [] }
              return bad
            }
            if (i + j >= HEALTH_MAX) {
              const budget: HealthResult = { status: 'skip', summary: `候选较多,本次只对前 ${HEALTH_MAX} 个做了体检;这个装前没查过,先在插件市场详情页确认`, checks: [] }
              return budget
            }
            const kind = this.kindOf(lower)
            if (kind !== 'plugin' && kind !== 'multi' && kind !== 'client' && kind !== 'unknown') {
              const skip: HealthResult = { status: 'skip', summary: kind === 'skill' ? '技能包:无需代码体检,可在插件市场直接点「安装」装进 skills 目录' : '不是可直接安装的插件,跳过体检', checks: [] }
              return skip
            }
            return this.withHealthTimeout(this.analyzeCandidateHealth(it.owner, it.repo, kind), lower)
          }))
          healths.push(...results)
        }
        const profileName = await this.profileForCommand()
        const items = picked.map((it, i) => {
          const kind = this.kindOf(it.fullName.toLowerCase())
          const cachedZh = this.zhCache.get(it.fullName.toLowerCase())
          const installable = kind === 'plugin' || kind === 'multi' || kind === 'client' || kind === 'skill'
          return {
            fullName: it.fullName,
            name: it.name,
            stars: it.stars,
            description: it.description,
            zhIntro: (cachedZh && cachedZh.zh) || '',
            kind,
            installable,
            install: kind === 'plugin'
              ? `dsh plugin --profile ${profileName} add github:${it.fullName}`
              : kind === 'client'
                ? '在插件市场点「安装」一键装(主题/界面插件,刷新页面生效)'
                : kind === 'skill'
                  ? '在插件市场点「安装」一键装(技能包,装进 ~/.dsh/skills 立即生效)'
                  : '',
            url: it.url,
            health: healths[i]!,
          }
        })
        const risky = items.filter((it) => it.health.status === 'error').length
        const broadPrefix = broadUsed ? '没有打 dsh-plugin 标签的精确匹配,以下是放宽搜索后的结果(可能不是一键式插件,以体检结果为准)。' : ''
        const notice = items.length === 0
          ? (broadUsed ? broadPrefix : '') + '没有找到匹配的插件,换个说法试试'
          : broadPrefix + `找到 ${items.length} 个候选,已对可安装的候选做装前体检。规则:带 ❌/[error] 硬伤的候选装了大概率用不了,别推荐安装,把问题如实告诉用户;带 ⚠️/[warn] 的提醒用户注意;✅ 的可以放心推荐。装完仍建议在插件市场点「一键检测」查与已装插件的冲突。` + (risky > 0 ? ` 本批有 ${risky} 个候选存在硬伤。` : '')
        return { items, notice }
      },
    })
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private shellCwd(): string {
    return IS_WIN ? 'C:\\' : '/'
  }

  /** Spawn one shell command line; returns the live handle for streaming reads. */
  private async spawnShell(command: string, cwd?: string, graceMs = 120000): Promise<SpawnHandle> {
    if (IS_WIN) {
      // Windows:node 直接 spawn 隐藏窗口的 PowerShell。DSH 的 subprocess 服务不透传
      // windowsHide,-WindowStyle Hidden 又会"先建窗再藏"闪一下,所以这里绕开
      // subprocess 服务,用 node:child_process + windowsHide(CREATE_NO_WINDOW)。
      let exe = 'powershell.exe'
      try { exe = await this.subprocess.resolveExecutable('powershell.exe') } catch { /* keep fallback */ }
      return this.nodeSpawnHidden([exe, '-NoProfile', '-NonInteractive', '-Command', command], {
        cwd: cwd || this.shellCwd(),
        graceMs,
        stdoutMax: 8 * 1024 * 1024,
      })
    }
    let sh = '/bin/sh'
    try { sh = await this.subprocess.resolveExecutable('sh') } catch { /* keep fallback */ }
    return this.subprocess.spawn({
      argv: [sh, '-c', command],
      cwd: cwd || this.shellCwd(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 8 * 1024 * 1024 }, stderr: { maxBytes: 1024 * 1024 } },
      graceMs,
    })
  }

  /**
   * Windows 下把控制台程序(curl/wget/git)包进隐藏窗口的 PowerShell 再 spawn:
   * DSH 进程没有控制台,直接 spawn curl.exe 这类控制台程序会为每个请求开一个
   * 全新可见的黑窗(用户反馈"打开市场疯狂弹窗",根因就是这些直连 spawn)。
   * 包进 -WindowStyle Hidden 的 PowerShell 后,子进程挂到父进程的隐藏控制台上,
   * 不再弹窗;DSH 的 subprocess 不透传 windowsHide,只能靠这个 argv 方案。
   * 非 Windows 平台原样透传。
   */
  private async winHiddenSpawn(argv: string[], opts: { cwd?: string; graceMs?: number; stdoutMax?: number; stderrMax?: number; stdin?: string } = {}): Promise<SpawnHandle> {
    const cwd = opts.cwd || this.shellCwd()
    const stdio = {
      stdin: opts.stdin !== undefined ? { data: opts.stdin } : ('ignore' as const),
      stdout: { maxBytes: opts.stdoutMax || 16 * 1024 * 1024 },
      stderr: { maxBytes: opts.stderrMax || 1024 * 1024 },
    }
    if (!IS_WIN) {
      return this.subprocess.spawn({ argv, cwd, stdio, graceMs: opts.graceMs || 60000 })
    }
    // Windows:直接 node spawn + windowsHide,进程不创建任何控制台窗口——
    // 这是唯一彻底不闪窗的办法(-WindowStyle Hidden 会先闪一下再藏)。
    return this.nodeSpawnHidden(argv, opts)
  }

  /** 启动器内置工具链目录(存在才返回,拼进子进程 PATH):%TEMP%\zat-tools 与 %TEMP%\zat-tools\git\cmd。 */
  private launcherToolPathPrefix(): string {
    const sep = IS_WIN ? ';' : ':'
    const parts: string[] = []
    if (process.env.TEMP) {
      const zt = join(process.env.TEMP, 'zat-tools')
      if (existsSync(zt)) parts.push(zt)
      const ztGit = join(zt, 'git', 'cmd')
      if (existsSync(ztGit)) parts.push(ztGit)
    }
    if (parts.length === 0) return ''
    return parts.join(sep) + sep
  }

  /** node:child_process 直接 spawn(windowsHide=CREATE_NO_WINDOW),句柄形状与 subprocess 服务一致。 */
  private nodeSpawnHidden(argv: string[], opts: { cwd?: string; graceMs?: number; stdoutMax?: number; stderrMax?: number; stdin?: string; onStdout?: (text: string) => void; env?: NodeJS.ProcessEnv } = {}): SpawnHandle {
    // Windows 下把启动器工具链(zat-tools 的 node/npm.cmd/PortableGit)与宿主 node
    // 目录注入子进程 PATH,存在才加:市场不用管机器装没装,装过就用。
    const childEnv: NodeJS.ProcessEnv = opts.env ? { ...opts.env } : { ...process.env }
    if (IS_WIN) {
      childEnv.PATH = this.launcherToolPathPrefix() + dirname(process.execPath) + ';' + (childEnv.PATH || '')
    }
    const child = nodeSpawn(argv[0]!, argv.slice(1), {
      cwd: opts.cwd || this.shellCwd(),
      windowsHide: true,
      env: childEnv,
      stdio: [opts.stdin !== undefined ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    })
    if (opts.stdin !== undefined) {
      try { child.stdin!.write(opts.stdin); child.stdin!.end() } catch { /* ignore */ }
    }
    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    let stdoutLen = 0
    let stderrLen = 0
    const stdoutMax = opts.stdoutMax || 16 * 1024 * 1024
    const stderrMax = opts.stderrMax || 1024 * 1024
    child.stdout?.on('data', (d: Buffer) => {
      const room = stdoutMax - stdoutLen
      if (room > 0) { const slice = d.subarray(0, room); stdoutChunks.push(slice); stdoutLen += slice.length }
      if (opts.onStdout) opts.onStdout(d.toString('utf8'))
    })
    child.stderr?.on('data', (d: Buffer) => {
      const room = stderrMax - stderrLen
      if (room > 0) { const slice = d.subarray(0, room); stderrChunks.push(slice); stderrLen += slice.length }
    })
    const done = new Promise<{ exitCode: number }>((resolve) => {
      const timer = setTimeout(() => { try { child.kill() } catch { /* already gone */ } }, opts.graceMs || 60000)
      child.on('close', (code) => { clearTimeout(timer); resolve({ exitCode: code === null ? 1 : code }) })
      child.on('error', () => { clearTimeout(timer); resolve({ exitCode: 1 }) })
    })
    const reader = (chunks: Buffer[]) => ({ readFrom: (offset: number) => ({ text: Buffer.concat(chunks).toString('utf8').slice(offset) }) })
    return { done, collected: { stdout: reader(stdoutChunks), stderr: reader(stderrChunks) } }
  }

  /** Run one shell command line on the host platform. */
  private async runShell(command: string, cwd?: string, graceMs?: number): Promise<{ outcome: { exitCode: number }; stdout: string; stderr: string }> {
    const handle = await this.spawnShell(command, cwd, graceMs)
    const outcome = await handle.done
    let stdout = ''
    let stderr = ''
    if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || ''
    if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || ''
    return { outcome, stdout, stderr }
  }

  /**
   * Classify one repository: plugin (root bundle), nonplugin (root manifest
   * without a bundle), multi (subdirectory bundles), skill (no installable
   * plugin declaration at all).
   */
  private async detectKind(owner: string, repo: string): Promise<string> {
    const rootPkg = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/package.json`)
    if (rootPkg.status === 200) {
      try {
        const meta = JSON.parse(rootPkg.body) as { dsh?: { bundle?: { patch?: string }; client?: unknown } }
        // client-only 主题(只有 dsh.client、没有 dsh.bundle)现在也能一键装(自动写 insert),
        // 单独归一类,让"可安装"筛选把她们算进去。
        return meta.dsh?.bundle?.patch ? 'plugin' : (meta.dsh?.client ? 'client' : 'nonplugin')
      } catch { return 'nonplugin' }
    }
    const sub = await this.subpackages(owner, repo)
    if (sub.ok && Array.isArray(sub.packages) && sub.packages.length > 0) return 'multi'
    return 'skill'
  }

  /** Look up a repo kind: live scan wins, then the bundled snapshot. */
  private kindOf(fullNameLower: string): string {
    const live = this.kindCache.get(fullNameLower)
    if (live !== undefined) return live
    const bundled = (bundledKinds as unknown as Record<string, string>)[fullNameLower]
    if (bundled) {
      this.kindCache.set(fullNameLower, bundled)
      return bundled
    }
    return 'unknown'
  }

  /** Background scan of repos the bundled snapshot does not know yet. */
  private async startKindScan(items: Array<{ owner: string; name: string; fullName: string }>): Promise<void> {
    if (this.kindScanStarted) return
    this.kindScanStarted = true
    const queue = items.filter((it) => this.kindOf(it.fullName.toLowerCase()) === 'unknown')
    if (queue.length === 0) return
    let next = 0
    const worker = async (): Promise<void> => {
      while (next < queue.length) {
        const it = queue[next++]!
        try {
          const kind = await this.detectKind(it.owner, it.name)
          this.kindCache.set(it.fullName.toLowerCase(), kind)
        } catch { /* stays unknown */ }
      }
    }
    const workers: Promise<void>[] = []
    for (let w = 0; w < 4; w++) workers.push(worker())
    void Promise.all(workers)
  }

  /** Write a file directly through node:fs (this package is trusted Node code). */
  private async writeFileText(path: string, content: string): Promise<void> {
    writeFileSync(path, content, 'utf8')
  }

  /** Parse the profile's cordis.patch.yml into a patch-entry array ([] when absent/empty). */
  private async readPatches(): Promise<unknown[]> {
    try {
      const dir = await this.getProfileDir()
      const content = readFileSync(join(dir, 'cordis.patch.yml'), 'utf8')
      const parsed = yaml.load(content, { schema: PATCH_SCHEMA })
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }

  /** Persist a patch-entry array back to cordis.patch.yml (same `!!js` dialect). */
  private async writePatches(patches: unknown[]): Promise<void> {
    const dir = await this.getProfileDir()
    await this.writeFileText(join(dir, 'cordis.patch.yml'), yaml.dump(patches, { schema: PATCH_SCHEMA, noRefs: true }))
  }

  /** Package names currently registered as client-only `insert` rows in the patch layer. */
  private async clientInsertNames(): Promise<Set<string>> {
    const set = new Set<string>()
    for (const patch of await this.readPatches()) {
      if (!patch || typeof patch !== 'object') continue
      const insert = (patch as { insert?: unknown }).insert
      if (!Array.isArray(insert)) continue
      for (const row of insert) {
        if (row && typeof row === 'object' && typeof (row as { name?: unknown }).name === 'string') {
          set.add((row as { name: string }).name)
        }
      }
    }
    return set
  }

  /** True when a package declares `dsh.client` (a client-only surface plugin). */
  private async isClientOnlyPackage(name: string): Promise<boolean> {
    try {
      const dir = await this.getProfileDir()
      const meta = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { dsh?: { client?: unknown; bundle?: { patch?: string } } }
      return Boolean(meta.dsh?.client) && !meta.dsh?.bundle?.patch
    } catch { return false }
  }

  /** Ensure a client-only plugin has an `insert` row (auto-enable); returns true when it was added. */
  private async upsertClientInsert(pkgName: string): Promise<boolean> {
    const names = await this.clientInsertNames()
    if (names.has(pkgName)) return false
    const patches = await this.readPatches()
    patches.push({ insert: [{ id: pkgName, name: pkgName }] })
    await this.writePatches(patches)
    return true
  }

  /** Remove every `insert` row that loads `pkgName`; returns true when anything changed. */
  private async removeClientInsert(pkgName: string): Promise<boolean> {
    const patches = await this.readPatches()
    let changed = false
    for (const patch of patches) {
      if (!patch || typeof patch !== 'object') continue
      const insert = (patch as { insert?: unknown[] }).insert
      if (!Array.isArray(insert)) continue
      const before = insert.length
      ;(patch as { insert: unknown[] }).insert = insert.filter((row) => !(row && typeof row === 'object' && (row as { name?: unknown }).name === pkgName))
      if (insert.length !== before) changed = true
    }
    const cleaned = patches.filter((patch) => {
      if (!patch || typeof patch !== 'object') return true
      const insert = (patch as { insert?: unknown[] }).insert
      const hasOtherKeys = Object.keys(patch as object).some((k) => k !== 'insert')
      // Drop an insert-only patch that became empty; keep patches with other keys.
      if (!Array.isArray(insert)) return true
      if (insert.length === 0 && !hasOtherKeys) return false
      return true
    })
    if (changed || cleaned.length !== patches.length) {
      await this.writePatches(cleaned)
      return true
    }
    return false
  }

  /** 把包名(或 pnpm 11 的 包名@spec 完整键)加进 pnpm-workspace.yaml 的 allowBuilds,让它的构建脚本能跑。幂等。 */
  private async ensureAllowBuilds(name: string): Promise<void> {
    try {
      const dir = await this.getProfileDir()
      const wsPath = join(dir, 'pnpm-workspace.yaml')
      let ws: Record<string, unknown> = {}
      try {
        const parsed = yaml.load(readFileSync(wsPath, 'utf8'), { schema: PATCH_SCHEMA })
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ws = parsed as Record<string, unknown>
      } catch { /* missing/unparsable → start fresh */ }
      // pnpm 10+ 的 allowBuilds 必须是「键 → true」映射,数组写法会被 pnpm 忽略
      // (pnpm 11 对 git 托管依赖还要求完整键 包名@fetch地址)。旧版残留的数组
      // 写法顺手迁移成映射,避免用户之前被写过数组时永远放行失败。
      let allow: Record<string, boolean> = {}
      if (ws.allowBuilds && typeof ws.allowBuilds === 'object' && !Array.isArray(ws.allowBuilds)) {
        allow = ws.allowBuilds as Record<string, boolean>
      } else if (Array.isArray(ws.allowBuilds)) {
        for (const item of ws.allowBuilds as unknown[]) {
          if (typeof item === 'string' && item.trim()) allow[item.trim()] = true
        }
      }
      if (allow[name]) return
      allow[name] = true
      ws.allowBuilds = allow
      await this.writeFileText(wsPath, yaml.dump(ws, { schema: PATCH_SCHEMA, noRefs: true }))
    } catch { /* best effort — 装不上时安装流程会报真正的错 */ }
  }

  /**
   * Quality gate: snapshot the profile manifest files before a mutating
   * operation, restore them when it fails. Keeps the profile bootable.
   */
  private async snapshotProfile(dir: string): Promise<Record<string, string | null>> {
    const files = ['package.json', 'cordis.patch.yml', 'pnpm-lock.yaml']
    const out: Record<string, string | null> = {}
    for (const f of files) {
      try { out[f] = readFileSync(join(dir, f), 'utf8') } catch { out[f] = null }
    }
    return out
  }

  private async restoreProfile(dir: string, snap: Record<string, string | null>): Promise<void> {
    for (const f of Object.keys(snap)) {
      const content = snap[f]
      if (content === null) {
        try { unlinkSync(join(dir, f)) } catch { /* never existed */ }
      } else {
        await this.writeFileText(join(dir, f), content)
      }
    }
  }

  /**
   * Keep a copy of the profile manifest files after every successful
   * mutation. When a later plugin breaks the profile at startup, a beginner
   * can restore this copy in one command — see the README recovery section.
   */
  private async saveLastKnownGood(): Promise<void> {
    try {
      const dir = await this.getProfileDir()
      const backupDir = join(dir, 'zat-backup')
      mkdirSync(backupDir, { recursive: true })
      const snap = await this.snapshotProfile(dir)
      for (const f of Object.keys(snap)) {
        const content = snap[f]
        if (content === null) {
          try { unlinkSync(join(backupDir, f)) } catch { /* keep going */ }
        } else {
          await this.writeFileText(join(backupDir, f), content)
        }
      }
    } catch { /* best effort — never break the main flow */ }
  }

  /**
   * Refuse to install a second marketplace/manager plugin next to an
   * existing one: two of them register conflicting pages and services and
   * take the profile down. Returns a user-facing reason, or null to allow.
   */
  private async checkMarketConflict(owner: string, repo: string): Promise<string | null> {
    const candidateRepo = (owner + '/' + repo).toLowerCase()
    const candidatePkg = KNOWN_MARKET_REPOS[candidateRepo]
    const candidateMarketish = isMarketishName(repo)
    if (!candidatePkg && !candidateMarketish) return null
    try {
      const p = await this.readProfile()
      const inst = await this.installedMap(p)
      // Already installed? Then this is a reinstall / update of an existing
      // pair member — updating it must not be blocked (the pair is not new).
      // installedMap keys aliases of the SAME record under several names;
      // dedupe by object identity so one package counts once.
      for (const rec of new Set(Object.values(inst))) {
        if ((rec.owner + '/' + rec.repo).toLowerCase() === candidateRepo) return null
        if (candidatePkg && rec.name === candidatePkg) return null
      }
      const conflicts: string[] = []
      for (const rec of new Set(Object.values(inst))) {
        const isMarket = KNOWN_MARKET_REPOS[(rec.owner + '/' + rec.repo).toLowerCase()] !== undefined
          || Object.values(KNOWN_MARKET_REPOS).includes(rec.name)
          || isMarketishName(rec.name)
        if (isMarket && !conflicts.includes(rec.name)) conflicts.push(rec.name)
      }
      if (conflicts.length > 0) {
        return `已拦截:装了市场类插件 ${conflicts.join('、')},再装会互相冲突导致 dsh 起不来。想换用请先卸载它。`
      }
      return null
    } catch {
      return null // profile unreadable — let the install fail with its own diagnostics
    }
  }

  // ── background install tasks (progress reporting) ──────────────────────

  private tasks = new Map<string, { step: string; message: string; progress: number; done: boolean; ok?: boolean; result?: JsonObject; subject?: { owner: string; repo: string } }>()
  private taskSeq = 0

  @Remote('taskStatus')
  async taskStatus(taskId: string): Promise<JsonObject> {
    const t = this.tasks.get(String(taskId || ''))
    if (!t) return { ok: false, message: 'task not found' }
    // Build explicitly: undefined property VALUES are rejected by the wire
    // boundary, so optional fields must be omitted until they exist.
    const task: JsonObject = { step: t.step, message: t.message, progress: t.progress, done: t.done }
    if (t.ok !== undefined) task.ok = t.ok
    if (t.result !== undefined) task.result = t.result
    return { ok: true, task }
  }

  private setTaskStep(id: string, step: string, message: string): void {
    const t = this.tasks.get(id)
    if (t) { t.step = step; t.message = message }
  }

  private setTaskProgress(id: string, pct: number, message: string): void {
    const t = this.tasks.get(id)
    if (t) {
      t.progress = Math.max(1, Math.min(99, Math.round(pct)))
      t.message = message
    }
  }

  private finishTask(id: string, result: JsonObject): void {
    const t = this.tasks.get(id)
    if (t) { t.done = true; t.progress = 100; t.ok = Boolean(result.ok); t.result = result }
    // GC: drop finished tasks after 10 minutes.
    setTimeout(() => { this.tasks.delete(id) }, 10 * 60 * 1000)
  }

  private launchTask(work: (id: string) => Promise<JsonObject>, subject?: { owner: string; repo: string }): string {
    const id = 'task-' + (++this.taskSeq)
    this.tasks.set(id, { step: 'start', message: '准备中…', progress: 1, done: false, ...(subject ? { subject } : {}) })
    void work(id).then((result) => this.finishTask(id, result)).catch((err: unknown) => {
      this.finishTask(id, { ok: false, message: String((err as { message?: string })?.message || err) })
    })
    return id
  }

  // ── functional market-plugin detection (code signatures, not a name list) ──

  /** Does this package's own code do plugin-management work? */
  private marketishCache = new Map<string, boolean>()
  private localTextsCache = new Map<string, { hostText: string; clientText: string }>()

  /** Read an installed plugin's host/client texts once, from its declared entries. */
  private async readLocalTexts(name: string): Promise<{ hostText: string; clientText: string }> {
    const hit = this.localTextsCache.get(name)
    if (hit) return hit
    let hostText = ''
    let clientText = ''
    try {
      const dir = await this.getProfileDir()
      const pkgPath = join(dir, 'node_modules', name, 'package.json')
      const meta = JSON.parse(readFileSync(pkgPath, 'utf8')) as { main?: string; exports?: Record<string, string | { default?: string }>; dsh?: { bundle?: { patch?: string } } }
      const candidates = [meta.main]
      const exp = meta.exports || {}
      for (const v of Object.values(exp)) {
        if (typeof v === 'string') candidates.push(v)
        else if (v && typeof v === 'object' && typeof v.default === 'string') candidates.push(v.default)
      }
      candidates.push('lib/host.js', 'lib/index.js', 'dist/index.js', 'lib/client.js', 'dist/client.js')
      for (const rel of candidates) {
        if (!rel || rel.includes('*')) continue
        try {
          const text = readFileSync(join(dir, 'node_modules', name, rel), 'utf8')
          if (/client/i.test(rel)) { clientText += '\n' + text } else { hostText += '\n' + text }
        } catch { /* next */ }
      }
      if (meta.dsh?.bundle?.patch) {
        try { hostText += '\n' + readFileSync(join(dir, 'node_modules', name, meta.dsh.bundle.patch), 'utf8') } catch { /* skip */ }
      }
    } catch { /* unreadable */ }
    const out = { hostText, clientText }
    this.localTextsCache.set(name, out)
    return out
  }

  private async scanLocalMarketish(name: string): Promise<boolean> {
    const hit = this.marketishCache.get(name)
    if (hit !== undefined) return hit
    const texts = await this.readLocalTexts(name)
    const result = isMarketPluginText(texts.hostText, texts.clientText)
    this.marketishCache.set(name, result)
    return result
  }

  private async scanLocalNames(name: string): Promise<{ host: Set<string>; client: Set<string> }> {
    const texts = await this.readLocalTexts(name)
    return { host: extractRegisteredNames(texts.hostText, 'host'), client: extractRegisteredNames(texts.clientText, 'client') }
  }

  /** Fetch a candidate repo's manifest and code files (network, mirror-backed). */
  private async fetchCandidateTexts(owner: string, repo: string, subdir?: string): Promise<{ hostText: string; clientText: string; missingEntries: string[]; meta: { name?: string; main?: string; exports?: Record<string, string | { default?: string }>; dependencies?: Record<string, string>; peerDependencies?: Record<string, string>; os?: string[]; cpu?: string[]; scripts?: Record<string, string>; dsh?: { bundle?: { patch?: string } } } } | null> {
    const base = subdir ? `${subdir}/` : ''
    const pkgRes = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${base}package.json`)
    if (pkgRes.status !== 200) return null
    let meta: { name?: string; main?: string; exports?: Record<string, string | { default?: string }>; dependencies?: Record<string, string>; peerDependencies?: Record<string, string>; os?: string[]; cpu?: string[]; scripts?: Record<string, string>; dsh?: { bundle?: { patch?: string } } } = {}
    try { meta = JSON.parse(pkgRes.body) as typeof meta } catch { return null }
    const declared: string[] = []
    if (typeof meta.main === 'string' && meta.main) declared.push(meta.main)
    for (const v of Object.values(meta.exports || {})) {
      if (typeof v === 'string') declared.push(v)
      else if (v && typeof v === 'object' && typeof v.default === 'string') declared.push(v.default)
    }
    const declaredSet = new Set(declared.filter((r) => r && !r.includes('*') && !r.startsWith('http')))
    const candidates = [...declaredSet, 'lib/host.js', 'lib/index.js', 'dist/index.js', 'lib/client.js', 'dist/client.js']
    let hostText = ''
    let clientText = ''
    const missingEntries: string[] = []
    for (const rel of [...new Set(candidates)]) {
      if (!rel || rel.includes('*') || rel.startsWith('http')) continue
      const r = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${base}${rel}`)
      if (r.status === 200) {
        if (/client/i.test(rel)) { clientText += '\n' + r.body } else { hostText += '\n' + r.body }
      } else if (declaredSet.has(rel)) {
        missingEntries.push(rel.replace(/^\.\//, ''))
      }
    }
    if (meta.dsh?.bundle?.patch) {
      const pr = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${base}${meta.dsh.bundle.patch}`)
      if (pr.status === 200) hostText += '\n' + pr.body
    }
    return { hostText, clientText, missingEntries, meta }
  }

  /** Deep scan of a candidate repo's files (network) — used before pnpm runs. */
  private async analyzeMarketishCandidate(owner: string, repo: string, subdir?: string): Promise<boolean> {
    const f = await this.fetchCandidateTexts(owner, repo, subdir)
    if (!f) return isMarketishName(repo)
    return isMarketPluginText(f.hostText, f.clientText) || isMarketishName(repo)
  }

  private async anyInstalledMarketish(): Promise<string | null> {
    try {
      const p = await this.readProfile()
      const inst = await this.installedMap(p)
      for (const rec of new Set(Object.values(inst))) {
        if (KNOWN_MARKET_REPOS[(rec.owner + '/' + rec.repo).toLowerCase()] !== undefined || Object.values(KNOWN_MARKET_REPOS).includes(rec.name) || isMarketishName(rec.name) || await this.scanLocalMarketish(rec.name)) {
          return rec.name
        }
      }
    } catch { /* best effort */ }
    return null
  }

  /**
   * Roots where a module may actually live: the profile's own node_modules,
   * the `profiles/node_modules` installation fallback (where DSH's own
   * @deepseek-ai packages sit), and every node_modules above ctx.baseUrl
   * (the installation/app layout, e.g. react under apps/web).
   */
  private async resolveModuleRoots(): Promise<string[]> {
    const roots: string[] = []
    try {
      const dir = await this.getProfileDir()
      roots.push(join(dir, 'node_modules'))
      roots.push(join(dirname(dir), 'node_modules'))
    } catch { /* profile dir unknown — installation roots still help */ }
    try {
      const start = this.ctx.baseUrl as string | undefined
      if (start) {
        let current = start
        for (let i = 0; i < 8; i++) {
          roots.push(join(current, 'node_modules'))
          const parent = dirname(current)
          if (parent === current) break
          current = parent
        }
      }
    } catch { /* best effort */ }
    return roots
  }

  private async installedVersionOf(name: string): Promise<string | null> {
    for (const root of await this.resolveModuleRoots()) {
      try {
        const pkg = JSON.parse(readFileSync(join(root, name, 'package.json'), 'utf8')) as { version?: string }
        if (pkg.version) return pkg.version
      } catch { /* next root */ }
    }
    return null
  }

  /** True when a module is reachable through the profile or the installation. */
  private async moduleProvided(name: string): Promise<boolean> {
    try {
      const p = await this.readProfile()
      if (Object.keys((p.dependencies || {}) as Record<string, string>).includes(name)) return true
    } catch { /* fall through to filesystem roots */ }
    return (await this.installedVersionOf(name)) !== null
  }

  /**
   * True when an installed package declares `dsh.bundle.patch` — i.e. it is a
   * profile bundle that may join `dsh.profile.bundles`. A package without that
   * declaration (e.g. a client-only theme) must NEVER be pushed into bundles:
   * the dsh loader reads every bundles entry expecting `dsh.bundle`, and one
   * that lacks it makes dsh refuse to start ("declares no dsh.bundle"). This
   * mirrors the official `dsh plugin` reconcile rule.
   */
  private async isBundlePackage(name: string): Promise<boolean> {
    try {
      const dir = await this.getProfileDir()
      const meta = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { dsh?: { bundle?: { patch?: string } } }
      return Boolean(meta.dsh?.bundle?.patch)
    } catch { return false }
  }

  /** Every loader row id declared by an installed bundle, mapped to its package. */
  private async installedPatchIds(): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    try {
      const dir = await this.getProfileDir()
      const p = await this.readProfile()
      const deps = Object.keys((p.dependencies || {}) as Record<string, string>)
      for (const name of deps) {
        try {
          const meta = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { dsh?: { bundle?: { patch?: string } } }
          if (!meta.dsh?.bundle?.patch) continue
          const ids = extractPatchIds(readFileSync(join(dir, 'node_modules', name, meta.dsh.bundle.patch), 'utf8'))
          for (const id of ids) if (!map.has(id)) map.set(id, name)
        } catch { /* unreadable bundle — skip */ }
      }
    } catch { /* best effort */ }
    return map
  }

  /**
   * npm 最新版探测(带 30 分钟缓存)。多类判断共用:纯 npm 插件的版本检查、
   * "GitHub 仓库只是源码、正式发布走 npm"的安装降级。
   */
  private npmInfoCache = new Map<string, { version: string; repository?: string; at: number }>()
  private async npmLatest(name: string): Promise<{ version: string; repository?: string } | null> {
    const key = name.toLowerCase()
    const hit = this.npmInfoCache.get(key)
    if (hit !== undefined && Date.now() - hit.at < 30 * 60 * 1000) return { version: hit.version, repository: hit.repository }
    let out: { version: string; repository?: string } | null = null
    try {
      const esc = name.startsWith('@') ? name.replace('/', '%2F') : name
      const reg = await this.httpGet(`https://registry.npmjs.org/${esc}`)
      if (reg.status === 200) {
        const j = JSON.parse(reg.body) as {
          'dist-tags'?: { latest?: string }
          versions?: Record<string, { version?: string; repository?: string | { url?: string } }>
        }
        const latest = j['dist-tags']?.latest
        const v = latest ? j.versions?.[latest] : undefined
        if (v && typeof v.version === 'string') {
          const repo = v.repository
          out = { version: v.version, repository: typeof repo === 'string' ? repo : (repo && typeof repo.url === 'string' ? repo.url : undefined) }
        }
      }
    } catch { out = null }
    if (out) this.npmInfoCache.set(key, { version: out.version, repository: out.repository, at: Date.now() })
    return out
  }

  /** 判断 npm 包的 repository 字段是否指向指定 GitHub 仓库(owner/repo)。 */
  private repoPointsToGithub(repoField: string | undefined, owner: string, repo: string): boolean {
    if (!repoField) return false
    const s = String(repoField).trim().toLowerCase()
    if (!s) return false
    const want = `${owner.toLowerCase()}/${repo.toLowerCase()}`
    // npm shorthand: github:owner/repo (可带 .git)
    let m = s.match(/^github:([\w.-]+\/[\w.-]+?)(?:\.git)?$/)
    if (m) return m[1] === want
    // URL / SCP 形式:…(github.com|git@github.com):owner/repo(.git)
    m = s.match(/(?:github\.com[/:]|git@github\.com:)([\w.-]+\/[\w.-]+?)(?:\.git)?(?:[/#?].*)?$/)
    if (m) return m[1] === want
    return false
  }

  /**
   * 判断一个 GitHub 仓库是否"源码仓库、正式发布走 npm":npm 上存在同名包,
   * 且其 repository 指向同一个 owner/repo。命中返回包名与最新版本。
   */
  private async sameSourceNpm(metaName: string | undefined, owner: string, repo: string): Promise<{ name: string; version: string } | null> {
    if (!metaName || !/^(@[\w.-]+\/)?[\w.-]+$/.test(metaName)) return null
    const info = await this.npmLatest(metaName)
    if (!info || !this.repoPointsToGithub(info.repository, owner, repo)) return null
    return { name: metaName, version: info.version }
  }

  /**
   * Pre-install conflict analysis against the candidate repo's manifest and
   * code. Hard problems block the install; soft problems become warnings.
   */
  private async analyzeCandidateConflicts(owner: string, repo: string, subdir?: string): Promise<{ block: string[]; warn: string[]; usage: string[]; name?: string; scripts?: Record<string, string>; npmName?: string }> {
    const block: string[] = []
    const warn: string[] = []
    const f = await this.fetchCandidateTexts(owner, repo, subdir)
    if (!f) return { block, warn, usage: [] }
    const meta = f.meta
    let npmName: string | undefined
    // (0) Declared entry files must exist in the repo — a plugin pointing at
    // uncommitted build artifacts (dist not committed) installs but can never
    // load. BUT: a build script (prepare/preinstall/install/postinstall) can
    // generate those files at install time — such plugins are installable
    // (auto-allowBuilds handles the pnpm block), so only warn. AND: many dsh
    // plugins keep only source on GitHub and publish builds to npm (prepack
    // runs at publish time) — when npm has a same-source package, install
    // from npm instead of blocking.
    if (f.missingEntries.length > 0) {
      if (hasBuildScript(meta.scripts)) {
        warn.push(`入口文件缺失(${f.missingEntries.join('、')}),但声明了构建脚本会在安装时现场生成 — 会自动放行构建脚本,装完重启生效`)
      } else {
        const same = await this.sameSourceNpm(meta.name, owner, repo)
        if (same) {
          npmName = same.name
          warn.push(`GitHub 仓库只是源码(入口 ${f.missingEntries.join('、')} 未提交),npm 已有同源发布 ${same.name}@${same.version} — 将自动改用 npm 官方源安装,效果等同官方 dsh plugin add ${same.name}`)
        } else {
          block.push(`入口文件缺失:${f.missingEntries.join('、')} — 构建产物没提交到仓库,装了也加载不起来`)
        }
      }
    }
    // (1) Host-core official packages must be peers, never direct deps — a
    // direct dep installs a second copy and hijacks the official loader rows.
    // npm-published helper libs (@deepseek-ai/schemastery 等) are fine as deps.
    for (const d of Object.keys(meta.dependencies || {})) {
      if (isHostCorePackage(d)) block.push(`官方包${d}应为peer依赖`)
    }
    // (1b) System/CPU compatibility: a plugin that declares it does not support
    // this OS/arch would break dsh on the next restart — block up front.
    if (!fieldSupports(meta.os, process.platform)) {
      block.push(`不支持当前系统:该插件仅支持 ${(meta.os || []).join('、')},你当前是 ${process.platform},装了 dsh 大概率起不来`)
    }
    if (!fieldSupports(meta.cpu, process.arch)) {
      block.push(`不支持当前 CPU:该插件仅支持 ${(meta.cpu || []).join('、')},你当前是 ${process.arch}`)
    }
    // (2) Loader row id collisions with installed bundles.
    const candIds = extractPatchIds(f.hostText)
    const installedIds = await this.installedPatchIds()
    for (const id of candIds) {
      const holder = installedIds.get(id)
      if (holder && holder !== meta.name) block.push(`挂载行${id}与${holder}重复`)
    }
    // (3) Shared-dependency major-version mismatches (non-official).
    for (const [dep, range] of [...Object.entries(meta.dependencies || {}), ...Object.entries(meta.peerDependencies || {})]) {
      if (dep.startsWith('@deepseek-ai/')) continue
      const installedVer = await this.installedVersionOf(dep)
      if (installedVer && simpleMajorConflict(String(range), installedVer)) {
        warn.push(`依赖 ${dep}:插件要求 ${range},本机已装 v${installedVer},大版本不一致`)
      }
    }
    // (4) Official-package version compatibility: a plugin built against a
    // different DSH major than the installed one usually breaks at runtime.
    for (const [pd, range] of Object.entries(meta.peerDependencies || {})) {
      if (!pd.startsWith('@deepseek-ai/')) continue
      const installedVer = await this.installedVersionOf(pd)
      if (installedVer && simpleMajorConflict(String(range), installedVer)) {
        warn.push(`官方包 ${pd}:插件要求 ${range},本机是 v${installedVer},大版本不一致可能不兼容`)
      }
    }
    // (5) Registered-name collisions: host service/provide names (fatal),
    // client slot registration names (warn — may be intentional sharing).
    const candHost = extractRegisteredNames(f.hostText, 'host')
    const candClient = extractRegisteredNames(f.clientText, 'client')
    try {
      const p = await this.readProfile()
      const bundles = Array.isArray((p.dsh as JsonObject | undefined)?.profile && ((p.dsh as JsonObject).profile as JsonObject).bundles)
        ? ((p.dsh as JsonObject).profile as JsonObject).bundles as string[]
        : []
      for (const dname of Object.keys((p.dependencies || {}) as Record<string, string>)) {
        if (!bundles.includes(dname)) continue // disabled plugins do not load
        const names = await this.scanLocalNames(dname)
        for (const nm of candHost) {
          if (names.host.has(nm)) block.push(`服务名${nm}与${dname}重复注册`)
        }
        for (const nm of candClient) {
          if (names.client.has(nm)) warn.push(`界面注册名${nm}与${dname}重复,可能互相覆盖`)
        }
      }
    } catch { /* best effort */ }
    // (6) 安全扫描是启发式检测,会误伤正经插件(比如"发通知到 Discord/Telegram"
    // 的插件就会命中 webhook/机器人钩子)。所以只提示、不拦截:用户装前能看见,
    // 装不装自己定。真正的硬拦截交给上面的客观项(官方包写错/入口缺失/系统不支持)。
    for (const sec of scanSecurity(f.hostText, '宿主代码')) {
      warn.push(`安全提示:${sec.title}`)
    }
    for (const sec of scanSecurity(f.clientText, '界面代码')) {
      warn.push(`安全提示:${sec.title}`)
    }
    return { block, warn, usage: describeUsage(f.hostText, f.clientText), name: meta.name, scripts: meta.scripts, npmName }
  }

  // ── find_plugin 装前体检 ────────────────────────────────────────────────

  private healthCacheGet(key: string): HealthResult | null {
    const hit = this.healthCache.get(key)
    if (hit && Date.now() - hit.at < 20 * 60 * 1000) return hit.data
    return null
  }

  private healthCacheSet(key: string, data: HealthResult): void {
    this.healthCache.set(key, { at: Date.now(), data })
  }

  /** 给体检加整体超时:网络慢时宁可返回 unknown,也不能拖死模型调用。 */
  private withHealthTimeout(p: Promise<HealthResult>, key: string): Promise<HealthResult> {
    const fallback: HealthResult = { status: 'unknown', summary: '网络较慢,体检没跑完;装之前先在插件市场详情页确认一下', checks: [] }
    return Promise.race([
      p.then((res) => {
        if (res.status !== 'unknown') this.healthCacheSet(key, res)
        return res
      }),
      new Promise<HealthResult>((resolve) => {
        setTimeout(() => resolve(fallback), HEALTH_TIMEOUT_MS)
      }),
    ])
  }

  /**
   * 装前体检:判断一个候选仓库是不是"一装就能用"。只读操作,不发安装命令。
   * 检查:入口文件真实存在、挂载补丁存在、官方包依赖写法、peer 依赖本机
   * 有着落、安装脚本联网下载、宿主代码调用外部程序、仓库归档/停更状态。
   */
  private async analyzeCandidateHealth(owner: string, repo: string, kind: string): Promise<HealthResult> {
    const checks: HealthIssue[] = []
    const base = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`
    try {
      const pkgRes = await this.ghGet(base + 'package.json')
      if (pkgRes.status !== 200) {
        if (kind === 'multi') {
          checks.push({ level: 'warn', title: '根目录没有 package.json', detail: '这是多插件仓库,插件都在子目录里;直接装根仓库会失败,需要在插件市场里选定子包再装。' })
          return { status: 'warn', summary: '多插件仓库:需要先选子包', checks }
        }
        if (kind === 'plugin') {
          checks.push({ level: 'error', title: '读不到 package.json', detail: '仓库标的是插件,但根目录读不到 package.json,按现在的安装方式会装不上。' })
          return { status: 'error', summary: 'package.json 缺失,装不上', checks }
        }
        return { status: 'unknown', summary: '读不到 package.json,无法体检', checks }
      }
      interface CandidateMeta {
        name?: string
        main?: string
        exports?: Record<string, string | { default?: string }>
        dependencies?: Record<string, string>
        peerDependencies?: Record<string, string>
        peerDependenciesMeta?: Record<string, { optional?: boolean }>
        scripts?: Record<string, string>
        os?: string[]
        cpu?: string[]
        dsh?: { bundle?: { patch?: string }; client?: unknown }
      }
      let meta: CandidateMeta
      try {
        meta = JSON.parse(pkgRes.body) as CandidateMeta
      } catch {
        checks.push({ level: 'error', title: 'package.json 不是合法 JSON', detail: 'pnpm/loader 解析会失败,装完直接报错。' })
        return { status: 'error', summary: 'package.json 无法解析', checks }
      }
      if (kind === 'unknown') {
        // 顺手补上仓库分类,后面 installable 判断就准了。
        this.kindCache.set((owner + '/' + repo).toLowerCase(), meta.dsh?.bundle?.patch ? 'plugin' : (meta.dsh?.client ? 'client' : 'nonplugin'))
      }
      const canon = (rel: string): string => rel.replace(/^\.\//, '')
      const entries = new Set<string>()
      if (typeof meta.main === 'string' && meta.main && !meta.main.includes('*') && !meta.main.startsWith('http')) entries.add(canon(meta.main))
      for (const v of Object.values(meta.exports || {})) {
        const rel = typeof v === 'string' ? v : (v && typeof v === 'object' && typeof v.default === 'string' ? v.default : '')
        if (rel && !rel.includes('*') && !rel.startsWith('http')) entries.add(canon(rel))
        if (entries.size >= 2) break
      }
      // 宿主入口优先取 main;没有 main(如 modlens 只有 exports)就取第一个
      // exports 条目,而不是猜一个不存在的 lib/index.js。
      const hostEntry = entries.size > 0 ? [...entries][0]! : 'lib/index.js'
      const wantPatch = meta.dsh?.bundle?.patch || ''
      // 网络探测全部并行:入口文件、挂载补丁、宿主入口、界面入口、仓库元数据。
      const [missingEntries, patchMissing, hostText, clientText, repoMeta] = await Promise.all([
        (async (): Promise<string[]> => {
          const miss: string[] = []
          for (const rel of entries) {
            const er = await this.ghGet(base + rel)
            if (er.status !== 200) miss.push(rel)
          }
          return miss
        })(),
        (async (): Promise<boolean> => {
          if (!wantPatch) return false
          const pr = await this.ghGet(base + wantPatch)
          return pr.status !== 200
        })(),
        (async (): Promise<string> => {
          if (kind !== 'plugin' && kind !== 'unknown') return ''
          const hr = await this.ghGet(base + hostEntry)
          return hr.status === 200 ? hr.body : ''
        })(),
        (async (): Promise<string> => {
          // 界面代码同样要做安全扫描(它会注入浏览器,能碰 token)。
          const clientRel = Object.values(meta.exports || {}).map((v) => typeof v === 'string' ? v : (v && typeof v === 'object' && typeof v.default === 'string' ? v.default : '')).find((rel) => rel && /client/i.test(rel))
          if (!clientRel) return ''
          const cr = await this.ghGet(base + canon(clientRel))
          return cr.status === 200 ? cr.body : ''
        })(),
        (async (): Promise<{ archived?: boolean; disabled?: boolean; fork?: boolean; pushed_at?: string } | null> => {
          const token = await this.resolveConfiguredToken()
          if (!token) return null
          const mr = await this.ghApi('GET', `/repos/${owner}/${repo}`, token)
          if (mr.status !== 200) return null
          try { return JSON.parse(mr.body) as { archived?: boolean; disabled?: boolean; fork?: boolean; pushed_at?: string } } catch { return null }
        })(),
      ])
      if (missingEntries.length > 0) {
        if (hasBuildScript(meta.scripts)) {
          checks.push({ level: 'warn', title: `入口文件缺失:${missingEntries.join('、')}(有构建脚本会现场生成)`, detail: '构建产物没提交到 git,但声明了 prepare/preinstall 等构建脚本,安装时会自动放行构建并生成;若构建失败再重试即可。' })
        } else {
          // GitHub 仓库只放源码、正式发布走 npm 的插件很常见:仓库里没有构建
          // 产物不代表不能用——npm 上有同源发布时,商店会自动改用 npm 源安装。
          const same = await this.sameSourceNpm(meta.name, owner, repo)
          if (same) {
            checks.push({ level: 'warn', title: `GitHub 仓库只是源码(入口 ${missingEntries.join('、')} 未提交),npm 已有同源发布 ${same.name}@${same.version}`, detail: `正式发布在 npm:点「安装」会自动从 npm 官方源安装 ${same.name},效果等同官方 dsh plugin add ${same.name},装完即可加载。` })
          } else {
            checks.push({ level: 'error', title: `入口文件缺失:${missingEntries.join('、')}`, detail: 'package.json 声明的入口在仓库里不存在,且 npm 上也没有同源发布——最常见的原因是构建产物(dist)没有提交到 git。装完 dsh 加载就会报错,插件等于用不了。' })
          }
        }
      }
      if (patchMissing) {
        checks.push({ level: 'error', title: `挂载补丁缺失:${wantPatch}`, detail: 'dsh.bundle.patch 指向的文件不在仓库里,插件装完也不会被挂载,等于没装。' })
      }
      const officialDeps = Object.keys(meta.dependencies || {}).filter((d) => isHostCorePackage(d))
      if (officialDeps.length > 0) {
        checks.push({ level: 'error', title: `官方核心包写进了 dependencies(共 ${officialDeps.length} 个)`, detail: `必须用 peerDependencies 引用:${officialDeps.join('、')}。写成直接依赖会装出第二份拷贝并劫持官方 loader 行,可能让 dsh 起不来。` })
      }
      // 系统/CPU 兼容性:插件用 npm 的 os/cpu 字段声明支持范围,不支持本机就直接标硬伤。
      if (!fieldSupports(meta.os, process.platform)) {
        checks.push({ level: 'error', title: `不支持当前系统:仅支持 ${(meta.os || []).join('、')}`, detail: `这个插件声明了操作系统限制(你当前是 ${process.platform}),装上去大概率起不来或直接报错。` })
      }
      if (!fieldSupports(meta.cpu, process.arch)) {
        checks.push({ level: 'error', title: `不支持当前 CPU:仅支持 ${(meta.cpu || []).join('、')}`, detail: `这个插件声明了 CPU 架构限制(你当前是 ${process.arch}),装上去大概率起不来。` })
      }
      const peers = meta.peerDependencies || {}
      for (const pd of Object.keys(peers)) {
        if (meta.peerDependenciesMeta?.[pd]?.optional) continue
        const range = String(peers[pd])
        if (pd.startsWith('@deepseek-ai/')) {
          const iv = await this.installedVersionOf(pd)
          if (iv && simpleMajorConflict(range, iv)) checks.push({ level: 'warn', title: `官方包 ${pd} 版本可能不兼容`, detail: `插件要求 ${range},本机是 v${iv},大版本不一致时运行可能报错。` })
        } else if (!(await this.moduleProvided(pd))) {
          checks.push({ level: 'warn', title: `需要 peer 依赖 ${pd},本机还没装`, detail: 'profile 默认不自动补装 peer;缺了它,插件运行时大概率直接报错。装完先看「一键检测」提示补什么。' })
        }
      }
      for (const key of ['install', 'postinstall'] as const) {
        const s = String((meta.scripts || {})[key] || '')
        if (s && /curl|wget|Invoke-WebRequest|download|https?:\/\/|node\s+(?:scripts?\/|\.\/scripts)/i.test(s)) {
          checks.push({ level: 'warn', title: `${key} 脚本要从网络下载外部组件`, detail: `安装时会执行「${s.slice(0, 90)}」;网络不稳或没有代理时,安装可能卡住或失败。` })
        }
      }
      if (hostText) {
        const externals = new Set<string>()
        const re = /(?:resolveExecutable|spawn)\s*\(\s*['"]([^'"]{1,40})['"]/g
        let m: RegExpExecArray | null
        while ((m = re.exec(hostText)) !== null) {
          // 归一化:strip 掉 .exe/.cmd/.bat 后缀,避免把 powershell.exe 误报成外部程序。
          const bin = String(m[1] || '').toLowerCase().replace(/\.(?:exe|cmd|bat)$/i, '')
          if (bin && !COMMON_BINS.has(bin)) externals.add(bin)
        }
        if (externals.size > 0) {
          checks.push({ level: 'warn', title: `运行时依赖外部程序:${[...externals].join('、')}`, detail: '这些命令不在 npm 依赖里,需要另外安装配置;没有它们插件装上了,对应功能也用不了。' })
        }
        // 宿主代码引用的相对文件必须真实存在于仓库。modlens 式坑:
        // new URL('../dist/main.js', import.meta.url) 指向没提交的构建产物,
        // 装完后运行时 spawn/import 一个不存在的文件,功能直接失效。
        const refRe = /new URL\(['"]([^'"]+)['"],\s*import\.meta\.url\)|from\s+['"](\.\.?\/[^'"]+)['"]/g
        const refs = new Set<string>()
        let rm: RegExpExecArray | null
        while ((rm = refRe.exec(hostText)) !== null) {
          const ref = String(rm[1] || rm[2] || '')
          if (ref && !ref.startsWith('http') && !ref.includes('*')) refs.add(resolveRel(dirname(hostEntry), ref))
        }
        const missingRefs: string[] = []
        for (const ref of [...refs].slice(0, 3)) {
          const fr = await this.ghGet(base + ref)
          if (fr.status !== 200) missingRefs.push(ref)
        }
        if (missingRefs.length > 0) {
          const engineLike = missingRefs.some((r) => /(?:^|\/)dist\//i.test(r) || /(?:main|cli|engine|server|worker|index)\.(?:m?js|cjs)$/i.test(r))
          checks.push({
            level: engineLike ? 'error' : 'warn',
            title: `宿主代码引用的文件在仓库里不存在:${missingRefs.join('、')}`,
            detail: engineLike
              ? '入口代码引用了没提交到 git 的构建产物(常见 dist/main.js),装完后运行时 spawn/import 一个不存在的文件,插件功能直接失效。'
              : '入口代码引用的资源文件不在仓库里,运行时读取可能报错。',
          })
        }
        // 用户目录配置文件依赖:全新安装的用户没有这个文件时,功能通常用不了。
        const cfgRe = /~\/\.[A-Za-z0-9._-]+/g
        const cfgs = new Set<string>()
        let cm: RegExpExecArray | null
        while ((cm = cfgRe.exec(hostText)) !== null) cfgs.add(cm[0])
        if (cfgs.size > 0) {
          checks.push({ level: 'warn', title: `依赖用户目录配置文件:${[...cfgs].slice(0, 3).join('、')}`, detail: '插件要读用户目录下的配置文件;全新安装时这个文件不存在,功能可能直接失效,需要先按 README 生成配置。' })
        }
      }
      // 安全扫描:启发式检测,只作为"提示"(warn)报给用户,不标 ❌ 硬伤,避免误杀正经插件。
      for (const f of scanSecurity(hostText, '宿主代码')) checks.push(f.level === 'error' ? { level: 'warn', title: f.title, detail: f.detail } : f)
      for (const f of scanSecurity(clientText, '界面代码')) checks.push(f.level === 'error' ? { level: 'warn', title: f.title, detail: f.detail } : f)
      if (repoMeta) {
        if (repoMeta.disabled) checks.push({ level: 'error', title: '仓库已被 GitHub 停用', detail: 'git 安装会直接失败,不要推荐。' })
        if (repoMeta.archived) checks.push({ level: 'error', title: '仓库已归档(archived)', detail: '作者标记不再维护,出了问题不会修。' })
        if (repoMeta.fork) checks.push({ level: 'warn', title: '这是一个 fork 仓库', detail: '上游更新不会自动同步过来;原仓库更活跃的话,优先装原仓库。' })
        const pushed = repoMeta.pushed_at ? Date.parse(repoMeta.pushed_at) : 0
        if (pushed > 0 && Date.now() - pushed > 365 * 24 * 3600 * 1000) checks.push({ level: 'warn', title: '最后更新超过一年', detail: '可能已停止维护,和新版本 dsh 的兼容性没有保障。' })
      }
      const errors = checks.filter((c) => c.level === 'error')
      const warns = checks.filter((c) => c.level === 'warn')
      if (errors.length > 0) return { status: 'error', summary: `${errors.length} 个硬伤:${errors.map((c) => c.title).join(';').slice(0, 140)}`, checks }
      if (warns.length > 0) return { status: 'warn', summary: `${warns.length} 个风险点:${warns.map((c) => c.title).join(';').slice(0, 140)}`, checks }
      return { status: 'ok', summary: '仓库结构、入口、依赖声明正常', checks }
    } catch (err) {
      return { status: 'unknown', summary: `体检异常:${String((err as { message?: string })?.message || err).slice(0, 80)}`, checks }
    }
  }

  /**
   * Probe for the running DeepSeek Harness version by walking up from the
   * config tree's baseUrl and reading the installation package.json.
   * Returns null when the installation cannot be located.
   */
  private harnessVersion(): string | null {
    try {
      const start = this.ctx.baseUrl as string | undefined
      if (!start) return null
      let current = start
      for (let i = 0; i < 8; i++) {
        const pkgPath = join(current, 'package.json')
        if (existsSync(pkgPath)) {
          try {
            const meta = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string; version?: string }
            const name = String(meta.name || '')
            if ((name.startsWith('@deepseek-ai/dsh') || name === 'deepseek-harness') && meta.version) {
              return meta.version
            }
          } catch { /* keep walking */ }
        }
        const parent = dirname(current)
        if (parent === current) break
        current = parent
      }
    } catch { /* best effort */ }
    return null
  }

  /**
   * Run a pnpm command with the user's proxy inherited (Windows reads the
   * system proxy from the registry; Linux inherits HTTP_PROXY naturally).
   * Direct GitHub down → mirror rewrite from the start (no-VPN friendly);
   * otherwise mirror retry only after the direct attempt fails. The mirror
   * rewrite maps github.com URLs onto gh-proxy.com through per-process
   * GIT_CONFIG_* variables, touching no global git configuration.
   * Windows 上直接 node spawn pnpm(windowsHide=CREATE_NO_WINDOW,绝不弹窗),
   * 不再经 PowerShell 包装。
   * When onProgress is given, stdout is streamed to it while pnpm runs.
   */
  private async pnpmShell(command: string, dir: string, onProgress?: (accumulatedStdout: string) => void): Promise<{ outcome: { exitCode: number }; stdout: string; stderr: string }> {
    const body = command.replace(/^pnpm\s+/, '')
    const argvBase = await this.resolvePnpmCommand()
    if (!argvBase) {
      const notFound = IS_WIN
        ? 'pnpm is not recognized as an internal or external command'
        : 'pnpm: command not found'
      return { outcome: { exitCode: 127 }, stdout: '', stderr: notFound }
    }
    const args = body.split(/\s+/).filter(Boolean).map((a) => a.replace(/^["']|["']$/g, ''))
    // nodeSpawnHidden 会在 Windows 上自动把宿主 node 目录与启动器 zat-tools
    // (node/npm.cmd/PortableGit)注入 PATH,这里只需补 npm 镜像源。
    const baseEnv: Record<string, string | undefined> = {
      ...process.env,
      npm_config_registry: 'https://registry.npmmirror.com',
    }
    // 尝试链:① 系统代理+镜像 → ② 清代理+镜像(无 VPN 直连镜像) → ③ 清代理清镜像直连。
    const a1: Record<string, string | undefined> = { ...baseEnv }
    if (IS_WIN) {
      const proxy = await this.loadProxy()
      if (proxy) { a1.HTTPS_PROXY = proxy; a1.HTTP_PROXY = proxy; a1.ALL_PROXY = proxy; a1.NO_PROXY = 'localhost,127.0.0.1' }
    }
    a1.GIT_CONFIG_COUNT = '1'
    a1.GIT_CONFIG_KEY_0 = 'url.https://gh-proxy.com/https://github.com/.insteadOf'
    a1.GIT_CONFIG_VALUE_0 = 'https://github.com/'
    const a2: Record<string, string | undefined> = { ...a1 }
    delete a2.HTTPS_PROXY; delete a2.HTTP_PROXY; delete a2.ALL_PROXY; delete a2.NO_PROXY
    const a3: Record<string, string | undefined> = { ...a2 }
    delete a3.GIT_CONFIG_COUNT; delete a3.GIT_CONFIG_KEY_0; delete a3.GIT_CONFIG_VALUE_0

    let last: { outcome: { exitCode: number }; stdout: string; stderr: string } = { outcome: { exitCode: 127 }, stdout: '', stderr: '' }
    for (const env of [a1, a2, a3]) {
      const childEnvHandle = this.nodeSpawnHidden([...argvBase, ...args], { cwd: dir, graceMs: 10 * 60 * 1000, onStdout: onProgress, env })
      const outcome = await childEnvHandle.done
      let stdout = ''
      let stderr = ''
      if (childEnvHandle.collected?.stdout) stdout = childEnvHandle.collected.stdout.readFrom(0).text || ''
      if (childEnvHandle.collected?.stderr) stderr = childEnvHandle.collected.stderr.readFrom(0).text || ''
      last = { outcome, stdout, stderr }
      if (outcome.exitCode === 0) break
    }
    return last
  }

  /** 解析 pnpm 调用前缀(不含命令参数)。Windows 优先直连可执行文件,绝不产生控制台窗口。 */
  private async resolvePnpmCommand(): Promise<string[] | null> {
    const pathDirs = (process.env.PATH || '').split(IS_WIN ? ';' : ':')
    for (const d of pathDirs) {
      if (!d) continue
      const exe = join(d, 'pnpm.exe')
      if (IS_WIN && existsSync(exe)) return [exe]
      const cmd = join(d, 'pnpm.cmd')
      if (IS_WIN && existsSync(cmd)) {
        const via = this.pnpmFromCmdShim(cmd)
        if (via) return via
      }
      const bare = join(d, 'pnpm')
      if (!IS_WIN && existsSync(bare)) return [bare]
    }
    const cands: string[] = []
    if (process.env.PNPM_MJS) cands.push(process.env.PNPM_MJS)
    cands.push(
      join(process.env.TEMP || '', 'zat-tools', 'pnpm.cjs'),
      join(process.env.TEMP || '', 'zat-tools', 'pnpm.exe'),
      join(process.env.LOCALAPPDATA || '', 'pnpm', 'pnpm.exe'),
      join(process.env.LOCALAPPDATA || '', 'pnpm', 'pnpm.cmd'),
      join(process.env.APPDATA || '', 'npm', 'pnpm.cmd'),
      join(process.env.ProgramFiles || '', 'nodejs', 'pnpm.cmd'),
    )
    for (const c of cands) {
      if (!c || !existsSync(c)) continue
      if (c.endsWith('.cjs') || c.endsWith('.mjs')) return [process.execPath, c]
      if (c.endsWith('.cmd')) {
        const via = this.pnpmFromCmdShim(c)
        if (via) return via
      }
      return [c]
    }
    if (IS_WIN) {
      const corepack = join(dirname(process.execPath), 'corepack.cmd')
      if (existsSync(corepack)) return [corepack, 'pnpm']
    }
    return null
  }

  /** 解析 pnpm.cmd 垫片:优先同目录 pnpm.exe(standalone),否则读垫片里的目标程序。 */
  private pnpmFromCmdShim(cmdPath: string): string[] | null {
    const dir = dirname(cmdPath)
    const exe = join(dir, 'pnpm.exe')
    if (existsSync(exe)) return [exe]
    let text = ''
    try { text = readFileSync(cmdPath, 'utf8') } catch { return null }
    const m = text.match(/"([^"]*pnpm\.(?:cjs|mjs))"/i) || text.match(/"([^"]*pnpm\.exe)"/i)
    if (m) {
      const target = m[1]!.replace(/%~dp0/gi, dir + (IS_WIN ? '\\' : '/')).trim()
      if (target.endsWith('.cjs') || target.endsWith('.mjs')) return [process.execPath, target]
      if (target.endsWith('.exe')) return [target]
    }
    return null
  }

  private async getHome(): Promise<string> {
    if (this.home) return this.home
    const env = process.env.DSH_HOME
    const base = env && env.trim() ? env.trim() : join(process.env.HOME || process.env.USERPROFILE || (IS_WIN ? 'C:\\Users' : '/root'), '.dsh')
    this.home = base
    return this.home
  }

  /**
   * 桌面封装端(如 Deepseek Harness EAC)跑在专属 profile(如 web-desktop)上,
   * 通过环境变量 DSH_DESKTOP_PROFILE 导出其 profile 名(生态惯例,见
   * @sanqi-normal/dsh-webui-market-plugin);原生 CLI/web 不设置它,回退 DSH_PROFILE。
   * 两者取值都做格式校验(防路径穿越/空白)。见 issue #6。
   */
  private envProfileName(): string | null {
    for (const key of ['DSH_DESKTOP_PROFILE', 'DSH_PROFILE']) {
      const v = process.env[key]
      if (v && /^[A-Za-z0-9_-]+$/.test(v.trim())) return v.trim()
    }
    return null
  }

  /** 给用户看的 `dsh plugin --profile <名>` 命令里用的 profile 名;探测失败回退 web,仅影响展示文案。 */
  private async profileForCommand(): Promise<string> {
    try { return await this.getProfileName() } catch { return 'web' }
  }

  private async getProfileName(): Promise<string> {
    if (this.profileNameValue) return this.profileNameValue
    const envProfile = this.envProfileName()
    if (envProfile) {
      this.profileNameValue = envProfile
      return this.profileNameValue
    }
    const h = await this.getHome()
    const dir = join(h, 'profiles')
    let names: string[] = []
    try { names = readdirSync(dir) } catch { names = [] }
    const candidates = names.filter((n) => n !== 'node_modules' && n !== 'plugins')
    // Prefer the shipped web profile when several exist (deterministic).
    const ordered = candidates.includes('web') ? ['web', ...candidates.filter((n) => n !== 'web')] : candidates
    for (const n of ordered) {
      try {
        if (existsSync(join(dir, n, 'package.json'))) {
          this.profileNameValue = n
          break
        }
      } catch { /* next candidate */ }
    }
    if (!this.profileNameValue) throw new Error('no dsh profile found')
    return this.profileNameValue
  }

  private async getProfileDir(): Promise<string> {
    if (this.profileDirValue) return this.profileDirValue
    const h = await this.getHome()
    const p = await this.getProfileName()
    this.profileDirValue = join(h, 'profiles', p)
    return this.profileDirValue
  }

  /** dsh 用户级技能根目录:<DSH_HOME>/skills(dsh-skill-filesystem 的默认 user-dsh 根)。 */
  private async getSkillsDir(): Promise<string> {
    return join(await this.getHome(), 'skills')
  }

  private async skillManifestPath(): Promise<string> {
    return join(await this.getHome(), 'zat-skill-installs.json')
  }

  /** 技能安装清单:owner/repo → 复制进 skills 目录的条目(用于显示已安装 + 一键卸载)。 */
  private async readSkillManifest(): Promise<Record<string, { owner: string; repo: string; dirs: string[]; names: string[]; stars?: number }>> {
    try {
      // 手写/PS 写出来的文件可能带 UTF-8 BOM,JSON.parse 会崩;先剥掉。
      const raw = readFileSync(await this.skillManifestPath(), 'utf8').replace(/^\uFEFF/, '')
      const obj = JSON.parse(raw) as Record<string, unknown>
      const out: Record<string, { owner: string; repo: string; dirs: string[]; names: string[]; stars?: number }> = {}
      for (const [k, v] of Object.entries(obj)) {
        if (!v || typeof v !== 'object') continue
        const e = v as { owner?: unknown; repo?: unknown; dirs?: unknown; names?: unknown; stars?: unknown }
        if (typeof e.owner !== 'string' || typeof e.repo !== 'string') continue
        out[k.toLowerCase()] = {
          owner: e.owner,
          repo: e.repo,
          dirs: Array.isArray(e.dirs) ? e.dirs.filter((d): d is string => typeof d === 'string' && safeSkillEntryName(d)) : [],
          names: Array.isArray(e.names) ? e.names.filter((d): d is string => typeof d === 'string') : [],
          stars: typeof e.stars === 'number' && e.stars > 0 ? e.stars : undefined,
        }
      }
      return out
    } catch { return {} }
  }

  private async writeSkillManifest(manifest: Record<string, { owner: string; repo: string; dirs: string[]; names: string[]; stars?: number }>): Promise<void> {
    try { await this.writeFileText(await this.skillManifestPath(), JSON.stringify(manifest, null, 2)) } catch { /* best effort */ }
  }

  /** 技能(skill)包安装:clone 到临时目录 → 扫描 SKILL.md → 复制进 ~/.dsh/skills(立即生效,无需重启)。 */
  private async installSkillsTask(owner: string, repo: string, taskId: string): Promise<JsonObject> {
    const o = safeSegment(owner)
    const r = safeSegment(repo)
    if (!o || !r) return { ok: false, message: 'invalid repository name' }
    const staging = mkdtempSync(join(await this.getHome(), 'zat-skill-'))
    let lastErr = ''
    try {
      this.setTaskStep(taskId, 'download', `正在下载 ${o}/${r}…`)
      this.setTaskProgress(taskId, 8, `正在下载 ${o}/${r}…(网络慢时可能较久,请稍候)`)
      const cloneDir = join(staging, 'repo')
      const urls = [
        `https://gh-proxy.com/https://github.com/${o}/${r}.git`,
        `https://ghfast.top/https://github.com/${o}/${r}.git`,
        `https://github.com/${o}/${r}.git`,
      ]
      let cloned = false
      for (const u of urls) {
        // lowSpeedLimit/lowSpeedTime:镜像卡死时 10 秒内放弃;graceMs 30s 兜底 DNS/连接也卡的情况。
        // 直接 node spawn git(windowsHide),不经 PowerShell 包装,避免弹窗。
        const handle = await this.winHiddenSpawn(
          ['git', '-c', 'http.lowSpeedLimit=1000', '-c', 'http.lowSpeedTime=10', 'clone', '--depth', '1', '--quiet', u, cloneDir],
          { graceMs: 30000 },
        )
        const outcome = await handle.done
        let errText = ''
        if (handle.collected?.stderr) errText = handle.collected.stderr.readFrom(0).text || ''
        if (handle.collected?.stdout) errText += handle.collected.stdout.readFrom(0).text || ''
        lastErr = errText.trim()
        if (outcome.exitCode === 0) { cloned = true; break }
      }
      if (!cloned) {
        if (/git[^\n]*(?:不是内部或外部命令|无法识别|command not found|is not recognized)/i.test(lastErr)) {
          this.recordIssue('没装 git', '装技能(skill)靠 git clone。解决:装 git(如 winget install Git.Git),再重试。')
          return { ok: false, message: '没装 git。先装 git(如 winget install Git.Git),再重试。' }
        }
        this.recordIssue('技能安装失败', `${o}/${r} 下载失败(网络)。`)
        return { ok: false, message: '下载失败:连不上 GitHub。请换个网络或稍后重试。' }
      }
      this.setTaskStep(taskId, 'verify', '下载完成,正在扫描技能…')
      const skills = scanSkills(cloneDir)
      if (skills.length === 0) {
        return { ok: false, notPlugin: true, kind: 'none', message: '这个仓库里既没有插件声明,也没有可安装的技能(SKILL.md)。它不是 dsh 插件或技能,无法通过市场安装。' }
      }
      const skillsDir = await this.getSkillsDir()
      mkdirSync(skillsDir, { recursive: true })
      const dirs: string[] = []
      const names: string[] = []
      for (const s of skills) {
        rmSync(join(skillsDir, s.dir), { recursive: true, force: true }) // 重复安装 = 覆盖更新
        cpSync(join(cloneDir, s.dir), join(skillsDir, s.dir), { recursive: true })
        dirs.push(s.dir)
        names.push(s.name)
      }
      const manifest = await this.readSkillManifest()
      // 顺手抓一下仓库星数,存进清单,让"已安装"列表里星数不是 0。
      let stars: number | undefined
      try {
        const metaRes = await this.ghGet(`https://api.github.com/repos/${o}/${r}`)
        if (metaRes.status === 200) stars = (JSON.parse(metaRes.body) as { stargazers_count?: number }).stargazers_count
      } catch { /* 抓不到就留空 */ }
      manifest[(o + '/' + r).toLowerCase()] = { owner: o, repo: r, dirs, names, stars }
      await this.writeSkillManifest(manifest)
      this.invalidateListCache()
      this.setTaskProgress(taskId, 97, '安装完成')
      const first = names[0] || ''
      return { ok: true, packageName: o + '/' + r, kind: 'skill', skills: names, message: `已安装技能 ${names.join('、')} — 立即生效(无需重启)。${first ? `用 /${first} 或在对话里让它按技能名调用。` : ''}` }
    } finally {
      rmSync(staging, { recursive: true, force: true })
    }
  }

  /**
   * Read the effective HTTP proxy once. Windows: the system proxy from the
   * registry (what a VPN's system-proxy mode sets); other platforms: the
   * HTTP(S)_PROXY environment the process inherited.
   */
  private proxyUrl: string | null = null
  private proxyLoaded = false
  /** 代理(VPN)断开/失效后置真:后续 httpGet 直接跳过代理,不再每请求傻等它超时。 */
  private proxyDown = false

  private async loadProxy(): Promise<string | null> {
    if (this.proxyLoaded) return this.proxyUrl
    this.proxyLoaded = true
    if (IS_WIN) {
      try {
        const r = await this.runShell("$p=Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -ErrorAction SilentlyContinue; if($p -and $p.ProxyEnable -eq 1 -and $p.ProxyServer){ $s=''+$p.ProxyServer; if($s -notmatch '^https?://'){ $s='http://'+$s }; Write-Output $s }", this.shellCwd())
        this.proxyUrl = (r.stdout || '').trim() || null
      } catch { this.proxyUrl = null }
    } else {
      this.proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || null
    }
    return this.proxyUrl
  }

  /**
   * Fetch one URL with a fallback chain that works without a VPN:
   * 1. curl through the configured proxy (system-proxy VPN mode);
   * 2. curl direct — fixes stale/dead proxy registry entries and networks
   *    that reach GitHub directly;
   * 3. wget direct (some Linux distributions ship only wget);
   * 4. Node's built-in fetch — needs no external tool at all.
   * A definitive HTTP answer (status ≥ 100) stops the chain.
   */
  private async httpGet(url: string): Promise<{ status: number; body: string; error?: string }> {
    let lastError = ''
    const proxy = await this.loadProxy()
    // 代理只在已知可用时才试,而且给短超时(3s):VPN 一断就立刻换直连,不傻等。
    if (proxy && !this.proxyDown) {
      const r = await this.curlGet(url, proxy, '2')
      if (r.status > 0) return r
      this.proxyDown = true // 代理连不通,后续跳过
      lastError = r.error || ''
    }
    const direct = await this.curlGet(url, null, '3')
    if (direct.status > 0) { this.proxyDown = false; return direct } // 直连通了,代理可能又活了
    lastError = direct.error || lastError
    const viaWget = await this.wgetGet(url)
    if (viaWget.status > 0) return viaWget
    lastError = viaWget.error || lastError
    const viaFetch = await this.fetchGet(url)
    if (viaFetch.status > 0) return viaFetch
    return { status: 0, body: '', error: lastError || viaFetch.error || 'all request methods failed' }
  }

  /** One curl attempt; proxy is an explicit --proxy URL or null for direct. */
  private async curlGet(url: string, proxy: string | null, maxTime: string): Promise<{ status: number; body: string; error?: string }> {
    let curl = 'curl'
    try { curl = await this.subprocess.resolveExecutable('curl') } catch { curl = '' }
    if (!curl) return { status: 0, body: '', error: 'curl not available' }
    const argv = [curl, ...(proxy ? ['--proxy', proxy] : []), '-s', '-L', '--max-time', maxTime, '-w', '\n%{http_code}', '-H', 'User-Agent: zat-dsh-engine/0.3.1', url]
    const handle = await this.winHiddenSpawn(argv, { graceMs: 60000 })
    const outcome = await handle.done
    let stdout = ''
    let stderr = ''
    if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || ''
    if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || ''
    if (outcome.exitCode === 0) {
      const lines = String(stdout).trimEnd().split('\n')
      const status = Number(lines.pop())
      if (Number.isFinite(status) && status > 0) return { status, body: lines.join('\n') }
      return { status: 200, body: lines.join('\n') }
    }
    if (stderr.trim()) return { status: 0, body: '', error: stderr.trim().slice(0, 200) }
    return { status: 0, body: '', error: 'curl exited with code ' + outcome.exitCode }
  }

  /** One wget attempt (direct; inherits the environment on non-Windows). */
  private async wgetGet(url: string): Promise<{ status: number; body: string; error?: string }> {
    let wget = 'wget'
    try { wget = await this.subprocess.resolveExecutable('wget') } catch { wget = '' }
    if (!wget) return { status: 0, body: '', error: 'wget not available' }
    const handle = await this.winHiddenSpawn([wget, '-q', '-O-', '--server-response', '--timeout=5', '--max-redirect=5', '-U', 'zat-dsh-engine/0.3.1', url], { graceMs: 60000 })
    const outcome = await handle.done
    let stdout = ''
    let stderr = ''
    if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || ''
    if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || ''
    const statusMatch = stderr.match(/HTTP\/\d(?:\.\d)?\s+(\d{3})/)
    if (statusMatch) return { status: Number(statusMatch[1]), body: stdout }
    if (outcome.exitCode === 0) return { status: 200, body: stdout }
    if (stderr.trim()) return { status: 0, body: '', error: stderr.trim().slice(0, 200) }
    return { status: 0, body: '', error: 'wget exited with code ' + outcome.exitCode }
  }

  /** Node built-in fetch — the final fallback that needs no external tool. */
  private async fetchGet(url: string): Promise<{ status: number; body: string; error?: string }> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      try {
        const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'zat-dsh-engine/0.3.1' } })
        return { status: res.status, body: await res.text() }
      } finally {
        clearTimeout(timer)
      }
    } catch (err) {
      return { status: 0, body: '', error: String((err as { message?: string })?.message || err).slice(0, 200) }
    }
  }

  private async ghGet(url: string): Promise<{ status: number; body: string; error?: string }> {
    let lastError = ''
    // 镜像优先:这台机器直连 GitHub 被墙、VPN 代理又可能"连着但超时",gh-proxy 镜像
    // 是不依赖 VPN 的稳路。直接 curl 镜像(不走那个可能超时的代理),4s 超时,连不通立刻换直连/代理。
    // 注意:只有 200 和 404 才算镜像的"确定答案";502/503/504(网关错误)、403/429
    // (限流/风控)都不是确定答案——直接返回会让自更新检查、列表、详情等静默失败。
    if (!this.mirrorDown) {
      const mr = await this.curlGet(MIRROR + url, null, '4')
      if (mr.status === 200) return mr
      if (mr.status === 404) return mr
      lastError = mr.error || ('mirror status ' + mr.status)
      this.mirrorDown = true
    }
    const r = await this.httpGet(url)
    if (r.status === 200) { this.mirrorDown = false; return r }
    if (r.status >= 400) return r
    return { status: 0, body: '', error: r.error || lastError }
  }

  /**
   * GitHub 搜索优先走 token(配额 5000/h,模型连发查询也扛得住),失败再退回
   * 匿名通道;成功的响应体缓存 10 分钟,相近的重复查询直接命中缓存。
   */
  private async ghSearch(url: string): Promise<{ status: number; body: string; error?: string }> {
    const hit = this.searchCache.get(url)
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) return { status: 200, body: hit.body }
    let r: { status: number; body: string; error?: string } = { status: 0, body: '', error: '' }
    const token = await this.resolveConfiguredToken()
    if (token) {
      const path = url.slice('https://api.github.com'.length)
      r = await this.ghApi('GET', path, token)
    }
    if (r.status !== 200) r = await this.ghGet(url)
    // 匿名配额被限流(403/429)时,直连和 ghGet 都救不了(ghGet 会把 403 当"确定
    // 答案"直接返回);但国内镜像走它自己的认证账号(5000/h),不受用户 IP 的
    // 60/h 限制。这里在限流时补一次镜像,让没登录的用户也能无感继续搜。
    if (r.status === 403 || r.status === 429) {
      const mr = await this.httpGet(MIRROR + url)
      if (mr.status === 200) r = mr
    }
    if (r.status === 200) {
      if (this.searchCache.size > 300) {
        const first = this.searchCache.keys().next().value
        if (first !== undefined) this.searchCache.delete(first)
      }
      this.searchCache.set(url, { at: Date.now(), body: r.body })
    }
    return r
  }

  private async readProfile(): Promise<JsonObject> {
    const dir = await this.getProfileDir()
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as JsonObject
  }

  private async writeProfile(obj: JsonObject): Promise<void> {
    const dir = await this.getProfileDir()
    await this.writeFileText(join(dir, 'package.json'), JSON.stringify(obj, null, 2))
  }

  private async installedMap(p: JsonObject): Promise<InstalledMap> {
    const map: InstalledMap = {}
    const deps = (p.dependencies || {}) as Record<string, string>
    // A plugin is loaded when it is a bundle listed in dsh.profile.bundles, OR
    // a client-only surface registered as an `insert` row in cordis.patch.yml.
    // A dependency in neither installs but never activates.
    const bundles: string[] = Array.isArray((p.dsh as JsonObject | undefined)?.profile && ((p.dsh as JsonObject).profile as JsonObject).bundles)
      ? ((p.dsh as JsonObject).profile as JsonObject).bundles as string[]
      : []
    const clientInserts = await this.clientInsertNames()
    for (const key of Object.keys(deps)) {
      const spec = String(deps[key] || '')
      const rec: InstalledMap[string] = { name: key, spec, enabled: bundles.includes(key) || clientInserts.has(key) }
      map[key.toLowerCase()] = rec
      const bare = key.replace(/^@[\w.-]+\//, '')
      if (!map[bare.toLowerCase()]) map[bare.toLowerCase()] = rec
      const gitMatch = spec.match(/(?:github\.com[\/:]|github:|git@github\.com:)([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[#/].*)?$/i)
      if (gitMatch) {
        rec.owner = gitMatch[1]
        rec.repo = gitMatch[2]
        const pathMatch = spec.match(/#(?:[^&]*&)?path:([^&]+)/)
        if (pathMatch) rec.subdir = decodeURIComponent(pathMatch[1]).replace(/^\/+/, '')
        map[(gitMatch[1] + '/' + gitMatch[2]).toLowerCase()] = rec
      }
    }
    // 技能(skill)不算 cordis 插件,不写进 dependencies/bundles;用清单文件记录,让
    // 列表和"已安装"筛选能把它们当成已安装,并支持一键卸载。
    const skillManifest = await this.readSkillManifest()
    for (const key of Object.keys(skillManifest)) {
      const entry = skillManifest[key]!
      if (entry.dirs.length === 0) continue
      map[key.toLowerCase()] = { name: entry.owner + '/' + entry.repo, spec: 'skill:' + key, owner: entry.owner, repo: entry.repo, enabled: true, stars: entry.stars }
    }
    return map
  }

  private cacheGet(key: string): unknown {
    const c = this.caches.get(key)
    if (c && Date.now() - c.at < TTL) return c.data
    return null
  }

  private cacheSet(key: string, data: unknown): void {
    this.caches.set(key, { at: Date.now(), data })
  }

  /** Mutating operations must drop stale list snapshots or cards show outdated install state. */
  private invalidateListCache(): void {
    this.caches.clear()
    this.cacheEpoch++ // 让后台刷新/未完成的写盘丢弃过期结果
    // 内存缓存清掉的同时删掉磁盘缓存:重启后也不会读到"已安装/已卸载"的旧状态。
    if (this.listCacheFile) {
      try { unlinkSync(this.listCacheFile) } catch { /* 文件不存在 */ }
    }
  }

  /** 列表缓存持久化到 profile 目录:重启后同查询直接读磁盘,不再消耗 GitHub 配额。 */
  private async loadListCache(): Promise<void> {
    if (this.listCacheLoaded) return
    this.listCacheLoaded = true
    try {
      const dir = await this.getProfileDir()
      this.listCacheFile = join(dir, 'plugin-market-list.json')
    } catch { return }
    try {
      const raw = readFileSync(this.listCacheFile, 'utf8')
      const obj = JSON.parse(raw) as Record<string, { at?: number; data?: unknown }>
      for (const [k, v] of Object.entries(obj)) {
        if (v && typeof v === 'object' && typeof v.at === 'number' && 'data' in v) {
          this.caches.set(k, { at: v.at, data: v.data })
        }
      }
    } catch { /* 文件不存在或损坏 → 忽略,重新拉取 */ }
  }

  /** 把当前列表缓存写回磁盘(小文件,调用频率低,直接写)。epoch 变化(安装/卸载清过缓存)就放弃。 */
  private async saveListCache(epoch?: number): Promise<void> {
    if (!this.listCacheFile) return
    try {
      const obj: Record<string, { at: number; data: unknown }> = {}
      for (const [k, v] of this.caches) obj[k] = { at: v.at, data: v.data }
      if (epoch !== undefined && epoch !== this.cacheEpoch) return
      await this.writeFileText(this.listCacheFile, JSON.stringify(obj))
    } catch { /* best effort */ }
  }

  private async loadZhCache(): Promise<void> {
    if (this.zhLoaded) return
    this.zhLoaded = true
    // Baseline: bundled pre-translated intros (999 entries). The data file
    // uses `{ "owner/repo": "中文简介" }` string values; the user-local cache
    // uses `{ at, zh }` objects. Accept both shapes.
    const bundled = bundledZh as unknown as Record<string, ZhEntry | string>
    for (const key of Object.keys(bundled)) {
      const v = bundled[key]
      if (typeof v === 'string' && v.trim()) {
        this.zhCache.set(key.toLowerCase(), { at: Date.now(), zh: v.trim() })
      } else if (v && typeof v === 'object' && v.zh) {
        this.zhCache.set(key.toLowerCase(), { at: v.at || 0, zh: v.zh })
      }
    }
    // Increments: the user's local cache written by earlier translations.
    try {
      const dir = await this.getProfileDir()
      this.zhCacheFile = join(dir, 'plugin-market-zh.json')
      const raw = readFileSync(this.zhCacheFile, 'utf8')
      const data = JSON.parse(String(raw).replace(/^\uFEFF/, '')) as Record<string, ZhEntry | string>
      for (const key of Object.keys(data)) {
        const v = data[key]
        if (typeof v === 'string' && v.trim()) {
          this.zhCache.set(key.toLowerCase(), { at: Date.now(), zh: v.trim() })
        } else if (v && typeof v === 'object' && v.zh) {
          this.zhCache.set(key.toLowerCase(), { at: v.at || 0, zh: v.zh })
        }
      }
    } catch { this.zhCacheFile = null }
  }

  private async saveZhCache(): Promise<void> {
    if (!this.zhCacheFile || !this.cacheDirty) return
    this.cacheDirty = false
    try {
      const obj: Record<string, ZhEntry> = {}
      for (const [k, v] of this.zhCache) obj[k] = { at: v.at, zh: v.zh }
      await this.writeFileText(this.zhCacheFile, JSON.stringify(obj))
    } catch { /* cache write is best-effort */ }
  }

  private async remoteVersion(owner: string, repo: string, subdir?: string): Promise<string | null> {
    const path = subdir ? `${subdir}/package.json` : 'package.json'
    const r = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`)
    if (r.status !== 200) return null
    try { return (JSON.parse(r.body) as { version?: string }).version || null } catch { return null }
  }

  private async localVersion(name: string): Promise<string | null> {
    try {
      const dir = await this.getProfileDir()
      return (JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { version?: string }).version || null
    } catch { return null }
  }

  /** gh-proxy mirror URL for a `github:owner/repo` spec, preserving the `#path:` subdir. */
  private mirrorSpecFor(spec: string): string | null {
    const m = String(spec).match(/^github:([\w.-]+)\/([\w.-]+?)(#.*)?$/i)
    if (!m) return null
    return `https://gh-proxy.com/https://github.com/${m[1]}/${m[2]}.git${m[3] || ''}`
  }

  /** All mirror install specs (gh-proxy, then ghfast.top) for a github spec. */
  private mirrorSpecs(spec: string): string[] {
    const m = String(spec).match(/^github:([\w.-]+)\/([\w.-]+?)(#.*)?$/i)
    if (!m) return []
    const out: string[] = []
    for (const host of ['https://gh-proxy.com/', 'https://ghfast.top/']) {
      out.push(`${host}https://github.com/${m[1]}/${m[2]}.git${m[3] || ''}`)
    }
    return out
  }

  /** 记录市场自己报过的错(24h 内),一键检测会把这些也一起列出来。 */
  private recordIssue(title: string, detail: string, level = 'error'): void {
    const now = Date.now()
    while (this.recentIssues.length && now - this.recentIssues[0]!.at > 24 * 3600 * 1000) this.recentIssues.shift()
    if (!this.recentIssues.some((i) => i.title === title)) this.recentIssues.push({ at: now, level, title, detail })
    while (this.recentIssues.length > 30) this.recentIssues.shift()
  }

  private async addSpec(owner: string, repo: string, subdir?: string, taskId?: string, preAnalysis?: { block: string[]; warn: string[]; name?: string; scripts?: Record<string, string>; npmName?: string }): Promise<{ ok: boolean; packageName: string | null; message?: string; warning?: string; installedAsDisabled?: boolean; hotReload?: boolean }> {
    const o = safeSegment(owner)
    const repoName = safeSegment(repo)
    const s = subdir === undefined ? undefined : safeSubdir(subdir)
    if (!o || !repoName || s === null) return { ok: false, packageName: null, message: 'invalid repository name or subdirectory' }
    const dir = await this.getProfileDir()
    const gate = await this.checkMarketConflict(o, repoName)
    if (gate) return { ok: false, packageName: null, message: gate }
    const analysis = preAnalysis || await this.analyzeCandidateConflicts(o, repoName, s || undefined)
    if (analysis.block.length > 0) {
      return { ok: false, packageName: null, message: `安装已拦截:${analysis.block.join(';')}。确要强制安装请用官方命令。` }
    }
    // GitHub 仓库只是源码、npm 有同源发布:改用 npm 官方源安装(效果等同
    // 官方 dsh plugin add <name>),npm 包自带构建产物,装完即可加载。
    const npmSource = analysis.npmName || null
    const warnings = analysis.warn.length > 0 ? analysis.warn.join('; ') : undefined
    this.invalidateListCache()
    const snap = await this.snapshotProfile(dir)
    // 带构建脚本的 git 插件会被 pnpm 默认拦掉:先把包名放进 allowBuilds,争取一次装成。
    if (analysis.name && hasBuildScript(analysis.scripts)) {
      await this.ensureAllowBuilds(analysis.name)
    }
    if (taskId) {
      this.setTaskStep(taskId, 'download', npmSource ? `正在从 npm 下载 ${npmSource}…` : '正在下载安装包…')
      this.setTaskProgress(taskId, 12, npmSource ? `正在从 npm 下载 ${npmSource}…(已进行 0 秒)` : '正在下载安装包…(已进行 0 秒)')
    }
    const startedAt = Date.now()
    const progress = taskId ? (text: string) => {
      // Surface pnpm's own progress line ("Progress: resolved X, downloaded Y…")
      const lines = String(text).split(/\r?\n/).filter(Boolean)
      let counts = ''
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]!
        if (line.includes('Progress:')) { counts = line.slice(line.indexOf('Progress:')).trim().slice(0, 70); break }
      }
      const secs = Math.floor((Date.now() - startedAt) / 1000)
      const pct = Math.min(82, 12 + secs * 2)
      this.setTaskProgress(taskId, pct, `${npmSource ? `正在从 npm 下载 ${npmSource}` : '正在下载安装包'}…(已进行 ${secs} 秒)${counts ? ' · ' + counts : ''}`)
    } : undefined
    if (npmSource) {
      // npm 源不需要 github 镜像链:一条 pnpm add <name> 直装(npm registry
      // 走 pnpm 自己的镜像配置,不用改环境)。registry 包带构建脚本时同样
      // 会被 pnpm 的 allowBuilds 拦,失败就提取键重试(最多 3 轮)。
      let npmResult = await this.pnpmShell('pnpm add ' + npmSource, dir, progress)
      if (npmResult.outcome.exitCode !== 0) {
        for (let round = 0; round < 3 && npmResult.outcome.exitCode !== 0; round++) {
          const firstErr = String(npmResult.stderr || npmResult.stdout || '')
          if (!/PREPARE_NOT_ALLOWED|allowBuilds|build script/i.test(firstErr)) break
          const allowedName = extractBuildName(firstErr) || npmSource || null
          if (!allowedName) break
          await this.restoreProfile(dir, snap)
          await this.ensureAllowBuilds(allowedName)
          npmResult = await this.pnpmShell('pnpm add ' + npmSource, dir, progress)
        }
      }
      if (npmResult.outcome.exitCode !== 0) {
        await this.restoreProfile(dir, snap)
        const errText = String(npmResult.stderr || npmResult.stdout || '')
        this.recordIssue('npm 安装失败', errText.trim().split(/\r?\n/).filter(Boolean).pop() || errText)
        return { ok: false, packageName: null, message: `从 npm 安装 ${npmSource} 失败(已还原)。${(errText.trim().split(/\r?\n/).filter(Boolean).pop() || '').slice(-160)}` }
      }
    } else {
      // 默认走官方 GitHub(开 VPN/代理的用户走官方渠道);已知直连不通时优先镜像;
      // 直连失败再依次尝试两个国内镜像,让没 VPN 的用户也能装。
      const spec = s ? `github:${o}/${repoName}#path:${s}` : 'github:' + o + '/' + repoName
      const candidates = this.directDown ? [...this.mirrorSpecs(spec), spec] : [spec, ...this.mirrorSpecs(spec)]
      let pnpmResult = await this.pnpmShell('pnpm add ' + candidates[0]!, dir, progress)
      for (let i = 1; i < candidates.length && pnpmResult.outcome.exitCode !== 0; i++) {
        const alt = await this.pnpmShell('pnpm add ' + candidates[i]!, dir, progress)
        if (alt.outcome.exitCode === 0) pnpmResult = alt
      }
      // 构建脚本被拦(PREPARE_NOT_ALLOWED):自动把包名/完整键写进 allowBuilds 再重试。
      // pnpm 11 对 git 依赖每次解析可能换路由(codeload tarball / git+clone),报错里
      // 的 allowBuilds 键会跟着变,所以循环处理:每轮从最新报错提取键并累计写入,最多 3 轮。
      if (pnpmResult.outcome.exitCode !== 0) {
        for (let round = 0; round < 3 && pnpmResult.outcome.exitCode !== 0; round++) {
          const firstErr = String(pnpmResult.stderr || pnpmResult.stdout || '')
          if (!/PREPARE_NOT_ALLOWED|allowBuilds|build script/i.test(firstErr)) break
          const allowedName = extractBuildName(firstErr) || analysis.name || null
          if (!allowedName) break
          await this.restoreProfile(dir, snap)
          await this.ensureAllowBuilds(allowedName)
          pnpmResult = await this.pnpmShell('pnpm add ' + candidates[0]!, dir, progress)
          for (let i = 1; i < candidates.length && pnpmResult.outcome.exitCode !== 0; i++) {
            const alt = await this.pnpmShell('pnpm add ' + candidates[i]!, dir, progress)
            if (alt.outcome.exitCode === 0) pnpmResult = alt
          }
        }
      }
      if (pnpmResult.outcome.exitCode !== 0) {
        await this.restoreProfile(dir, snap)
        const errText = String(pnpmResult.stderr || pnpmResult.stdout || '')
        if (/pnpm[^\n]*(?:不是内部或外部命令|无法识别|command not found|is not recognized)|corepack[^\n]*(?:不是内部或外部命令|无法识别|command not found|is not recognized)/i.test(errText)) {
          this.recordIssue('没装 pnpm', '装/更新插件都靠它。解决:终端跑 corepack enable(或 npm i -g pnpm)。')
          return { ok: false, packageName: null, message: '没装 pnpm。先跑一条: corepack enable(或 npm i -g pnpm),再重试。' }
        }
        if (errText.includes('PREPARE_NOT_ALLOWED') || errText.includes('allowBuilds') || errText.includes('build script')) {
          this.recordIssue('插件要跑构建脚本被拦截', '已自动尝试放行该插件的构建脚本,仍被拦;请手动检查 pnpm-workspace.yaml 的 allowBuilds 是否有该包名。', 'warn')
          return { ok: false, packageName: null, message: '安装失败:插件要跑构建脚本,已自动放行仍被拦(已还原)。可手动在 pnpm-workspace.yaml 的 allowBuilds 里确认该包名后重试。' }
        }
        const lastLine = errText.trim().split(/\r?\n/).filter(Boolean).pop() || ''
        // 分类顺序是关键:git 拉取失败(镜像改写/认证/仓库不存在)的报错文本常含
        // "Permission denied"/"access denied"/"UnauthorizedAccess",必须排在
        // "文件被占用"判定之前——否则网络/认证问题会被误报成文件权限问题,
        // 把用户误导去"重启 dsh、管理员运行"(多个用户踩过这个坑)。
        const gitMissing = /spawn git enoent|git is required|(?:^|[;:\s'"])['"]?git(?:\.exe)?[^\r\n]{0,20}?(?:is not recognized|不是内部或外部命令|无法识别)|(?:^|[;:\s])git[^\r\n]{0,12}?not found/i.test(errText)
        const gitish = /ERR_PNPM_GIT|git (?:ls-remote|clone|fetch)|fatal: (?:could not read username|unable to access|authentication failed|repository .*not found|not a git repository)|permission denied \(publickey\)|terminal prompts disabled|insteadof|requested url returned error/i.test(errText)
        const networkish = /UND_ERR|ECONN|ETIMEDOUT|ENOTFOUND|failed to connect|could not connect|unable to access|resolve failed|could not resolve|timed out|\bnetwork\b|\bfetch\b|\bproxy\b/i.test(errText)
        const fileBusy = /EBUSY|EPERM|EACCES|unauthorizedaccess|access is denied|access denied|拒绝访问|没有权限|权限不够|sharing violation|being used by another process/i.test(errText)
        const reason = gitMissing
          ? '本机没装 git,而 git 仓库插件必须用它来拉取'
          : gitish || networkish
            ? '拉取插件源码/依赖失败(网络、镜像或 git 认证问题,不是文件权限问题)'
            : fileBusy
              ? '文件被占用或没有写权限(多半是文件被别的程序锁住、目录只读,或需要管理员权限)'
              : (lastLine.slice(0, 120) || '未知原因')
        const advice = gitMissing
          ? '解决:安装 git(winget install Git.Git 或从 git-scm.com 下载),装完再点安装。'
          : gitish || networkish
            ? '解决:开代理/VPN 或稍后重试;市场会自动依次换 gh-proxy/ghfast 镜像重试。'
            : fileBusy
              ? '解决:关掉占用它的程序(先停 DSH)、确认目录不是只读、必要时用管理员运行,再重试。'
              : '换个网络或稍后重试。'
        this.recordIssue('安装/更新失败', reason)
        return { ok: false, packageName: null, message: `安装失败:${reason}。已自动回滚。${advice}` }
      }
    }
    if (taskId) {
      this.setTaskStep(taskId, 'verify', '下载完成,正在校验并写入启用名单…')
      this.setTaskProgress(taskId, 87, '下载完成,正在校验并写入启用名单…')
    }
    const after = await this.readProfile()
    const deps = Object.keys((after.dependencies || {}) as Record<string, string>)
    const bundles = Array.isArray((after.dsh as JsonObject | undefined)?.profile && ((after.dsh as JsonObject).profile as JsonObject).bundles)
      ? [...(((after.dsh as JsonObject).profile as JsonObject).bundles as string[])]
      : []
    let added: string | null = null
    let matched = false
    let missingBundle = false
    let clientOnly = false
    let matchedName: string | null = null
    for (const name of deps) {
      if (bundles.includes(name)) continue
      const specVal = String(((after.dependencies || {}) as Record<string, string>)[name] || '')
      if (npmSource) {
        // npm 源安装:依赖表里出现的就是裸包名(版本号 spec),按包名匹配。
        if (name.toLowerCase() !== npmSource.toLowerCase()) continue
      } else if (!specVal.toLowerCase().includes(o.toLowerCase() + '/' + repoName.toLowerCase())) {
        continue
      }
      matched = true
      matchedName = name
      try {
        const meta = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { dsh?: { bundle?: { patch?: string }; client?: unknown } }
        if (meta.dsh?.bundle?.patch) { bundles.push(name); added = name }
        else { missingBundle = true; if (meta.dsh?.client) clientOnly = true }
      } catch { /* node_modules missing — treat as failure below */ }
    }
    if (added) {
      after.dsh = after.dsh || {}
      ;(after.dsh as JsonObject).profile = (after.dsh as JsonObject).profile || {}
      ;((after.dsh as JsonObject).profile as JsonObject).bundles = bundles
      await this.writeProfile(after)
      // Post-validation: the written profile must parse and carry the bundle.
      try {
        const check = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as JsonObject
        const checkBundles = ((check.dsh as JsonObject | undefined)?.profile as JsonObject | undefined)?.bundles
        if (!Array.isArray(checkBundles) || !checkBundles.includes(added)) throw new Error('bundles not persisted')
      } catch {
        await this.restoreProfile(dir, snap)
        return { ok: false, packageName: null, message: '安装成功但启用名单写入校验失败,已自动回滚到安装前状态。请重试或手动编辑 profile。' }
      }
      await this.saveLastKnownGood()
      if (taskId) this.setTaskProgress(taskId, 97, '写入完成,收尾中…')
      return { ok: true, packageName: added, warning: warnings }
    }
    if (missingBundle) {
      if (clientOnly && matchedName) {
        // Client-only surface plugin (theme/UI): register an `insert` row in
        // cordis.patch.yml so it loads after restart — the same one-shot
        // install experience as a bundle, no manual YAML editing.
        const inserted = await this.upsertClientInsert(matchedName)
        try {
          if (!(await this.clientInsertNames()).has(matchedName)) throw new Error('insert not persisted')
        } catch {
          await this.restoreProfile(dir, snap)
          return { ok: false, packageName: null, message: '安装成功但自动注册写入校验失败,已回滚。请重试或手动在 cordis.patch.yml 里加 insert 行。' }
        }
        await this.saveLastKnownGood()
        if (taskId) this.setTaskProgress(taskId, 97, '写入完成,收尾中…')
        return { ok: true, packageName: matchedName, warning: warnings, hotReload: true }
      }
      return { ok: false, packageName: matchedName, installedAsDisabled: true, message: '安装完成,但该仓库没有声明 dsh.bundle,无法作为插件加载——它可能只是普通库或代码仓库,不是 dsh 插件。已作为普通依赖保留,重启也不会生效。' }
    }
    if (matched) {
      return { ok: false, packageName: null, message: '安装记录已写入,但未能定位到已安装的包文件。请稍后重试,或检查 profile 的 node_modules。' }
    }
    return { ok: false, packageName: null, message: 'pnpm 报告成功,但依赖列表里没有出现该仓库。安装可能未完成,请重试。' }
  }

  // ── Remote methods ─────────────────────────────────────────────────────

  @Remote('list')
  async list(page: number, sort: string, q: string, category: string): Promise<MarketListResult> {
    try {
      const sortKey = sort === 'updated' ? 'updated' : 'stars'
      const pageNum = Math.max(1, Number(page) || 1)
      const qText = String(q || '').trim()
      const cat = String(category || '全部')
      const catQuery = CATEGORY_QUERY[cat] || ''
      // 列表数据变化很慢:磁盘缓存(24h)让重启后同查询零请求;安装/卸载会清缓存,
      // 版本更新检测走独立的 versions() 通道,不受列表缓存影响。
      await this.loadListCache()
      const cacheKey = `list:${sortKey}:${pageNum}:${qText}:${cat}`
      // 先算当前 installedMap(纯本地):缓存命中也要重盖 installed 状态,否则会出现
      // "装了插件,列表里还显示安装按钮"这种状态不同步。
      let profile: JsonObject | null = null
      try { profile = await this.readProfile() } catch { profile = null }
      const inst = profile ? await this.installedMap(profile) : {}
      const cached = this.cacheGet(cacheKey) as MarketListResult | null
      if (cached) {
        return Array.isArray(cached.items)
          ? { ...cached, items: this.restampInstalled(cached.items, inst) }
          : cached
      }
      const query = 'topic:dsh-plugin' + (catQuery ? '+' + encodeQueryPart(catQuery) : '') + (qText ? '+' + encodeQueryPart(qText) : '')
      await this.loadZhCache()
      // 首次加载(无任何缓存)秒开:内置快照先顶上(零网络,按页返回与真实分页行为一致),
      // 只有第一页触发后台静默拉真实数据替换缓存。
      const seed = this.seedList(sortKey, qText, catQuery, inst, pageNum)
      if (seed) {
        if (pageNum === 1) void this.refreshListFromGitHub(cacheKey, sortKey, pageNum, qText, cat, catQuery, query, inst)
        return { ok: true, items: seed.items, total: seed.total, hasMore: pageNum * 100 < seed.total, page: pageNum, llmUsable: false, source: 'seed' }
      }
      return await this.fetchListPage(cacheKey, sortKey, pageNum, qText, cat, catQuery, query, inst)
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  /** 从 GitHub 拉一页并构造列表(缓存 miss 与后台刷新共用)。epoch 非空时,期间发生安装/卸载就丢弃结果。 */
  private async fetchListPage(cacheKey: string, sortKey: string, pageNum: number, qText: string, cat: string, catQuery: string, query: string, inst: InstalledMap, epoch?: number): Promise<MarketListResult> {
    const url = `https://api.github.com/search/repositories?q=${query}&sort=${sortKey}&order=desc&per_page=100&page=${pageNum}`
    let r = await this.ghSearch(url)
    // 有搜索词但 topic 精确匹配为空时,回退全文搜(没打 dsh-plugin 标签的仓库也能搜到)。
    if (r.status === 200 && qText) {
      try {
        const j = JSON.parse(r.body) as { items?: unknown[] } | null
        if (j && Array.isArray(j.items) && j.items.length === 0) {
          const broad = `https://api.github.com/search/repositories?q=${encodeQueryPart(qText)}+dsh-plugin&sort=${sortKey}&order=desc&per_page=100&page=${pageNum}`
          r = await this.ghSearch(broad)
        }
      } catch { /* 解析失败按原样 */ }
    }
    if (r.status !== 200) {
      const why = r.status === 403 || r.status === 429 ? '搜索太频繁被限流,稍后再试。' : r.status === 400 || r.status === 422 ? '搜索词无效,换个说法试试。' : '连不上 GitHub,请开代理或稍后重试。'
      return { ok: false, message: `搜索失败(${r.status})。${why}` }
    }
    let json: { items?: unknown[]; total_count?: number } | null = null
    try {
      json = JSON.parse(r.body) as { items?: unknown[]; total_count?: number } | null
    } catch {
      json = null
    }
    if (json === null || !Array.isArray(json.items)) return { ok: false, message: 'unexpected GitHub response' }
    const items = json.items.map((raw) => this.mapRawItem(raw, inst))
      .filter((item) => item.fullName.toLowerCase() !== SELF_REPO) // hide the market's own card
    const data: MarketListResult = {
      ok: true,
      items,
      total: json.total_count || 0,
      hasMore: pageNum * 100 < (json.total_count || 0),
      page: pageNum,
      llmUsable: false,
      source: this.directDown ? 'mirror' : 'direct',
    }
    // 后台刷新期间用户装了/卸了插件:丢弃,不写缓存,避免旧安装状态回写。
    if (epoch !== undefined && epoch !== this.cacheEpoch) return data
    this.cacheSet(cacheKey, data)
    await this.saveListCache(epoch)
    // Backfill kinds for repos the bundled snapshot does not know yet.
    void this.startKindScan(items.map((item) => ({ owner: item.owner, name: item.name, fullName: item.fullName })))
    return data
  }

  /** 一条 GitHub 搜索结果 → 列表项(含已装状态/中文简介/类型)。 */
  private mapRawItem(raw: unknown, inst: InstalledMap): PluginListItem {
    const it = raw as {
      full_name: string; name: string; description: string | null
      stargazers_count: number; forks_count: number; language: string | null
      topics: string[]; updated_at: string; html_url: string; homepage: string | null
      owner: { login: string } | null
    }
    const fullName = it.full_name || ''
    const cachedZh = this.zhCache.get(fullName.toLowerCase())
    const zhIntro = (cachedZh && Date.now() - cachedZh.at < ZH_TTL) ? cachedZh.zh : ''
    const rec = inst[fullName.toLowerCase()] || inst[String(it.name || '').toLowerCase()]
    const isHarness = HARNESS_REPOS.includes(fullName.toLowerCase())
    const kind = this.kindOf(fullName.toLowerCase())
    return {
      fullName,
      owner: it.owner ? it.owner.login : '',
      name: it.name || '',
      description: it.description || '',
      zhIntro: zhIntro || '',
      needZh: !zhIntro,
      stars: it.stargazers_count || 0,
      forks: it.forks_count || 0,
      language: it.language || '',
      topics: Array.isArray(it.topics) ? it.topics : [],
      updatedAt: it.updated_at || '',
      htmlUrl: it.html_url || '',
      homepage: it.homepage || '',
      installed: isHarness || (rec ? rec.enabled : false),
      installedName: isHarness ? null : (rec ? rec.name : null),
      installedVersion: isHarness ? this.harnessVersion() : null,
      isHarness: Boolean(isHarness),
      disabled: Boolean(rec && !rec.enabled),
      kind,
      cover: 'https://opengraph.githubassets.com/1/' + fullName,
    } satisfies PluginListItem
  }

  /** 缓存命中时,用当前 installedMap 重盖每张卡的 installed/installedName/disabled。 */
  private restampInstalled(items: PluginListItem[], inst: InstalledMap): PluginListItem[] {
    return items.map((it) => {
      if (it.isHarness) return it // harness 本体恒为"已安装"
      const rec = inst[it.fullName.toLowerCase()] || inst[String(it.name || '').toLowerCase()]
      if (rec) {
        const installed = rec.enabled
        const installedName = rec.name
        const disabled = !rec.enabled
        if (it.installed === installed && it.installedName === installedName && it.disabled === disabled) return it
        return { ...it, installed, installedName, disabled }
      }
      // 缓存里有"已安装",但现在清单里没了(被卸/手动删了):清掉状态。
      if (it.installed || it.disabled) return { ...it, installed: false, installedName: null, disabled: false }
      return it
    })
  }

  /** 内置快照按查询过滤+排序,返回可渲染列表(首次加载零网络秒开);匹配不到返回 null。 */
  /** 内置快照按查询过滤+排序,按页返回(与真实分页行为一致,本地秒翻页);匹配不到返回 null。 */
  private seedList(sortKey: string, qText: string, catQuery: string, inst: InstalledMap, pageNum: number): { items: PluginListItem[]; total: number } | null {
    const src = marketSnapshot as unknown as SnapshotEntry[]
    if (!Array.isArray(src) || src.length === 0) return null
    const terms: string[] = []
    if (qText) terms.push(...qText.toLowerCase().split(/\s+/).filter(Boolean))
    if (catQuery) terms.push(catQuery.toLowerCase())
    let matched = src
    if (terms.length > 0) {
      matched = src.filter((it) => {
        const hay = (it.n + ' ' + it.d).toLowerCase()
        return terms.every((t) => hay.includes(t))
      })
    }
    if (matched.length === 0) return null
    const sorted = [...matched].sort((a, b) => sortKey === 'updated' ? (b.u > a.u ? 1 : -1) : b.s - a.s)
    const total = sorted.length
    const slice = sorted.slice((pageNum - 1) * 100, pageNum * 100)
    if (slice.length === 0) return null
    const items = slice.map((e) => this.mapRawItem({
      full_name: e.f, name: e.n, description: e.d, stargazers_count: e.s, forks_count: e.k,
      language: e.l, topics: e.t, updated_at: e.u, html_url: e.h, homepage: e.p,
      owner: { login: e.o },
    }, inst)).filter((item) => item.fullName.toLowerCase() !== SELF_REPO)
    return items.length > 0 ? { items, total } : null
  }

  private readonly refreshingList = new Set<string>()
  /** 快照顶上后,后台静默拉真实数据替换缓存;失败无碍(快照继续用)。 */
  private async refreshListFromGitHub(cacheKey: string, sortKey: string, pageNum: number, qText: string, cat: string, catQuery: string, query: string, inst: InstalledMap): Promise<void> {
    if (this.refreshingList.has(cacheKey)) return
    this.refreshingList.add(cacheKey)
    const epoch = this.cacheEpoch // 记录开始世代,期间安装/卸载则丢弃结果
    try {
      const data = await this.fetchListPage(cacheKey, sortKey, pageNum, qText, cat, catQuery, query, inst, epoch)
      void data // 结果已进缓存(或已按世代丢弃),客户端下次请求命中
    } catch { /* 快照顶着 */ }
    finally { this.refreshingList.delete(cacheKey) }
  }

  @Remote('versions')
  async versions(): Promise<{ ok: boolean; map: Record<string, { local: string | null; remote: string | null; hasUpdate: boolean }> }> {
    const map: Record<string, { local: string | null; remote: string | null; hasUpdate: boolean }> = {}
    try {
      const p = await this.readProfile()
      const inst = await this.installedMap(p)
      const seen: Record<string, boolean> = {}
      for (const key of Object.keys(inst)) {
        const entry = inst[key]
        if (!entry.owner || !entry.repo) {
          // 纯 npm / 本地安装:没有 GitHub 仓库,改用 npm 官方源查最新版本。
          const name = entry.name
          if (!name || name.startsWith('@deepseek-ai/')) continue
          const bare = name.replace(/^@[\w.-]+\//, '').toLowerCase()
          if (seen['npm:' + bare]) continue
          seen['npm:' + bare] = true
          try {
            const local = await this.localVersion(name)
            let remote: string | null = null
            const reg = await this.httpGet(`https://registry.npmjs.org/${name.replace('/', '%2F')}`)
            if (reg.status === 200) {
              try { remote = (JSON.parse(reg.body) as { 'dist-tags'?: { latest?: string } })['dist-tags']?.latest || null } catch { remote = null }
            }
            map[name.toLowerCase()] = { local, remote, hasUpdate: !!(local && remote && compareVersions(remote, local) > 0) }
          } catch { /* skip unreadable */ }
          continue
        }
        const full = entry.owner + '/' + entry.repo
        if (seen[full]) continue
        seen[full] = true
        const local = await this.localVersion(entry.name)
        const remote = await this.remoteVersion(entry.owner, entry.repo, entry.subdir)
        // Lower-case key: the client indexes with the GitHub full name in
        // lower case, immune to owner/repo case drift in specs. Only a strictly
        // NEWER remote counts as an update — local ahead of remote (dev builds,
        // unreleased tags) must never show a "downgrade" prompt.
        map[full.toLowerCase()] = { local, remote, hasUpdate: !!(local && remote && compareVersions(remote, local) > 0) }
      }
    } catch { /* empty map */ }
    return { ok: true, map }
  }

  @Remote('translate')
  async translate(items: Array<{ fullName?: string; description?: string }>): Promise<{ ok: boolean; map: Record<string, string>; llmUsable: boolean; pending: number }> {
    // 自动翻译(LLM 现场生成中文简介)已移除:DeepSeek 峰谷定价下,高峰时段打开
    // 市场会对"没有缓存中文简介"的新插件批量调用当前模型,白烧大量余额。
    // 这里只返回已有缓存(内置快照 + 用户本地缓存),新插件保持英文简介、不再翻译。
    const list = Array.isArray(items) ? items : []
    const map: Record<string, string> = {}
    await this.loadZhCache()
    for (const it of list) {
      const key = String(it.fullName || '').toLowerCase()
      if (!key) continue
      const cached = this.zhCache.get(key)
      if (cached && Date.now() - cached.at < ZH_TTL) map[it.fullName || key] = cached.zh
    }
    return { ok: true, map, llmUsable: false, pending: 0 }
  }

  @Remote('installed')
  async installed(): Promise<JsonObject> {
    try {
      const p = await this.readProfile()
      const inst = await this.installedMap(p)
      const seen = new Set<string>()
      const entries: Array<{ key: string; name: string; spec: string }> = []
      for (const key of Object.keys(inst)) {
        const entry = inst[key]!
        if (seen.has(entry.name)) continue
        seen.add(entry.name)
        entries.push({ key, name: entry.name, spec: entry.spec })
      }
      const profile = ((p.dsh as JsonObject | undefined)?.profile || {}) as JsonObject
      return {
        ok: true,
        profileName: await this.getProfileName(),
        home: await this.getHome(),
        profileDir: await this.getProfileDir(),
        marketVersion: SELF_VERSION,
        bundles: (profile.bundles as string[] | undefined) || [],
        dependencies: (p.dependencies as JsonObject | undefined) || {},
        entries,
      }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('detail')
  async detail(owner: string, repo: string): Promise<JsonObject> {
    try {
      const o = safeSegment(owner)
      const r = safeSegment(repo)
      if (!o || !r) return { ok: false, message: 'invalid repository name' }
      const rootPkg = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/package.json`)
      const isMonorepo = rootPkg.status !== 200
      let notPlugin = false
      if (isMonorepo) {
        const sub = await this.subpackages(o, r)
        notPlugin = !(sub.ok && Array.isArray(sub.packages) && sub.packages.length > 0)
      }
      const files = ['README.zh.md', 'README_zh.md', 'README.md', 'readme.md', 'README.en.md']
      let readme = ''
      let image: string | null = null
      for (const file of files) {
        const res = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/${file}`)
        if (res.status === 200 && res.body) { readme = res.body; break }
      }
      let summary = ''
      if (readme) {
        const clean = readme
          .replace(/```[\s\S]*?```/g, ' ')
          .replace(/!\[[^\]]*\]\(([^)\s]+)\)/g, (_all, u: string) => { if (!image) image = u; return ' ' })
          .replace(/[#>*`|_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        summary = clean.slice(0, 600)
      }
      const isHarness = HARNESS_REPOS.includes((o + '/' + r).toLowerCase())
      const harnessLocal = isHarness ? this.harnessVersion() : null
      const harnessRemote = isHarness ? await this.remoteVersion(o, r) : null
      let detailOs: string[] = []
      let detailCpu: string[] = []
      if (rootPkg.status === 200) {
        try {
          const pkgMeta = JSON.parse(rootPkg.body) as { os?: string[]; cpu?: string[] }
          detailOs = Array.isArray(pkgMeta.os) ? pkgMeta.os : []
          detailCpu = Array.isArray(pkgMeta.cpu) ? pkgMeta.cpu : []
        } catch { /* no manifest */ }
      }
      let usage: string[] = []
      const texts = await this.fetchCandidateTexts(o, r)
      if (texts) usage = describeUsage(texts.hostText, texts.clientText)
      return {
        ok: true,
        readme,
        summary,
        image,
        isMonorepo,
        notPlugin: Boolean(notPlugin),
        isHarness: Boolean(isHarness),
        harnessVersion: harnessLocal,
        harnessRemote,
        harnessHasUpdate: isHarness && !!(harnessLocal && harnessRemote && compareVersions(harnessRemote, harnessLocal) > 0),
        os: detailOs,
        cpu: detailCpu,
        usage,
      }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  /** Read one repo's declared os/cpu support (cached 30 min; [] = cross-platform). */
  private async fetchOs(owner: string, repo: string): Promise<{ os: string[]; cpu: string[] } | null> {
    const key = (owner + '/' + repo).toLowerCase()
    const hit = this.osCache.get(key)
    if (hit && Date.now() - hit.at < 30 * 60 * 1000) return { os: hit.os, cpu: hit.cpu }
    const r = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/package.json`)
    if (r.status !== 200) return null
    try {
      const meta = JSON.parse(r.body) as { os?: string[]; cpu?: string[] }
      const os = Array.isArray(meta.os) ? meta.os : []
      const cpu = Array.isArray(meta.cpu) ? meta.cpu : []
      this.osCache.set(key, { at: Date.now(), os, cpu })
      return { os, cpu }
    } catch { return null }
  }

  /** Batch: resolve declared os/cpu for a list of repos (for card labels). */
  @Remote('osMap')
  async osMap(fullNames: string[]): Promise<JsonObject> {
    const map: Record<string, { os: string[]; cpu: string[] }> = {}
    const list = Array.isArray(fullNames) ? fullNames.slice(0, 100) : []
    const jobs = list.map((full) => async () => {
      const seg = String(full).split('/')
      const owner = safeSegment(seg[0] || '')
      const repo = safeSegment(seg.slice(1).join('/'))
      if (!owner || !repo) return
      const res = await this.fetchOs(owner, repo)
      if (res) map[String(full).toLowerCase()] = res
    })
    let next = 0
    const worker = async (): Promise<void> => {
      while (next < jobs.length) {
        const j = jobs[next++]!
        await j()
      }
    }
    const workers: Promise<void>[] = []
    for (let w = 0; w < 6; w++) workers.push(worker())
    await Promise.all(workers)
    return { ok: true, map }
  }

  /** True when this market is installed from a local path (link:/file:/workspace:) — a dev checkout. */
  private async isSelfLinkInstalled(): Promise<boolean> {
    try {
      const p = await this.readProfile()
      const deps = (p.dependencies || {}) as Record<string, string>
      for (const [name, spec] of Object.entries(deps)) {
        if (name === 'zat-dsh-engine' || /zat-dsh-engine/i.test(String(spec))) {
          if (/^(?:link|file|workspace):/i.test(String(spec))) return true
        }
      }
    } catch { /* best effort */ }
    return false
  }

  @Remote('selfupdate')
  async selfupdate(doUpdate: boolean, zhLocale?: boolean): Promise<JsonObject> {
    const parts = SELF_REPO.split('/')
    const owner = parts[0]!
    const repo = parts[1]!
    // 本地链接安装 = 开发版:本地代码就是"最新",既不提示更新,也不允许
    // 用 GitHub 版本覆盖(点一下就会把本地改动整个换掉,之前已经坑过一次)。
    const devLink = await this.isSelfLinkInstalled()
    if (devLink) {
      return {
        ok: !doUpdate,
        hasUpdate: false,
        current: SELF_VERSION,
        latestVersion: null,
        devLink: true,
        message: doUpdate
          ? '当前是本地链接安装(link:)的开发版,不能从 GitHub 覆盖更新;想换回 GitHub 版请先卸载再重装。'
          : '当前是本地链接安装(link:)的开发版,市场不检查 GitHub 更新,本地代码即最新。',
      }
    }
    if (!doUpdate) {
      const remote = await this.remoteVersion(owner, repo)
      // 只有远程严格更新才算更新;本地版本领先(未发布的开发版)绝不提示降级。
      if (!remote) {
        // 版本检查失败(网络/镜像问题)时不再静默:返回 checkFailed,界面显示可见
        // 提示,避免用户以为市场坏了/没有更新(此前 gh-proxy 502 会让按钮静默消失)。
        return {
          ok: true,
          hasUpdate: false,
          current: SELF_VERSION,
          latestVersion: null,
          checkFailed: true,
          message: '版本检查失败(GitHub 连接/镜像问题)',
        }
      }
      if (compareVersions(remote, SELF_VERSION) <= 0) return { ok: true, hasUpdate: false, current: SELF_VERSION, latestVersion: remote }
      // Ship a short "what changed" summary with the update notice: the newest
      // changelog block from the README matching the UI language (中文系统取
      // README.zh.md,其余取 README.md),只取最新一条版本、最多几条。
      let changes: string[] = []
      try {
        const readmeLang = zhLocale ? 'README.zh.md' : 'README.md'
        const readme = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${readmeLang}`)
        if (readme.status === 200) {
          const lines = readme.body.split(/\r?\n/)
          let inBlock = false
          for (const line of lines) {
            const isVersionHeading = /^###\s+v/.test(line)
            if (inBlock) {
              // 下一个 `### v…`(或其他标题)表示最新一条已结束:更新介绍只取
              // 最新版本的条目,不再把旧版本(0.6.1/0.6.0…)也拼进来。
              if (/^#{2,3}\s/.test(line)) break
              if (line.startsWith('- ')) {
                changes.push(line.slice(2).trim())
                if (changes.length >= 6) break
              }
            } else if (isVersionHeading) {
              inBlock = true
            }
          }
        }
      } catch { /* no changelog — the notice still shows the version */ }
      return { ok: true, hasUpdate: true, current: SELF_VERSION, latestVersion: remote, changes }
    }
    const spec = 'github:' + owner + '/' + repo
    const candidates = this.directDown ? [...this.mirrorSpecs(spec), spec] : [spec, ...this.mirrorSpecs(spec)]
    const taskId = this.launchTask(async (id) => {
      this.setTaskStep(id, 'update', '正在下载市场新版本…')
      this.setTaskProgress(id, 8, '正在下载市场新版本…(网络慢时可能较久,请稍候)')
      const dir = await this.getProfileDir()
      const startedAt = Date.now()
      const progress = (): void => {
        const secs = Math.floor((Date.now() - startedAt) / 1000)
        this.setTaskProgress(id, Math.min(80, 8 + secs * 2), `正在下载市场新版本…(已进行 ${secs} 秒)`)
      }
      let r = await this.pnpmShell('pnpm add ' + candidates[0]!, dir, progress)
      for (let i = 1; i < candidates.length && r.outcome.exitCode !== 0; i++) {
        const alt = await this.pnpmShell('pnpm add ' + candidates[i]!, dir, progress)
        if (alt.outcome.exitCode === 0) r = alt
      }
      if (r.outcome.exitCode !== 0) {
        const p = await this.profileForCommand()
        this.recordIssue('市场自更新失败', `点更新没成功(网络或 pnpm)。手动一条命令: dsh plugin --profile ${p} add https://gh-proxy.com/https://github.com/${owner}/${repo}.git`)
        return { ok: false, message: `升级失败。手动一条命令搞定: dsh plugin --profile ${p} add https://gh-proxy.com/https://github.com/${owner}/${repo}.git` }
      }
      this.invalidateListCache()
      await this.saveLastKnownGood()
      this.setTaskProgress(id, 97, '下载完成,收尾中…')
      return { ok: true, message: '已更新到 v' + (await this.remoteVersion(owner, repo)) + ' — 重启 dsh 后生效' }
    })
    return { ok: true, taskId }
  }

  @Remote('subpackages')
  async subpackages(owner: string, repo: string): Promise<JsonObject> {
    try {
      const o = safeSegment(owner)
      const r = safeSegment(repo)
      if (!o || !r) return { ok: false, kind: 'none', packages: [], message: 'invalid repository name' }
      // Single package: the root manifest itself declares the bundle patch.
      const rootPkg = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/package.json`)
      if (rootPkg.status === 200) {
        try {
          const meta = JSON.parse(rootPkg.body) as { name?: string; version?: string; dsh?: { bundle?: { patch?: string } } }
          if (meta.dsh?.bundle?.patch) {
            return { ok: true, kind: 'single', packages: [{ dir: '', name: meta.name || r, version: meta.version || '' }] }
          }
        } catch { /* fall through to subdir scan */ }
      }
      // Monorepo: scan first-level subdirectories for dsh.bundle.patch packages.
      const listing = await this.ghGet(`https://api.github.com/repos/${o}/${r}/contents/`)
      if (listing.status !== 200) return { ok: false, kind: 'none', packages: [], message: 'cannot list repository contents' }
      let entries: unknown[] = []
      try { entries = JSON.parse(listing.body) as unknown[] } catch { /* bad listing */ }
      if (!Array.isArray(entries)) return { ok: false, kind: 'none', packages: [], message: 'unexpected repository listing' }
      const pkgs: Array<{ dir: string; name: string; version: string }> = []
      for (const raw of entries) {
        const entry = raw as { type?: string; name?: string }
        if (!entry || entry.type !== 'dir' || !entry.name) continue
        const subPkg = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/${entry.name}/package.json`)
        if (subPkg.status !== 200) continue
        try {
          const meta = JSON.parse(subPkg.body) as { name?: string; version?: string; dsh?: { bundle?: { patch?: string } } }
          if (meta.dsh?.bundle?.patch) pkgs.push({ dir: entry.name, name: meta.name || entry.name, version: meta.version || '' })
        } catch { /* not a bundle */ }
      }
      return { ok: true, kind: pkgs.length > 0 ? 'multi' : 'none', packages: pkgs }
    } catch (err) {
      return { ok: false, kind: 'none', packages: [], message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('installPlugin')
  async install(owner: string, repo: string, subdir: string): Promise<JsonObject> {
    try {
      const o = safeSegment(owner)
      const r = safeSegment(repo)
      const s = safeSubdir(subdir)
      if (!o || !r || s === null) return { ok: false, message: 'invalid repository name or subdirectory' }
      // Instant gate — local checks only, blocks within milliseconds.
      const gate = await this.checkMarketConflict(o, r)
      if (gate) return { ok: false, packageName: null, message: gate }
      // When no subdir was picked and the root has no package.json, the
      // plugins live in subdirectories: auto-install when there is exactly
      // one, otherwise return the list for the UI to offer a choice.
      if (!s) {
        const rootPkg = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/package.json`)
        if (rootPkg.status !== 200) {
          const sub = await this.subpackages(o, r)
          if (sub.ok && Array.isArray(sub.packages) && sub.packages.length > 0) {
            if (sub.packages.length === 1) {
              const only = sub.packages[0]!
              const taskId = this.launchTask(async (id) => {
                this.setTaskStep(id, 'check', '正在做安装前检查(冲突/依赖)…')
                const holder = await this.anyInstalledMarketish()
                if (holder && await this.analyzeMarketishCandidate(o, r, only.dir)) {
                  return { ok: false, packageName: null, message: `已拦截:装了市场类插件 ${holder},再装会互相冲突导致 dsh 起不来。想换用请先卸载它。` }
                }
                this.setTaskStep(id, 'download', `正在下载安装 ${only.name || o + '/' + r}…(网络慢时可能较久,请稍候)`)
                const res = await this.addSpec(o, r, only.dir, id)
                return res.ok
                  ? { ok: true, packageName: res.packageName, message: res.hotReload
                    ? `已安装 ${only.name || o + '/' + r}(主题/界面插件)— 刷新页面即可生效${res.warning ? '。风险提示:' + res.warning : ''}`
                    : `已安装 ${only.name || o + '/' + r} — 重启 dsh 生效${res.warning ? '。风险提示:' + res.warning : ''}` }
                  : { ok: false, packageName: res.packageName, installedAsDisabled: res.installedAsDisabled === true, message: res.message }
              }, { owner: o, repo: r })
              return { ok: true, taskId }
            }
            return { ok: false, kind: 'multi', packages: sub.packages, message: '这个插件包含多个部分,请选择要安装的:' }
          }
          // 没有插件声明,但可能是技能(skill)包:clone 后扫描 SKILL.md,技能也一键装。
          const taskId = this.launchTask((id) => this.installSkillsTask(o, r, id), { owner: o, repo: r })
          return { ok: true, taskId }
        }
      }
      const taskId = this.launchTask(async (id) => {
        this.setTaskStep(id, 'check', '正在做安装前检查(冲突/依赖)…')
        const holder = await this.anyInstalledMarketish()
        if (holder && await this.analyzeMarketishCandidate(o, r, s || undefined)) {
          return { ok: false, packageName: null, message: `已拦截:装了市场类插件 ${holder},再装会互相冲突导致 dsh 起不来。想换用请先卸载它。` }
        }
        const analysis = await this.analyzeCandidateConflicts(o, r, s || undefined)
        if (analysis.block.length > 0) {
          return { ok: false, packageName: null, message: `安装已拦截:${analysis.block.join(';')}。确要强制安装请用官方命令。` }
        }
        if (analysis.warn.length > 0) {
          this.setTaskProgress(id, 10, `检查完成:发现风险 — ${analysis.warn.join('; ')}。不拦截,继续安装…`)
        }
        this.setTaskStep(id, 'download', '正在下载安装包…(网络慢时可能较久,请稍候)')
        const res = await this.addSpec(o, r, s || undefined, id, analysis)
        const installedLabel = analysis.npmName
          ? `npm 包 ${analysis.npmName}(github:${o}/${r} 的官方发布)`
          : `github:${o}/${r}${s ? `#path:${s}` : ''}`
        return res.ok
          ? { ok: true, packageName: res.packageName, message: res.hotReload
            ? `已安装(主题/界面插件)— 刷新页面即可生效。${res.warning ? '。风险提示:' + res.warning : ''}`
            : `已安装 ${installedLabel} — 重启 dsh 后生效。${analysis.usage[0] || ''}${res.warning ? '。风险提示:' + res.warning : ''}` }
          : { ok: false, packageName: res.packageName, installedAsDisabled: res.installedAsDisabled === true, message: res.message }
      }, { owner: o, repo: r })
      return { ok: true, taskId }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('update')
  async update(owner: string, repo: string, subdir: string): Promise<JsonObject> {
    try {
      const o = safeSegment(owner)
      const r = safeSegment(repo)
      const s = safeSubdir(subdir)
      if (!o || !r || s === null) return { ok: false, message: 'invalid repository name or subdirectory' }
      const gate = await this.checkMarketConflict(o, r)
      if (gate) return { ok: false, message: gate }
      const taskId = this.launchTask(async (id) => {
        this.setTaskStep(id, 'check', '正在做更新前检查(冲突/依赖)…')
        const analysis = await this.analyzeCandidateConflicts(o, r, s || undefined)
        if (analysis.block.length > 0) {
          return { ok: false, message: `更新已拦截:${analysis.block.join(';')}。确要强制更新请用官方命令。` }
        }
        if (analysis.warn.length > 0) {
          this.setTaskProgress(id, 10, `检查完成:发现风险 — ${analysis.warn.join('; ')}。不拦截,继续更新…`)
        }
        this.setTaskStep(id, 'download', '正在下载新版本…(网络慢时可能较久,请稍候)')
        const res = await this.addSpec(o, r, s || undefined, id, analysis)
        const version = analysis.npmName
          ? (await this.npmLatest(analysis.npmName))?.version || null
          : await this.remoteVersion(o, r, s || undefined)
        const updatedLabel = analysis.npmName
          ? `npm 包 ${analysis.npmName}(github:${o}/${r} 的官方发布)`
          : `github:${o}/${r}${s ? `#path:${s}` : ''}`
        return res.ok
          ? { ok: true, version, message: `已更新 ${updatedLabel} 到 v${version || '?'} — 重启 dsh 后生效。${analysis.usage[0] || ''}${res.warning ? '。风险提示:' + res.warning : ''}` }
          : { ok: false, packageName: res.packageName, installedAsDisabled: res.installedAsDisabled === true, message: res.message }
      }, { owner: o, repo: r })
      return { ok: true, taskId }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  /** 更新一个纯 npm / 本地安装的插件(没有 GitHub 仓库地址)。 */
  @Remote('updateNpm')
  async updateNpm(name: string): Promise<JsonObject> {
    try {
      const n = safePackageName(name)
      if (!n) return { ok: false, message: 'invalid package name' }
      const dir = await this.getProfileDir()
      this.invalidateListCache()
      const snap = await this.snapshotProfile(dir)
      const r = await this.pnpmShell('pnpm update ' + n, dir)
      if (r.outcome.exitCode !== 0) {
        await this.restoreProfile(dir, snap)
        return { ok: false, message: `更新失败,已还原。${(r.stderr || r.stdout || '').trim().slice(-160)}` }
      }
      await this.saveLastKnownGood()
      return { ok: true, message: `已更新 ${n} — 重启 dsh 后生效` }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('uninstall')
  async uninstall(name: string): Promise<JsonObject> {
    const n = safePackageName(name)
    if (!n) return { ok: false, message: 'invalid package name' }
    // The market must not delete itself: even if a client finds a way past the
    // hidden card, the host refuses. Removal stays possible via the official CLI.
    if (n === 'zat-dsh-engine') {
      return { ok: false, message: '市场不能卸载自己,已阻止。如需移除,请用官方命令: dsh plugin --profile <你的profile> remove zat-dsh-engine' }
    }
    // 技能(skill)卸载:按 owner/repo 从技能清单里删目录,立即生效。
    const skillManifest = await this.readSkillManifest()
    const skillEntry = skillManifest[n.toLowerCase()]
    if (skillEntry && skillEntry.dirs.length > 0) {
      const skillsDir = await this.getSkillsDir()
      const removed: string[] = []
      for (const d of skillEntry.dirs) {
        const p = join(skillsDir, d)
        if (existsSync(p)) { rmSync(p, { recursive: true, force: true }); removed.push(d) }
      }
      delete skillManifest[n.toLowerCase()]
      await this.writeSkillManifest(skillManifest)
      this.invalidateListCache()
      return { ok: true, message: `已卸载技能 ${removed.join('、') || name} — 立即生效` }
    }
    const taskId = this.launchTask(async (id) => {
      try {
        this.setTaskStep(id, 'uninstall', `正在卸载 ${n}…`)
        this.setTaskProgress(id, 8, `正在卸载 ${n}…`)
        const dir = await this.getProfileDir()
        this.invalidateListCache()
        const snap = await this.snapshotProfile(dir)
        const startedAt = Date.now()
        const r = await this.pnpmShell('pnpm remove ' + n, dir, (text) => {
          const secs = Math.floor((Date.now() - startedAt) / 1000)
          this.setTaskProgress(id, Math.min(80, 8 + secs * 2), `正在卸载 ${n}…(已进行 ${secs} 秒)`)
        })
        if (r.outcome.exitCode !== 0) {
          await this.restoreProfile(dir, snap)
          return { ok: false, message: ((r.stderr || r.stdout || 'pnpm failed').slice(0, 2000)) + ' — profile 配置已自动回滚' }
        }
        this.setTaskProgress(id, 87, '卸载完成,正在清理启用名单…')
        const after = await this.readProfile()
        const profile = ((after.dsh as JsonObject | undefined)?.profile || {}) as JsonObject
        const bundles = Array.isArray(profile.bundles) ? (profile.bundles as string[]).filter((b) => b !== n) : []
        if (bundles.length !== ((profile.bundles as string[] | undefined) || []).length) {
          after.dsh = after.dsh || {}
          ;(after.dsh as JsonObject).profile = (after.dsh as JsonObject).profile || {}
          ;((after.dsh as JsonObject).profile as JsonObject).bundles = bundles
          await this.writeProfile(after)
        }
        // Client-only surface plugins live as an `insert` row, not a bundle entry.
        await this.removeClientInsert(n)
        await this.saveLastKnownGood()
        this.setTaskProgress(id, 97, '清理完成,收尾中…')
        return { ok: true, message: `已卸载 ${n} — 重启 dsh 后不再加载` }
      } catch (err) {
        return { ok: false, message: String((err as { message?: string })?.message || err) }
      }
    })
    return { ok: true, taskId }
  }

  // ── conversation management (delete sessions) ──────────────────────────

  /** Soft faces: the session panel degrades gracefully where services differ. */
  private get persistenceFace(): { list(): Promise<Array<{ id: string; createdAt: number; origin?: string; parentSession?: string }>>; locate(header: { id: string }): { kind: string; path: string } | undefined } | undefined {
    return this.ctx.get('sessionPersistence') as unknown as { list(): Promise<Array<{ id: string; createdAt: number; origin?: string; parentSession?: string }>>; locate(header: { id: string }): { kind: string; path: string } | undefined } | undefined
  }

  private get workspaceRegistryFace(): { list(): Array<{ sessionIds: readonly string[]; detachSession?: (id: string) => Promise<void> }>; readonly archivedSessionIds: readonly string[]; forgetSession?: (id: string) => Promise<void> } | undefined {
    return this.ctx.get('workspaceRegistry') as unknown as { list(): Array<{ sessionIds: readonly string[]; detachSession?: (id: string) => Promise<void> }>; readonly archivedSessionIds: readonly string[]; forgetSession?: (id: string) => Promise<void> } | undefined
  }

  private get agentsFace(): { get(id: string): { status: string; ctx?: { dispose?: () => unknown } } | undefined } | undefined {
    return this.ctx.get('agents') as unknown as { get(id: string): { status: string; ctx?: { dispose?: () => unknown } } | undefined } | undefined
  }

  private get storageDomainFace(): { get(name: string): { table: (name: string) => { delete(id: string): Promise<unknown>; get(id: string): Promise<unknown> } } | undefined } | undefined {
    return this.ctx.get('storageDomain') as unknown as { get(name: string): { table: (name: string) => { delete(id: string): Promise<unknown>; get(id: string): Promise<unknown> } } | undefined } | undefined
  }

  private get sessionsRegistryFace(): { get(id: string): unknown } | undefined {
    return this.ctx.get('sessions') as unknown as { get(id: string): unknown } | undefined
  }

  private get sessionTitleFace(): { get(session: unknown): { title?: string } | undefined } | undefined {
    return this.ctx.get('sessionTitle') as unknown as { get(session: unknown): { title?: string } | undefined } | undefined
  }

  @Remote('listSessions')
  async listSessions(): Promise<JsonObject> {
    try {
      const persistence = this.persistenceFace
      if (!persistence) return { ok: false, message: '当前环境不支持会话管理' }
      const registry = this.workspaceRegistryFace
      const agents = this.agentsFace
      const headers = await persistence.list()
      const archived = registry ? registry.archivedSessionIds : []
      const workspaces = registry ? registry.list() : []
      const sessionsRegistry = this.sessionsRegistryFace
      const titleService = this.sessionTitleFace
      const domain = this.storageDomainFace?.get('session_projcache')
      const projTable = domain?.table('sessions')
      const sessions: JsonObject[] = []
      for (const h of headers) {
        const live = Boolean(agents && agents.get(h.id) !== undefined && agents.get(h.id)!.status === 'running')
        // Title: live sessions answer from the title service; cold sessions
        // read the persisted projection-cache row (key 'title').
        let title = ''
        if (sessionsRegistry !== undefined && titleService !== undefined) {
          const liveSession = sessionsRegistry.get(h.id)
          if (liveSession !== undefined) {
            const snap = titleService.get(liveSession)
            if (snap && snap.title) title = String(snap.title)
          }
        }
        if (!title && projTable !== undefined) {
          try {
            const row = await projTable.get(h.id) as { rows?: Record<string, { val?: unknown }> } | undefined
            const t = row?.rows?.['title']?.val
            if (typeof t === 'string' && t.trim()) title = t.trim()
          } catch { /* no cache row — no title yet */ }
        }
        sessions.push({
          id: h.id,
          title,
          createdAt: h.createdAt || 0,
          live,
          subagent: Boolean(h.origin === 'subagent'),
          archived: archived.includes(h.id),
          inWorkspace: workspaces.some((w) => (w.sessionIds as readonly string[]).includes(h.id)),
        })
      }
      // 对话管理只显示主对话:子代理会话直接隐藏(它们独立于主对话上下文,
      // 不应出现在这里、也不该被误删;删除子代理的硬保护仍保留在 deleteSession)。
      const mains = sessions.filter((s) => !s.subagent)
      mains.sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      return { ok: true, sessions: mains }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('deleteSession')
  async deleteSession(sessionId: string): Promise<JsonObject> {
    try {
      const id = String(sessionId || '').trim()
      if (!/^[\w-]+$/.test(id)) return { ok: false, message: 'invalid session id' }
      const persistence = this.persistenceFace
      if (!persistence) return { ok: false, message: '当前环境不支持删除会话' }
      const agents = this.agentsFace
      const agent = agents ? agents.get(id) : undefined
      if (agent !== undefined && agent.status === 'running') {
        return { ok: false, message: '这个会话正在运行,不能删除。等它跑完再删。' }
      }
      // An idle-but-attached session stays in ctx.sessions and keeps
      // reappearing in the sidebar (drifting into the ungrouped bucket once
      // its workspace slot is gone). Dispose the agent's scope first so the
      // in-memory registry drops it for good.
      if (agent !== undefined) {
        try {
          const agentCtx = agent.ctx
          if (agentCtx && typeof agentCtx.dispose === 'function') agentCtx.dispose()
        } catch { /* proceed with the file/accounting delete regardless */ }
      }
      const header = (await persistence.list()).find((c) => c.id === id)
      const registry = this.workspaceRegistryFace
      if (header === undefined) {
        const accounted = registry !== undefined && (registry.archivedSessionIds.includes(id)
          || registry.list().some((w) => (w.sessionIds as readonly string[]).includes(id)))
        if (!accounted) return { ok: false, message: '没有找到这个会话' }
        await this.forgetSessionCompat(registry, id)
        return { ok: true, message: `已清理会话 ${id} 的记账记录` }
      }
      if (header.origin === 'subagent') return { ok: false, message: '子代理会话不能直接删除' }
      const location = persistence.locate(header)
      if (location === undefined) return { ok: false, message: '这个会话没有可删除的本地文件' }
      try {
        rmSync(dirname(location.path), { recursive: true, force: true })
      } catch (err) {
        return { ok: false, message: `删除会话文件失败:${(err as { message?: string })?.message || String(err)}` }
      }
      let warning = ''
      if (registry !== undefined) warning = await this.forgetSessionCompat(registry, id)
      try {
        const domain = this.storageDomainFace?.get('session_projcache')
        if (domain) await domain.table('sessions').delete(id)
      } catch { /* a stale cache row is harmless */ }
      // Drop any idle in-memory attachment so the sidebar row disappears
      // immediately: DSH has no public close API, so use the store's own
      // detach path (the owner fiber's later teardown is idempotent) and emit
      // the disposal edge that pushes the host/session-removed frame.
      const sessionsStore = this.ctx.get('sessions') as { get(sessionId: string): unknown; store?: Map<string, unknown> } | undefined
      const liveSession = sessionsStore ? sessionsStore.get(id) : undefined
      if (liveSession !== undefined && sessionsStore?.store !== undefined) {
        try {
          sessionsStore.store.delete(id)
          ;(this.ctx as unknown as { emit(event: string, payload: unknown): void }).emit('session/disposed', liveSession)
          const agentsRegistry = this.ctx.get('agents') as { get(sessionId: string): unknown; store?: Map<string, unknown> } | undefined
          const liveAgent = agentsRegistry ? agentsRegistry.get(id) : undefined
          if (liveAgent !== undefined && agentsRegistry?.store !== undefined) {
            agentsRegistry.store.delete(id)
            ;(this.ctx as unknown as { emit(event: string, payload: unknown): void }).emit('agent/disposed', liveAgent)
          }
        } catch { /* best effort — a cold delete still works */ }
      }
      // 级联删除:主会话的子代理后代一并删掉,避免留下"隐藏又删不掉"的无主孤儿。
      let removedDescendants = 0
      for (const d of await this.subagentDescendants(id)) {
        await this.purgeSubagent(d.id, d.header)
        removedDescendants++
      }
      return { ok: true, message: `已删除会话 ${id}${removedDescendants > 0 ? ` 及其 ${removedDescendants} 个子代理` : ''}${warning ? '。' + warning : ''}` }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  /** Forget a session everywhere: patched dsh has forgetSession; stock dsh falls back to per-workspace detach. */
  private async forgetSessionCompat(registry: { list(): Array<{ sessionIds: readonly string[]; detachSession?: (id: string) => Promise<void> }>; forgetSession?: (id: string) => Promise<void> }, id: string): Promise<string> {
    if (typeof registry.forgetSession === 'function') {
      await registry.forgetSession(id)
      return ''
    }
    for (const w of registry.list()) {
      if ((w.sessionIds as readonly string[]).includes(id) && typeof w.detachSession === 'function') {
        try { await w.detachSession(id) } catch { /* keep going */ }
      }
    }
    return '此版本 dsh 缺少清理归档记录的方法,归档集合里可能残留一条记录(不影响使用)'
  }

  /** 收集某主会话的全部子代理后代(按 parentSession 链,含孙辈)。只跟子代理节点,不动 fork 等普通子会话。 */
  private async subagentDescendants(rootId: string): Promise<Array<{ id: string; header: { id: string; origin?: string } }>> {
    const persistence = this.persistenceFace
    if (!persistence) return []
    const headers = await persistence.list()
    const childrenOf = new Map<string, Array<{ id: string; header: { id: string; origin?: string } }>>()
    for (const h of headers) {
      if (h.origin !== 'subagent') continue
      const pid = h.parentSession
      if (!pid) continue
      const list = childrenOf.get(pid) ?? []
      list.push({ id: h.id, header: h })
      childrenOf.set(pid, list)
    }
    const out: Array<{ id: string; header: { id: string; origin?: string } }> = []
    const seen = new Set<string>([rootId])
    const queue = [...(childrenOf.get(rootId) ?? [])]
    while (queue.length) {
      const node = queue.shift()!
      if (seen.has(node.id)) continue
      seen.add(node.id)
      out.push(node)
      for (const child of childrenOf.get(node.id) ?? []) queue.push(child)
    }
    return out
  }

  /** 删除一个子代理会话(文件 + 记账 + 内存),尽力而为,单个失败不中断级联。 */
  private async purgeSubagent(id: string, header: { id: string; origin?: string }): Promise<void> {
    const agents = this.agentsFace
    const agent = agents ? agents.get(id) : undefined
    if (agent !== undefined) {
      try {
        if (agent.ctx && typeof agent.ctx.dispose === 'function') agent.ctx.dispose()
      } catch { /* 继续删文件/记账 */ }
    }
    const persistence = this.persistenceFace
    const location = persistence ? persistence.locate(header) : undefined
    if (location !== undefined) {
      try { rmSync(dirname(location.path), { recursive: true, force: true }) } catch { /* 文件删不动不阻塞 */ }
    }
    const registry = this.workspaceRegistryFace
    if (registry !== undefined) await this.forgetSessionCompat(registry, id)
    try {
      const domain = this.storageDomainFace?.get('session_projcache')
      if (domain) await domain.table('sessions').delete(id)
    } catch { /* 残留缓存行无害 */ }
    const sessionsStore = this.ctx.get('sessions') as { get(sessionId: string): unknown; store?: Map<string, unknown> } | undefined
    const liveSession = sessionsStore ? sessionsStore.get(id) : undefined
    if (liveSession !== undefined && sessionsStore?.store !== undefined) {
      try {
        sessionsStore.store.delete(id)
        ;(this.ctx as unknown as { emit(event: string, payload: unknown): void }).emit('session/disposed', liveSession)
        const agentsRegistry = this.ctx.get('agents') as { get(sessionId: string): unknown; store?: Map<string, unknown> } | undefined
        const liveAgent = agentsRegistry ? agentsRegistry.get(id) : undefined
        if (liveAgent !== undefined && agentsRegistry?.store !== undefined) {
          agentsRegistry.store.delete(id)
          ;(this.ctx as unknown as { emit(event: string, payload: unknown): void }).emit('agent/disposed', liveAgent)
        }
      } catch { /* best effort */ }
    }
  }

  /**
   * The "installed" filter is served by this endpoint instead of paging
   * through star-sorted search results: every installed plugin with a known
   * repo is returned in one shot.
   */
  @Remote('installedList')
  async installedList(): Promise<JsonObject> {
    try {
      await this.loadZhCache()
      const p = await this.readProfile()
      const inst = await this.installedMap(p)
      const unique: Array<{ name: string; owner: string; repo: string; enabled: boolean; installing?: boolean; taskId?: string; spec?: string; stars?: number }> = []
      const noRepo: Array<{ name: string; enabled: boolean }> = []
      const seen = new Set<string>()
      for (const rec of new Set(Object.values(inst))) {
        let owner = rec.owner
        let repo = rec.repo
        if (!owner || !repo) {
          const known = Object.entries(KNOWN_MARKET_REPOS).find(([, pkg]) => pkg === rec.name)
          if (known) { const [full] = known; owner = full.split('/')[0]; repo = full.split('/')[1] }
        }
        if (!owner || !repo) {
          // 纯 npm / link 安装:没有 GitHub 仓库地址,也要在"已安装"里看到和管理。
          // 注意:dependencies 里出现的 @deepseek-ai/* 都是用户/AI 装的第三方(借了官方
          // scope 的,比如 @deepseek-ai/dsh-client-ui-aqua),官方组件在 bundles 里、不在
          // dependencies 里 —— 所以这里不能再按前缀跳过,否则借 scope 的插件就"消失"了。
          const bare = rec.name.replace(/^@[\w.-]+\//, '')
          if (seen.has('npm:' + bare.toLowerCase())) continue
          seen.add('npm:' + bare.toLowerCase())
          noRepo.push({ name: rec.name, enabled: rec.enabled })
          continue
        }
        const key = (owner + '/' + repo).toLowerCase()
        if (key === SELF_REPO) continue // the market's own card stays hidden
        if (seen.has(key)) continue
        seen.add(key)
        unique.push({ name: rec.name, owner, repo, enabled: rec.enabled, spec: rec.spec, stars: rec.stars })
      }
      // Installations currently in flight also belong in the installed view:
      // their card shows the live progress and the state survives leaving the
      // settings page and coming back.
      for (const [taskId, task] of this.tasks) {
        if (task.done || !task.subject) continue
        const fullName = task.subject.owner + '/' + task.subject.repo
        if (fullName.toLowerCase() === SELF_REPO) continue
        if (seen.has(fullName.toLowerCase())) continue
        seen.add(fullName.toLowerCase())
        unique.push({ name: fullName, owner: task.subject.owner, repo: task.subject.repo, enabled: false, installing: true, taskId })
      }
      const items: JsonObject[] = []
      // 无仓库地址的插件:直接用包名列出,支持卸载/启停,不支持更新/点星/详情。
      for (const rec of noRepo) {
        const version = await this.localVersion(rec.name)
        items.push({
          fullName: rec.name,
          owner: '',
          name: rec.name,
          description: '',
          zhIntro: '',
          needZh: false,
          stars: 0,
          forks: 0,
          language: '',
          topics: [],
          updatedAt: '',
          htmlUrl: '',
          homepage: '',
          installed: rec.enabled,
          installedName: rec.name,
          installedVersion: version,
          isHarness: false,
          disabled: !rec.enabled,
          kind: 'plugin',
          noRepo: true,
          cover: '',
        })
      }
      // 已安装是"确定的东西",必须本地秒出,绝不联网:描述/星数从内置快照和 zh
      // 缓存取,取不到就留空,不再逐仓请求 GitHub(那样 VPN/代理一断就卡死)。
      const snapById = new Map<string, SnapshotEntry>()
      for (const e of marketSnapshot as unknown as SnapshotEntry[]) snapById.set(String(e.f || '').toLowerCase(), e)
      for (const rec of unique) {
        const fullName = rec.owner + '/' + rec.repo
        const snap = snapById.get(fullName.toLowerCase())
        const cachedZh = this.zhCache.get(fullName.toLowerCase())
        const zhIntro = (cachedZh && Date.now() - cachedZh.at < ZH_TTL) ? cachedZh.zh : ''
        const item: JsonObject = {
          fullName,
          owner: rec.owner,
          name: snap?.n || rec.repo,
          description: snap?.d || '',
          zhIntro: zhIntro || '',
          needZh: !zhIntro,
          stars: snap?.s || rec.stars || 0,
          forks: snap?.k || 0,
          language: snap?.l || '',
          topics: snap?.t || [],
          updatedAt: snap?.u || '',
          htmlUrl: snap?.h || `https://github.com/${fullName}`,
          homepage: snap?.p || '',
          installed: rec.enabled,
          installedName: rec.name,
          installedVersion: null,
          isHarness: Boolean(HARNESS_REPOS.includes(fullName.toLowerCase())),
          disabled: Boolean(!rec.enabled),
          kind: rec.spec && String(rec.spec).startsWith('skill:') ? 'skill' : this.kindOf(fullName.toLowerCase()),
          cover: 'https://opengraph.githubassets.com/1/' + fullName,
        }
        if (rec.installing) item.installing = true
        if (rec.taskId) item.taskId = rec.taskId
        items.push(item)
      }
      return { ok: true, items, total: items.length, hasMore: false, page: 1 }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  /** Enable or disable one installed plugin (add/remove its bundle entry). */
  @Remote('setEnabled')
  async setEnabled(name: string, enabled: boolean): Promise<JsonObject> {
    try {
      const n = safePackageName(name)
      if (!n) return { ok: false, message: 'invalid package name' }
      const dir = await this.getProfileDir()
      this.invalidateListCache()
      const p = await this.readProfile()
      const profile = ((p.dsh as JsonObject | undefined)?.profile || {}) as JsonObject
      const bundles = Array.isArray(profile.bundles) ? [...(profile.bundles as string[])] : []
      // Client-only surface plugin (theme/UI): toggle its `insert` row instead
      // of a bundle entry — pushing it into bundles would break dsh startup.
      if (await this.isClientOnlyPackage(n)) {
        if (enabled) {
          const names = await this.clientInsertNames()
          if (names.has(n)) return { ok: true, enabled: true, message: `${n} 已经在启用` }
          await this.upsertClientInsert(n)
          if (!(await this.clientInsertNames()).has(n)) return { ok: false, message: '启用写入校验失败,请重试' }
          await this.saveLastKnownGood()
          return { ok: true, enabled: true, message: `${n} 已启用 — 重启 dsh 后生效` }
        }
        const removed = await this.removeClientInsert(n)
        await this.saveLastKnownGood()
        return removed
          ? { ok: true, enabled: false, message: `${n} 已停用 — 重启 dsh 后生效` }
          : { ok: true, enabled: false, message: `${n} 本来就没启用` }
      }
      if (enabled) {
        if (bundles.includes(n)) return { ok: true, enabled: true, message: `${n} 已经在启用列表中` }
        if (!(await this.isBundlePackage(n))) {
          return { ok: false, message: `${n} 没有声明 dsh.bundle,也不是 client-only 插件,市场不能自动启用。请按它的 README 手动注册。` }
        }
        bundles.push(n)
      } else {
        if (!bundles.includes(n)) return { ok: true, enabled: false, message: `${n} 本来就不在启用列表中` }
        if (n.startsWith('@deepseek-ai/')) return { ok: false, message: `${n} 是官方基础组件,停用会导致 dsh 无法启动,已阻止` }
        bundles.splice(bundles.indexOf(n), 1)
      }
      const snap = await this.snapshotProfile(dir)
      p.dsh = p.dsh || {}
      ;(p.dsh as JsonObject).profile = (p.dsh as JsonObject).profile || {}
      ;((p.dsh as JsonObject).profile as JsonObject).bundles = bundles
      await this.writeProfile(p)
      try {
        const check = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as JsonObject
        const checkBundles = ((check.dsh as JsonObject | undefined)?.profile as JsonObject | undefined)?.bundles
        const okState = enabled ? Array.isArray(checkBundles) && checkBundles.includes(n) : Array.isArray(checkBundles) && !checkBundles.includes(n)
        if (!okState) throw new Error('bundle state not persisted')
      } catch {
        await this.restoreProfile(dir, snap)
        return { ok: false, message: '启用名单写入校验失败,已自动回滚' }
      }
      await this.saveLastKnownGood()
      let dependents = ''
      if (!enabled) {
        // Warn when other ENABLED plugins depend on the one being disabled —
        // they would fail to load after the next restart.
        try {
          const pDeps = Object.keys((p.dependencies || {}) as Record<string, string>)
          for (const dname of pDeps) {
            if (dname === n || !bundles.includes(dname)) continue
            try {
              const meta = JSON.parse(readFileSync(join(dir, 'node_modules', dname, 'package.json'), 'utf8')) as { dependencies?: Record<string, string>; peerDependencies?: Record<string, string> }
              const need = [...Object.keys(meta.dependencies || {}), ...Object.keys(meta.peerDependencies || {})]
              if (need.includes(n)) dependents += (dependents ? '、' : '') + dname
            } catch { /* skip unreadable */ }
          }
        } catch { /* best effort */ }
      }
      return { ok: true, enabled, message: enabled
        ? `${n} 已启用 — 重启 dsh 后生效`
        : `${n} 已停用 — 重启 dsh 后生效${dependents ? `。注意:${dependents} 依赖它,重启后可能加载失败` : ''}` }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  /**
   * One-click health scan of every installed plugin: hard conflicts
   * (official deps, duplicate loader ids, multiple markets), soft risks
   * (version majors, missing peers) and informational items.
   */
  /** pnpm 是否可用(装/更新/修复都靠它)。 */
  private async pnpmAvailable(): Promise<boolean> {
    try { await this.subprocess.resolveExecutable('pnpm'); return true } catch { /* not on PATH */ }
    try { await this.subprocess.resolveExecutable('corepack'); return true } catch { /* no corepack */ }
    // 与 ZAT 启动器的对接约定:PNPM_MJS 与 %TEMP%\zat-tools 的 pnpm 优先
    // (启动器保证幂等补齐,已知良好),系统 pnpm 兜底。市场不自己装 pnpm。
    const cands: string[] = []
    if (process.env.PNPM_MJS) cands.push(process.env.PNPM_MJS)
    cands.push(
      join(process.env.TEMP || '', 'zat-tools', 'pnpm.cjs'),
      join(process.env.TEMP || '', 'zat-tools', 'pnpm.exe'),
      join(process.env.APPDATA || '', 'npm', 'pnpm.cmd'),
      join(process.env.LOCALAPPDATA || '', 'pnpm', 'pnpm.cmd'),
      join(process.env.ProgramFiles || '', 'nodejs', 'pnpm.cmd'),
    )
    for (const cand of cands) {
      if (cand && existsSync(cand)) return true
    }
    return false
  }

  @Remote('healthCheck')
  async healthCheck(): Promise<JsonObject> {
    const issues: Array<{ level: string; title: string; detail: string; fixable?: boolean }> = []
    try {
      const dir = await this.getProfileDir()
      const p = await this.readProfile()
      const deps = Object.keys((p.dependencies || {}) as Record<string, string>)
      const bundles = Array.isArray((p.dsh as JsonObject | undefined)?.profile && ((p.dsh as JsonObject).profile as JsonObject).bundles)
        ? ((p.dsh as JsonObject).profile as JsonObject).bundles as string[]
        : []
      // pnpm 可用性:装/更新/修复都靠它。
      const pnpmOk = await this.pnpmAvailable()
      if (!pnpmOk) issues.push({ level: 'error', title: '没装 pnpm', detail: '装/更新插件都靠它。解决:点「一键修复」会自动装,或终端跑 corepack enable / npm i -g pnpm。', fixable: true })
      // 网络:连不上 GitHub,装/更新插件就都干不了。
      const netProbe = await this.ghGet('https://raw.githubusercontent.com/mishibeikejie/zat-dsh-engine/HEAD/package.json')
      if (netProbe.status === 0) issues.push({ level: 'error', title: '连不上 GitHub', detail: '装/更新插件拉不到代码。解决:开 VPN/系统代理,或确认网络后再试。' })
      interface Scanned { name: string; enabled: boolean; meta: { main?: string; exports?: Record<string, string | { default?: string }>; dependencies?: Record<string, string>; peerDependencies?: Record<string, string>; peerDependenciesMeta?: Record<string, { optional?: boolean }>; os?: string[]; cpu?: string[]; dsh?: { bundle?: { patch?: string }; client?: unknown } }; patchIds: Set<string> }
      const scanned: Scanned[] = []
      const clientInserts = await this.clientInsertNames()
      for (const name of deps) {
        try {
          const meta = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as Scanned['meta']
          let patchIds = new Set<string>()
          if (meta.dsh?.bundle?.patch) {
            try { patchIds = extractPatchIds(readFileSync(join(dir, 'node_modules', name, meta.dsh.bundle.patch), 'utf8')) } catch { /* no patch file */ }
          }
          const enabled = bundles.includes(name) || name.startsWith('@deepseek-ai/') || clientInserts.has(name)
          scanned.push({ name, enabled, meta, patchIds })
          if (bundles.includes(name) && !meta.dsh?.bundle?.patch) {
            issues.push({ level: 'error', title: `${name} 在启用名单里但没有声明 dsh.bundle`, detail: 'dsh 启动时读到这种条目会直接报错拒绝启动。解决:点「一键修复」自动把它移出启用名单(依赖保留),再按它的 README 在 cordis.patch.yml 里手动注册。', fixable: true })
          }
          for (const d of Object.keys(meta.dependencies || {})) {
            if (isHostCorePackage(d)) issues.push({ level: 'error', title: `${name} 把官方核心包 ${d} 写进了 dependencies`, detail: '官方核心包应使用 peerDependencies 引用;直接依赖会装出第二份拷贝并劫持官方 loader 行,可能让 dsh 起不来。建议反馈给插件作者。' })
          }
          for (const pd of Object.keys(meta.peerDependencies || {})) {
            if (meta.peerDependenciesMeta?.[pd]?.optional) continue // declared optional — not missing
            const provided = await this.moduleProvided(pd)
            if (!provided) issues.push({ level: 'warn', title: `${name} 需要的 peer 依赖 ${pd} 未安装`, detail: '这个依赖缺失时插件运行会报错。解决:点「一键修复」自动补装。', fixable: true })
          }
          // 入口文件必须真实存在,否则装了也加载不起来。
          const entryCands: string[] = []
          if (typeof meta.main === 'string' && meta.main) entryCands.push(meta.main)
          for (const v of Object.values(meta.exports || {})) {
            if (typeof v === 'string') entryCands.push(v)
            else if (v && typeof v === 'object' && typeof v.default === 'string') entryCands.push(v.default)
          }
          const missingEntries: string[] = []
          for (const rel of [...new Set(entryCands)].slice(0, 3)) {
            if (!rel || rel.includes('*') || rel.startsWith('http')) continue
            if (!existsSync(join(dir, 'node_modules', name, rel.replace(/^\.\//, '')))) missingEntries.push(rel.replace(/^\.\//, ''))
          }
          if (missingEntries.length > 0) issues.push({ level: 'error', title: `${name} 入口文件缺失:${missingEntries.join('、')}`, detail: '这个插件没提交构建产物,装了也加载不起来。解决:卸载它(它本身是坏的)。' })
          // 系统 / CPU 兼容。
          if (!fieldSupports(meta.os, process.platform)) issues.push({ level: 'error', title: `${name} 不支持当前系统(仅支持 ${(meta.os || []).join('、')})`, detail: `它不支持你当前的系统(${process.platform}),装了会导致 dsh 起不来。解决:卸载它。` })
          if (!fieldSupports(meta.cpu, process.arch)) issues.push({ level: 'error', title: `${name} 不支持当前 CPU(仅支持 ${(meta.cpu || []).join('、')})`, detail: '解决:卸载它。' })
          if (!enabled && !name.startsWith('@deepseek-ai/')) {
            const isEnableable = Boolean(meta.dsh?.bundle?.patch) || Boolean(meta.dsh?.client)
            if (isEnableable) {
              issues.push({ level: 'info', title: `${name} 已停用`, detail: '已安装但未启用。解决:点「一键修复」自动启用。', fixable: true })
            } else {
              issues.push({ level: 'info', title: `${name} 已安装但不会被加载`, detail: '它既没有 dsh.bundle 也没有 dsh.client,不是可加载的 dsh 插件(可能只是普通库)。已作为依赖保留。' })
            }
          }
        } catch {
          issues.push({ level: 'warn', title: `找不到 ${name} 的包文件`, detail: '依赖名单里有它,但 node_modules 里没有。解决:点「一键修复」自动补装。', fixable: true })
        }
      }
      // Duplicate loader row ids across ENABLED bundles (a disabled plugin
      // does not load, so it cannot collide).
      const idHolders = new Map<string, string>()
      for (const s of scanned) {
        if (!s.enabled) continue
        for (const id of s.patchIds) {
          const holder = idHolders.get(id)
          if (holder && holder !== s.name) {
            issues.push({ level: 'error', title: `挂载行 id "${id}" 重复`, detail: `${holder} 和 ${s.name} 都声明了这个行 id,加载时会互相冲突,建议二选一。若是有意的覆盖可忽略。` })
          } else if (!holder) {
            idHolders.set(id, s.name)
          }
        }
      }
      // 手抄重复:profile 的 cordis.patch.yml 里 insert 的行 id,若已被某个启用
      // 插件的自带 patch 声明,loader 会对同一 id insert 两次 → id 冲突、dsh 起不来。
      // (典型:AI 装插件时把插件的 insert 行手抄进 profile patch,插件又自带同 id。)
      const bundleOwnedIds = new Map<string, string>()
      for (const s of scanned) {
        if (!s.enabled) continue
        for (const id of s.patchIds) {
          if (!bundleOwnedIds.has(id)) bundleOwnedIds.set(id, s.name)
        }
      }
      for (const patch of await this.readPatches()) {
        if (!patch || typeof patch !== 'object') continue
        const insert = (patch as { insert?: unknown }).insert
        if (!Array.isArray(insert)) continue
        for (const row of insert) {
          if (!(row && typeof row === 'object')) continue
          const rid = (row as { id?: unknown }).id
          if (typeof rid !== 'string') continue
          const holder = bundleOwnedIds.get(rid)
          if (holder) {
            issues.push({ level: 'error', title: `cordis.patch.yml 手抄了挂载行 id "${rid}"`, detail: `插件 ${holder} 自带的补丁已声明这个 id,loader 会自动挂载;profile 的 cordis.patch.yml 再手抄一遍会导致 id 冲突、dsh 起不来。解决:点「一键修复」自动删掉这条手抄行(插件照常通过自带补丁加载)。`, fixable: true })
          }
        }
      }
      // Shared-dependency major-version conflicts across ENABLED plugins.
      const declared = new Map<string, Array<{ pkg: string; range: string }>>()
      for (const s of scanned) {
        if (!s.enabled) continue
        for (const [dep, range] of [...Object.entries(s.meta.dependencies || {}), ...Object.entries(s.meta.peerDependencies || {})]) {
          if (dep.startsWith('@deepseek-ai/')) continue
          if (!declared.has(dep)) declared.set(dep, [])
          declared.get(dep)!.push({ pkg: s.name, range: String(range) })
        }
      }
      for (const [dep, list] of declared) {
        const majors = new Set<number>()
        for (const item of list) {
          const m = String(item.range).match(/^\^?(\d+)(?:\.\d+){0,2}$/)
          if (m) majors.add(Number(m[1]))
        }
        if (majors.size > 1) {
          issues.push({ level: 'warn', title: `依赖版本冲突:${dep}`, detail: list.map((x) => `${x.pkg} 要求 ${x.range}`).join(';') + '。大版本不一致时 pnpm 会装多份拷贝,宿主侧共享包可能出现状态分裂或报错。' })
        }
      }
      // Registered-name collisions across enabled plugins.
      const hostNames = new Map<string, string>()
      const clientNames = new Map<string, string>()
      for (const s of scanned) {
        if (!s.enabled) continue
        const names = await this.scanLocalNames(s.name)
        for (const nm of names.host) {
          const holder = hostNames.get(nm)
          if (holder && holder !== s.name) {
            issues.push({ level: 'error', title: `服务/提供名 "${nm}" 重复注册`, detail: `${holder} 和 ${s.name} 都提供了同名服务,后加载的会覆盖先加载的或直接报错,建议二选一。` })
          } else if (!holder) {
            hostNames.set(nm, s.name)
          }
        }
        for (const nm of names.client) {
          const holder = clientNames.get(nm)
          if (holder && holder !== s.name) {
            issues.push({ level: 'warn', title: `界面注册名 "${nm}" 重复`, detail: `${holder} 和 ${s.name} 注册了同一个界面位置,可能互相覆盖;若属有意共享可忽略。` })
          } else if (!holder) {
            clientNames.set(nm, s.name)
          }
        }
      }
      // Official-package version compatibility for enabled plugins.
      for (const s of scanned) {
        if (!s.enabled) continue
        for (const [pd, range] of Object.entries(s.meta.peerDependencies || {})) {
          if (!pd.startsWith('@deepseek-ai/')) continue
          const installedVer = await this.installedVersionOf(pd)
          if (installedVer && simpleMajorConflict(String(range), installedVer)) {
            issues.push({ level: 'warn', title: `${s.name} 与官方包 ${pd} 版本可能不兼容`, detail: `插件要求 ${range},本机是 v${installedVer}。大版本不一致时运行可能报错,建议等插件作者适配。` })
          }
        }
      }
      // Security scan of every ENABLED third-party plugin's actual installed
      // code (host + client). Official @deepseek-ai/* packages are skipped:
      // they ship with the harness and the user cannot uninstall them.
      // 市场自己也跳过:它打包了市场快照数据(第三方仓库的 homepage 域名等),
      // 那些字符串是数据不是代码行为,扫了会误报"可疑网络去向"。
      // 这里只是"提示"——真正的拦截在搜插件(装前体检)和安装门那一步;已装的只提醒,不逼着停用。
      for (const s of scanned) {
        if (!s.enabled || s.name.startsWith('@deepseek-ai/') || s.name === 'zat-dsh-engine') continue
        const texts = await this.readLocalTexts(s.name)
        for (const f of scanSecurity(texts.hostText, `${s.name} 宿主代码`)) {
          issues.push({ level: 'warn', title: f.title, detail: f.detail })
        }
        for (const f of scanSecurity(texts.clientText, `${s.name} 界面代码`)) {
          issues.push({ level: 'warn', title: f.title, detail: f.detail })
        }
      }
      // Multiple market/manager plugins.
      const inst = await this.installedMap(p)
      const markets: string[] = []
      for (const rec of new Set(Object.values(inst))) {
        if (KNOWN_MARKET_REPOS[(rec.owner + '/' + rec.repo).toLowerCase()] !== undefined || Object.values(KNOWN_MARKET_REPOS).includes(rec.name) || isMarketishName(rec.name) || await this.scanLocalMarketish(rec.name)) {
          if (!markets.includes(rec.name)) markets.push(rec.name)
        }
      }
      if (markets.length > 1) issues.push({ level: 'error', title: '装了多个市场/管理器插件', detail: markets.join('、') + ' 会互相覆盖设置页并注册冲突,建议只保留一个。' })
      // 市场最近自己报过的错(安装失败/网络/pnpm/自更新失败等),也一起列出来。
      for (const ri of this.recentIssues) {
        if (!issues.some((i) => i.title === ri.title)) issues.push({ level: ri.level, title: ri.title, detail: ri.detail })
      }
      if (issues.length === 0) issues.push({ level: 'ok', title: '体检通过', detail: '没有发现冲突、依赖矛盾或明显风险。' })
      return { ok: true, issues }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  /**
   * 一键修复:自动解决能安全修复的问题(启用已停用插件、补装缺失依赖/包文件)。
   * 修不了的(系统不支持、入口文件缺失、官方包写错、冲突、网络、pnpm 缺失)不硬来,
   * 原样留在 remaining 里,由 healthCheck 的说明告诉用户怎么办。
   */
  @Remote('repair')
  async repair(): Promise<JsonObject> {
    const fixed: string[] = []
    const remaining: string[] = []
    try {
      const dir = await this.getProfileDir()
      const p = await this.readProfile()
      const deps = Object.keys((p.dependencies || {}) as Record<string, string>)
      const profile = ((p.dsh as JsonObject | undefined)?.profile || {}) as JsonObject
      let bundles = Array.isArray(profile.bundles) ? [...(profile.bundles as string[])] : []
      // 0) 没 pnpm 就先装:corepack enable 优先(快、不联网),不行再 npm i -g pnpm。
      if (!(await this.pnpmAvailable())) {
        let installed = false
        for (const cmd of ['corepack enable', 'npm install -g pnpm']) {
          const r = await this.runShell(cmd)
          if (r.outcome.exitCode === 0) { installed = true; break }
        }
        if (installed && await this.pnpmAvailable()) fixed.push('已装好 pnpm')
        else remaining.push('没装 pnpm,本机也装不了(corepack/npm 都没有);请先装 Node.js 再点一次。')
      }
      // 0.5) 清掉"没有 dsh.bundle 却被塞进启用名单"的条目 —— 这会让 dsh 下次启动直接崩。
      const badBundles: string[] = []
      for (const b of bundles) {
        if (b.startsWith('@deepseek-ai/')) continue
        if (!(await this.isBundlePackage(b))) badBundles.push(b)
      }
      if (badBundles.length > 0) {
        const snap = await this.snapshotProfile(dir)
        const cleaned = bundles.filter((b) => !badBundles.includes(b))
        p.dsh = p.dsh || {}
        ;(p.dsh as JsonObject).profile = (p.dsh as JsonObject).profile || {}
        ;((p.dsh as JsonObject).profile as JsonObject).bundles = cleaned
        await this.writeProfile(p)
        try {
          const check = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as JsonObject
          const checkBundles = ((check.dsh as JsonObject | undefined)?.profile as JsonObject | undefined)?.bundles
          if (!Array.isArray(checkBundles) || badBundles.some((b) => checkBundles.includes(b))) throw new Error('cleanup not persisted')
          bundles = cleaned
          fixed.push(`已把 ${badBundles.join('、')} 移出启用名单(没有 dsh.bundle,留着会导致 dsh 起不来)`)
        } catch {
          await this.restoreProfile(dir, snap)
          remaining.push('清理无效启用条目失败,已还原;请手动编辑 profile 的 dsh.profile.bundles 删掉这些名字。')
        }
      }
      // 1) 装了但没启用的第三方 bundle 插件 → 启用(client-only 插件跳过,市场不自动塞)。
      const toEnable: string[] = []
      for (const name of deps) {
        if (name.startsWith('@deepseek-ai/')) continue
        if (bundles.includes(name)) continue
        if (!(await this.isBundlePackage(name))) continue
        toEnable.push(name)
      }
      if (toEnable.length > 0) {
        const snap = await this.snapshotProfile(dir)
        p.dsh = p.dsh || {}
        ;(p.dsh as JsonObject).profile = (p.dsh as JsonObject).profile || {}
        ;((p.dsh as JsonObject).profile as JsonObject).bundles = [...bundles, ...toEnable]
        await this.writeProfile(p)
        try {
          const check = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as JsonObject
          const checkBundles = ((check.dsh as JsonObject | undefined)?.profile as JsonObject | undefined)?.bundles
          if (!Array.isArray(checkBundles) || !toEnable.every((n) => checkBundles.includes(n))) throw new Error('bundles not persisted')
          fixed.push(`已启用 ${toEnable.join('、')}`)
        } catch {
          await this.restoreProfile(dir, snap)
          remaining.push('启用插件失败,已还原;请重启 dsh 后重试。')
        }
      }
      // 1.5) client-only 插件(主题/UI)没注册 insert → 自动注册,重启即生效。
      const clientNames = await this.clientInsertNames()
      const clientToInsert: string[] = []
      for (const name of deps) {
        // 注意:不能按 `@deepseek-ai/` 前缀跳过 —— 有些第三方主题(如 Aqua)故意
        // 借官方 scope 命名,跳过会让"一键修复"漏掉它们。isClientOnlyPackage
        // 已经只对真正的 client-only 插件放行。
        if (bundles.includes(name)) continue
        if (clientNames.has(name)) continue
        if (await this.isClientOnlyPackage(name)) clientToInsert.push(name)
      }
      for (const name of clientToInsert) {
        await this.upsertClientInsert(name)
        fixed.push(`已注册 ${name}(主题/界面插件,自动写入 cordis.patch.yml)`)
      }
      // 1.6) 手抄重复:profile 的 cordis.patch.yml 里 insert 的行 id 若已被某启用
      // 插件自带 patch 声明,是 id 冲突、会让 dsh 起不来 —— 删掉手抄行,插件照常加载。
      const ownedIds = await this.installedPatchIds()
      if (ownedIds.size > 0) {
        const patches = await this.readPatches()
        let removedAny = false
        const removedIds: string[] = []
        const cleaned = patches.map((patch) => {
          if (!patch || typeof patch !== 'object') return patch
          const insert = (patch as { insert?: unknown[] }).insert
          if (!Array.isArray(insert)) return patch
          const kept = insert.filter((row) => {
            if (!(row && typeof row === 'object')) return true
            const rid = (row as { id?: unknown }).id
            if (typeof rid === 'string' && ownedIds.has(rid)) { removedIds.push(rid); removedAny = true; return false }
            return true
          })
          ;(patch as { insert: unknown[] }).insert = kept
          return patch
        }).filter((patch) => {
          if (!patch || typeof patch !== 'object') return true
          const insert = (patch as { insert?: unknown[] }).insert
          const hasOtherKeys = Object.keys(patch as object).some((k) => k !== 'insert')
          if (!Array.isArray(insert)) return true
          if (insert.length === 0 && !hasOtherKeys) return false
          return true
        })
        if (removedAny) {
          await this.writePatches(cleaned)
          fixed.push(`已删掉 cordis.patch.yml 里手抄重复的挂载行 id:${[...new Set(removedIds)].join('、')}(插件自带补丁会自动挂载)`)
        }
      }
      // 2) 缺失的 peer 依赖 / 缺包文件 → pnpm install 一次补全。
      const missingPeers = new Set<string>()
      let missingPkg = false
      for (const name of deps) {
        try {
          const meta = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { peerDependencies?: Record<string, string>; peerDependenciesMeta?: Record<string, { optional?: boolean }> }
          for (const pd of Object.keys(meta.peerDependencies || {})) {
            if (meta.peerDependenciesMeta?.[pd]?.optional) continue
            if (pd.startsWith('@deepseek-ai/')) continue
            if (!(await this.moduleProvided(pd))) missingPeers.add(pd)
          }
        } catch { missingPkg = true }
      }
      if (missingPeers.size > 0 || missingPkg) {
        const r = await this.pnpmShell('pnpm install', dir)
        if (r.outcome.exitCode === 0) {
          fixed.push('已补装缺失依赖' + (missingPeers.size ? `:${[...missingPeers].join('、')}` : ''))
        } else {
          remaining.push(`依赖补装失败(网络或 pnpm 问题):${[...missingPeers].join('、') || '缺包文件'}。开代理后再点一次,或手动 dsh plugin add。`)
        }
      }
      this.invalidateListCache()
      // 修完再查一遍:把仍然存在、且修不了的问题,原样列给用户(详情在体检报告里)。
      const hc = await this.healthCheck()
      if (hc.ok === true && Array.isArray(hc.issues)) {
        for (const it of hc.issues as Array<{ level: string; title: string; fixable?: boolean }>) {
          if (it.level === 'ok' || it.fixable) continue
          if (!remaining.includes(it.title)) remaining.push(it.title)
        }
      }
      if (fixed.length === 0 && remaining.length === 0) return { ok: true, fixed, remaining, message: '没有需要修复的问题。' }
      const msg = `修复 ${fixed.length} 项。` + (remaining.length ? `还有 ${remaining.length} 项修不了,需要你手动处理(见体检报告):${remaining.slice(0, 3).join(';')}${remaining.length > 3 ? '…' : ''}` : '全部修复完毕。')
      return { ok: true, fixed, remaining, message: msg }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  // ── one-click star ─────────────────────────────────────────────────────

  private tokenValue: string | null = null
  private tokenResolved = false
  private tokenPromise: Promise<string | null> | null = null

  /**
   * GitHub REST call with an optional Bearer token. Uses curl with argv
   * (no shell interpolation), so the token can never break quoting or leak
   * into a log line.
   */
  private async ghApi(method: string, path: string, token?: string): Promise<{ status: number; body: string; error?: string }> {
    const proxy = this.proxyDown ? null : await this.loadProxy()
    const proxyArgs = proxy ? ['--proxy', proxy] : []
    let curl = 'curl'
    try { curl = await this.subprocess.resolveExecutable('curl') } catch { curl = '' }
    if (!curl) return { status: 0, body: '', error: 'curl not available' }
    const argv = [curl, ...proxyArgs, '-s', '-L', '--max-time', '5', '-w', '\n%{http_code}', '-H', 'User-Agent: zat-dsh-engine/0.3.1', '-H', 'Accept: application/vnd.github+json', '-X', method]
    if (token) argv.push('-H', `Authorization: Bearer ${token}`)
    argv.push('https://api.github.com' + path)
    const handle = await this.winHiddenSpawn(argv, { graceMs: 60000 })
    const outcome = await handle.done
    let stdout = ''
    let stderr = ''
    if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || ''
    if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || ''
    if (outcome.exitCode === 0) {
      const lines = String(stdout).trimEnd().split('\n')
      const status = Number(lines.pop())
      if (Number.isFinite(status) && status > 0) { if (status === 0) this.proxyDown = true; return { status, body: lines.join('\n') } }
      return { status: 200, body: lines.join('\n') }
    }
    this.proxyDown = true
    if (stderr.trim()) return { status: 0, body: '', error: stderr.trim().slice(0, 200) }
    return { status: 0, body: '', error: 'curl failed' }
  }

  /** Ask the local git credential helper for the github.com token — NEVER prompts. */
  private async gitCredentialToken(): Promise<string | null> {
    let git = 'git'
    try { git = await this.subprocess.resolveExecutable('git') } catch { git = '' }
    // 启动器自举的 PortableGit(机器没装 git 时):%TEMP%\zat-tools\git\cmd\git.exe
    if (!git && process.env.TEMP) {
      const ztGit = join(process.env.TEMP, 'zat-tools', 'git', 'cmd', 'git.exe')
      if (existsSync(ztGit)) git = ztGit
    }
    if (!git) return null
    try {
      // credential.interactive=false: 只读已保存的凭据,绝不弹登录窗/浏览器。
      const handle = await this.winHiddenSpawn(
        [git, '-c', 'credential.interactive=false', 'credential', 'fill'],
        { stdin: 'protocol=https\nhost=github.com\n\n', stdoutMax: 64 * 1024, stderrMax: 16 * 1024, graceMs: 30000 },
      )
      const outcome = await handle.done
      if (outcome.exitCode !== 0) return null
      const out = handle.collected?.stdout ? handle.collected.stdout.readFrom(0).text || '' : ''
      const line = out.split(/\r?\n/).find((l) => l.startsWith('password='))
      const pw = line ? line.slice('password='.length).trim() : ''
      return pw || null
    } catch { return null }
  }

  /**
   * Token only from non-interactive sources (env / market config). Used by the
   * automatic search & health paths — they must never touch `git credential
   * fill`, whose credential manager pops a GitHub login window when the user
   * has no stored credentials.
   */
  private async resolveConfiguredToken(): Promise<string | null> {
    try {
      const envTok = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
      if (envTok && envTok.trim()) return envTok.trim()
      const dir = await this.getProfileDir()
      const cfg = JSON.parse(readFileSync(join(dir, 'zat-market.json'), 'utf8')) as JsonObject
      if (typeof cfg.githubToken === 'string' && cfg.githubToken.trim()) return cfg.githubToken.trim()
    } catch { /* no config */ }
    return null
  }

  /** Resolve a GitHub token: env → local profile config → git credential helper (non-interactive). Cached. */
  private resolveToken(): Promise<string | null> {
    if (this.tokenResolved) return Promise.resolve(this.tokenValue)
    if (this.tokenPromise) return this.tokenPromise
    this.tokenPromise = (async () => {
      try {
        const configured = await this.resolveConfiguredToken()
        if (configured) return configured
        return await this.gitCredentialToken()
      } catch { return null }
    })().then((t) => {
      this.tokenValue = t
      this.tokenResolved = true
      return t
    })
    return this.tokenPromise
  }

  @Remote('star')
  async starToggle(owner: string, repo: string): Promise<JsonObject> {
    try {
      const o = safeSegment(owner)
      const r = safeSegment(repo)
      if (!o || !r) return { ok: false, message: 'invalid repository name' }
      const token = await this.resolveToken()
      if (!token) {
        return {
          ok: false,
          needToken: true,
          message: '一键星标需要已保存的 GitHub 凭据或 Token,本机还没有。可在市场底部填一个 GitHub Token 后再点星;不会强制你登录。',
        }
      }
      const cur = await this.ghApi('GET', `/user/starred/${o}/${r}`, token)
      if (cur.status !== 204 && cur.status !== 404) {
        if (cur.status === 401 || cur.status === 403) return { ok: false, message: 'GitHub 拒绝了这个凭据(401/403)。请在市场底部重新填一个有效的 GitHub Token。' }
        return { ok: false, message: `GitHub API 错误:${cur.status}${cur.error ? ' ' + cur.error : ''}` }
      }
      const starred = cur.status === 204
      const act = await this.ghApi(starred ? 'DELETE' : 'PUT', `/user/starred/${o}/${r}`, token)
      if (act.status === 204) return { ok: true, starred: !starred, message: starred ? `已取消星标 ${o}/${r}` : `已星标 ⭐ ${o}/${r}` }
      if (act.status === 401 || act.status === 403) return { ok: false, message: 'GitHub 拒绝了这个凭据(401/403)。请在市场底部重新填一个有效的 GitHub Token。' }
      return { ok: false, message: `星标操作失败:${act.status}${act.error ? ' ' + act.error : ''}` }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('starredList')
  async starredList(): Promise<JsonObject> {
    try {
      const token = await this.resolveToken()
      if (!token) return { ok: false, message: 'no github token available' }
      const names: string[] = []
      for (let page = 1; page <= 20; page++) {
        const r = await this.ghApi('GET', `/user/starred?per_page=100&page=${page}`, token)
        if (r.status !== 200) {
          if (page === 1) {
            if (r.status === 401 || r.status === 403) return { ok: false, message: 'GitHub 拒绝了这个凭据。请在市场底部重新填一个有效的 GitHub Token。' }
            return { ok: false, message: `GitHub API 错误:${r.status}` }
          }
          break
        }
        let arr: unknown[] = []
        try { arr = JSON.parse(r.body) as unknown[] } catch { break }
        const list = Array.isArray(arr) ? arr : []
        for (const it of list) {
          const f = (it as { full_name?: unknown })?.full_name
          if (typeof f === 'string' && f) names.push(f.toLowerCase())
        }
        if (list.length < 100) break
      }
      return { ok: true, starred: names }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('setToken')
  async setToken(token: string): Promise<JsonObject> {
    try {
      const t = String(token || '').trim()
      if (t.length > 200) return { ok: false, message: 'token too long' }
      const dir = await this.getProfileDir()
      const cfgPath = join(dir, 'zat-market.json')
      let cfg: JsonObject = {}
      try { cfg = JSON.parse(readFileSync(cfgPath, 'utf8')) as JsonObject } catch { /* new file */ }
      if (t) { cfg.githubToken = t } else { delete cfg.githubToken }
      await this.writeFileText(cfgPath, JSON.stringify(cfg, null, 2))
      this.tokenValue = null
      this.tokenResolved = false
      this.tokenPromise = null
      return { ok: true, hasToken: Boolean(t), message: t ? 'Token 已保存(只存在本机 profile 目录的 zat-market.json,不会上传)' : 'Token 已清除' }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }
}

export default ZatMarketGateway
