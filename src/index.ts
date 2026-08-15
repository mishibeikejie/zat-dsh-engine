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
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import bundledZh from '../data/zh-intro.json'
import bundledKinds from '../data/kinds.json'

/** Host platform facts (this package is a plain Node ESM module). */
const IS_WIN = process.platform === 'win32'

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
  const re = side === 'host'
    ? /(?:provide|service)\s*\(\s*['"]([^'"]{3,})['"]/g
    : /register\s*\(\s*['"]([^'"]{3,})['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(String(text || ''))) !== null) names.add(m[1]!)
  return names
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

interface LlmChunk {
  type?: string
  text?: string
}

interface LlmFace {
  listProviders(): unknown
  stream(opts: {
    provider: string
    model: string
    messages: unknown
    system: string
    maxTokens: number
    temperature: number
  }): AsyncIterable<LlmChunk>
}

interface ModelSelection {
  provider: string
  model: string
}

interface ModelSelectionFace {
  currentSelection(): { provider?: string; model?: string } | undefined
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

const TTL = 10 * 60 * 1000
const ZH_TTL = 365 * 24 * 60 * 60 * 1000
const MIRROR = 'https://gh-proxy.com/'
const SELF_REPO = 'mishibeikejie/zat-dsh-engine'
const SELF_VERSION = '0.4.1'

const CATEGORY_QUERY: Record<string, string> = {
  '全部': '',
  '皮肤 / 主题': '(theme OR skin OR wallpaper OR web-ui OR ui-theme)',
  '工具 / 终端': '(tool OR tools OR utils OR utility OR cli OR tui OR terminal OR console)',
  '浏览器 / 自动化': '(browser OR playwright OR chrome OR firefox OR webkit OR selenium OR automation OR workflow)',
  '技能 Skills': '(skill OR skills OR prompt)',
  '视觉 / 多媒体': '(vision OR ocr OR image OR video OR multimodal OR render OR media OR hyperframe OR audio OR voice OR tts OR speech)',
  '网络 / MCP': '(network OR http OR api OR server OR mcp OR web OR fetch)',
  '多智能体 / 编排': '(multi-agent OR orchestration OR swarm OR agent-framework)',
  '数据 / 存储 / 记忆': '(data OR database OR sqlite OR storage OR query OR memory OR context)',
  '硬件 / 桌面': '(gpu OR cuda OR nvidia OR hardware OR vram OR ollama OR launcher OR tray OR autostart OR webview OR desktop)',
  '设计 / 文档': '(design OR figma OR ui OR prototype OR doc OR handbook OR tutorial OR guide OR manual OR wiki)',
  '安全 / 通知': '(security OR sandbox OR permission OR audit OR notification OR message OR telegram OR wechat OR slack OR discord)',
}

function encodeQueryPart(s: string): string {
  // Full percent-encoding keeps every character the user types (Chinese,
  // %, &, #, +, …) inside the query value instead of breaking the URL or
  // being parsed as a GitHub query operator. Quotes and backslashes are
  // query operators with no useful literal meaning in a market search, so
  // they degrade to spaces; otherwise GitHub answers "Validation Failed" 400.
  return encodeURIComponent(String(s).replace(/["\\]/g, ' ')).replace(/%20/g, '+')
}

/** Reject anything that is not a plain GitHub owner/repo segment. */
function safeSegment(value: string): string {
  const v = String(value || '').trim()
  return /^[\w.-]+$/.test(v) ? v : ''
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

export class ZatMarketGateway extends TypertRemoteService {
  static inject = ['subprocess']

  private readonly subprocess: SubprocessFace
  private readonly llm: LlmFace | undefined

  private home: string | null = null
  private profileDirValue: string | null = null
  private profileNameValue: string | null = null
  private zhCacheFile: string | null = null
  private cacheDirty = false
  private mirrorDown = false
  private directDown = false
  private zhLoaded = false
  private llmUsable: boolean | null = null

  private readonly caches = new Map<string, { at: number; data: unknown }>()
  private readonly zhCache = new Map<string, { at: number; zh: string }>()
  /** Repo kind (plugin/nonplugin/multi/skill) merged from bundled data + live scan. */
  private readonly kindCache = new Map<string, string>()
  private kindScanStarted = false

  constructor(ctx: Context) {
    super(ctx, 'pluginMarket')
    this.subprocess = this.ctx.get('subprocess') as unknown as SubprocessFace
    this.llm = this.ctx.get('llm') as unknown as LlmFace | undefined
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private shellCwd(): string {
    return IS_WIN ? 'C:\\' : '/'
  }

  /** Spawn one shell command line; returns the live handle for streaming reads. */
  private async spawnShell(command: string, cwd?: string): Promise<SpawnHandle> {
    let argv: string[]
    if (IS_WIN) {
      let exe = 'powershell.exe'
      try { exe = await this.subprocess.resolveExecutable('powershell.exe') } catch { /* keep fallback */ }
      argv = [exe, '-NoProfile', '-NonInteractive', '-Command', command]
    } else {
      let sh = '/bin/sh'
      try { sh = await this.subprocess.resolveExecutable('sh') } catch { /* keep fallback */ }
      argv = [sh, '-c', command]
    }
    return this.subprocess.spawn({
      argv,
      cwd: cwd || this.shellCwd(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 8 * 1024 * 1024 }, stderr: { maxBytes: 1024 * 1024 } },
      graceMs: 120000,
    })
  }

  /** Run one shell command line on the host platform. */
  private async runShell(command: string, cwd?: string): Promise<{ outcome: { exitCode: number }; stdout: string; stderr: string }> {
    const handle = await this.spawnShell(command, cwd)
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
        const meta = JSON.parse(rootPkg.body) as { dsh?: { bundle?: { patch?: string } } }
        return meta.dsh?.bundle?.patch ? 'plugin' : 'nonplugin'
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
      const inst = this.installedMap(p)
      // Already installed? Then this is a reinstall / update of an existing
      // pair member — updating it must not be blocked (the pair is not new).
      for (const rec of Object.values(inst)) {
        if ((rec.owner + '/' + rec.repo).toLowerCase() === candidateRepo) return null
        if (candidatePkg && rec.name === candidatePkg) return null
      }
      const conflicts: string[] = []
      for (const rec of Object.values(inst)) {
        const isMarket = KNOWN_MARKET_REPOS[(rec.owner + '/' + rec.repo).toLowerCase()] !== undefined
          || Object.values(KNOWN_MARKET_REPOS).includes(rec.name)
          || isMarketishName(rec.name)
        if (isMarket) conflicts.push(rec.name)
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
  private async fetchCandidateTexts(owner: string, repo: string, subdir?: string): Promise<{ hostText: string; clientText: string; meta: { name?: string; main?: string; exports?: Record<string, string | { default?: string }>; dependencies?: Record<string, string>; peerDependencies?: Record<string, string>; dsh?: { bundle?: { patch?: string } } } } | null> {
    const base = subdir ? `${subdir}/` : ''
    const pkgRes = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${base}package.json`)
    if (pkgRes.status !== 200) return null
    let meta: { name?: string; main?: string; exports?: Record<string, string | { default?: string }>; dependencies?: Record<string, string>; peerDependencies?: Record<string, string>; dsh?: { bundle?: { patch?: string } } } = {}
    try { meta = JSON.parse(pkgRes.body) as typeof meta } catch { return null }
    const candidates = [meta.main]
    for (const v of Object.values(meta.exports || {})) {
      if (typeof v === 'string') candidates.push(v)
      else if (v && typeof v === 'object' && typeof v.default === 'string') candidates.push(v.default)
    }
    candidates.push('lib/host.js', 'lib/index.js', 'dist/index.js', 'lib/client.js', 'dist/client.js')
    let hostText = ''
    let clientText = ''
    for (const rel of [...new Set(candidates)]) {
      if (!rel || rel.includes('*') || rel.startsWith('http')) continue
      const r = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${base}${rel}`)
      if (r.status === 200) {
        if (/client/i.test(rel)) { clientText += '\n' + r.body } else { hostText += '\n' + r.body }
      }
    }
    if (meta.dsh?.bundle?.patch) {
      const pr = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${base}${meta.dsh.bundle.patch}`)
      if (pr.status === 200) hostText += '\n' + pr.body
    }
    return { hostText, clientText, meta }
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
      const inst = this.installedMap(p)
      for (const rec of Object.values(inst)) {
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
   * Pre-install conflict analysis against the candidate repo's manifest and
   * code. Hard problems block the install; soft problems become warnings.
   */
  private async analyzeCandidateConflicts(owner: string, repo: string, subdir?: string): Promise<{ block: string[]; warn: string[] }> {
    const block: string[] = []
    const warn: string[] = []
    const f = await this.fetchCandidateTexts(owner, repo, subdir)
    if (!f) return { block, warn }
    const meta = f.meta
    // (1) Official packages must be peers, never direct deps — a direct dep
    // installs a second copy and hijacks the official loader rows.
    for (const d of Object.keys(meta.dependencies || {})) {
      if (d.startsWith('@deepseek-ai/')) block.push(`官方包${d}应为peer依赖`)
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
    return { block, warn }
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
   * system proxy from the registry and exports it; Linux inherits HTTP_PROXY
   * from the environment naturally). When direct GitHub is known to be down
   * (this.directDown), the mirror rewrite is applied from the start so users
   * without a VPN do not burn a doomed direct attempt; otherwise the mirror
   * retry runs only after the direct attempt fails. The mirror rewrite maps
   * github.com URLs onto gh-proxy.com through per-process GIT_CONFIG_*
   * variables, touching no global git configuration.
   * When onProgress is given, stdout is streamed to it while pnpm runs.
   */
  private async pnpmShell(command: string, dir: string, onProgress?: (accumulatedStdout: string) => void): Promise<{ outcome: { exitCode: number }; stdout: string; stderr: string }> {
    const mirrorWin = "$env:GIT_CONFIG_COUNT=1; $env:GIT_CONFIG_KEY_0='url.https://gh-proxy.com/https://github.com/.insteadOf'; $env:GIT_CONFIG_VALUE_0='https://github.com/';"
    const mirrorLin = "export GIT_CONFIG_COUNT=1; export GIT_CONFIG_KEY_0='url.https://gh-proxy.com/https://github.com/.insteadOf'; export GIT_CONFIG_VALUE_0='https://github.com/';"
    let full: string
    if (IS_WIN) {
      const proxySetup = [
        "$p=Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -ErrorAction SilentlyContinue;",
        'if($p -and $p.ProxyEnable -eq 1 -and $p.ProxyServer){',
        '  $s=\'\'+$p.ProxyServer;',
        '  if($s -notmatch \'^https?://\'){ $s=\'http://\'+$s };',
        '  $env:HTTPS_PROXY=$s; $env:HTTP_PROXY=$s; $env:ALL_PROXY=$s;',
        '  $env:NO_PROXY=\'localhost,127.0.0.1\';',
        '};',
      ].join(' ')
      if (this.directDown) {
        full = proxySetup + mirrorWin + command
      } else {
        full = proxySetup + command + '; if ($LASTEXITCODE -ne 0) { ' + mirrorWin + command + ' }'
      }
    } else {
      full = this.directDown ? mirrorLin + command : command + ' || { ' + mirrorLin + command + ' }'
    }
    if (!onProgress) return this.runShell(full, dir)
    // Streaming variant: poll collected stdout while the command runs.
    const handle = await this.spawnShell(full, dir)
    let offset = 0
    let done = false
    while (!done) {
      const settled = await Promise.race([
        handle.done.then(() => true),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 600)),
      ])
      if (handle.collected?.stdout) {
        const text = handle.collected.stdout.readFrom(offset).text || ''
        if (text) { offset += text.length; onProgress(text) }
      }
      done = settled
    }
    const outcome = await handle.done
    let stdout = ''
    let stderr = ''
    if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || ''
    if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || ''
    return { outcome, stdout, stderr }
  }

  private async getHome(): Promise<string> {
    if (this.home) return this.home
    const env = process.env.DSH_HOME
    const base = env && env.trim() ? env.trim() : join(process.env.HOME || process.env.USERPROFILE || (IS_WIN ? 'C:\\Users' : '/root'), '.dsh')
    this.home = base
    return this.home
  }

  private async getProfileName(): Promise<string> {
    if (this.profileNameValue) return this.profileNameValue
    const envProfile = process.env.DSH_PROFILE
    if (envProfile && envProfile.trim()) {
      this.profileNameValue = envProfile.trim()
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

  /**
   * Read the effective HTTP proxy once. Windows: the system proxy from the
   * registry (what a VPN's system-proxy mode sets); other platforms: the
   * HTTP(S)_PROXY environment the process inherited.
   */
  private proxyUrl: string | null = null
  private proxyLoaded = false

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
    if (proxy) {
      const r = await this.curlGet(url, proxy, '30')
      if (r.status > 0) return r
      lastError = r.error || ''
    }
    const direct = await this.curlGet(url, null, '10')
    if (direct.status > 0) return direct
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
    const handle = this.subprocess.spawn({
      argv,
      cwd: this.shellCwd(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 16 * 1024 * 1024 }, stderr: { maxBytes: 1024 * 1024 } },
      graceMs: 60000,
    })
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
    const handle = this.subprocess.spawn({
      argv: [wget, '-q', '-O-', '--server-response', '--timeout=12', '--max-redirect=5', '-U', 'zat-dsh-engine/0.3.1', url],
      cwd: this.shellCwd(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 16 * 1024 * 1024 }, stderr: { maxBytes: 1024 * 1024 } },
      graceMs: 60000,
    })
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
      const timer = setTimeout(() => controller.abort(), 10000)
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
    if (!this.directDown) {
      const r = await this.httpGet(url)
      if (r.status === 200) return r
      // A definitive HTTP answer (404/403/…) is the same on the mirror —
      // return it instead of burning three more requests.
      if (r.status >= 400) return r
      lastError = r.error || ''
      this.directDown = true
    }
    if (!this.mirrorDown) {
      const mr = await this.httpGet(MIRROR + url)
      if (mr.status === 200) return mr
      if (mr.status >= 400) return mr
      lastError = mr.error || lastError
      this.mirrorDown = true
    }
    const r2 = await this.httpGet(url)
    if (r2.status === 200) { this.directDown = false; return r2 }
    lastError = r2.error || lastError
    const mr2 = await this.httpGet(MIRROR + url)
    if (mr2.status === 200) { this.mirrorDown = false; return mr2 }
    lastError = mr2.error || lastError
    return { status: 0, body: '', error: lastError }
  }

  private async readProfile(): Promise<JsonObject> {
    const dir = await this.getProfileDir()
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as JsonObject
  }

  private async writeProfile(obj: JsonObject): Promise<void> {
    const dir = await this.getProfileDir()
    await this.writeFileText(join(dir, 'package.json'), JSON.stringify(obj, null, 2))
  }

  private installedMap(p: JsonObject): Record<string, { name: string; spec: string; owner?: string; repo?: string; subdir?: string; enabled: boolean }> {
    const map: Record<string, { name: string; spec: string; owner?: string; repo?: string; subdir?: string; enabled: boolean }> = {}
    const deps = (p.dependencies || {}) as Record<string, string>
    // Only bundle packages that are also listed in dsh.profile.bundles are
    // actually loaded by the dsh loader; a dependency missing from bundles
    // installs but never activates.
    const bundles: string[] = Array.isArray((p.dsh as JsonObject | undefined)?.profile && ((p.dsh as JsonObject).profile as JsonObject).bundles)
      ? ((p.dsh as JsonObject).profile as JsonObject).bundles as string[]
      : []
    for (const key of Object.keys(deps)) {
      const spec = String(deps[key] || '')
      const rec: { name: string; spec: string; owner?: string; repo?: string; subdir?: string; enabled: boolean } = { name: key, spec, enabled: bundles.includes(key) }
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

  private modelSelection(): ModelSelection {
    try {
      const adm = this.ctx.get('agentDefaultModel') as unknown as ModelSelectionFace | undefined
      if (adm && typeof adm.currentSelection === 'function') {
        const sel = adm.currentSelection()
        if (sel && sel.provider && sel.model) return { provider: sel.provider, model: sel.model }
      }
    } catch { /* fall through */ }
    return { provider: 'deepseek-official', model: 'deepseek-v4-pro' }
  }

  private checkLlmUsable(): boolean {
    if (this.llmUsable !== null) return this.llmUsable
    if (!this.llm) { this.llmUsable = false; return false }
    try {
      const providers = this.llm.listProviders()
      const sel = this.modelSelection()
      this.llmUsable = Array.isArray(providers)
        && providers.some((p) => (p as { id?: string } | null)?.id === sel.provider)
    } catch { this.llmUsable = false }
    return this.llmUsable
  }

  private async translateBatch(batch: Array<{ fullName: string; description: string }>): Promise<Record<string, string>> {
    if (!this.llm || !this.checkLlmUsable()) return {}
    const sel = this.modelSelection()
    const lines = batch.map((it, i) => `${i}. ${it.fullName}\n   简介: ${(it.description || '').slice(0, 200) || '(无描述,请根据名称判断用途)'}`).join('\n')
    const system = '你是插件市场的文案编辑。为下列每个插件写一句中文简介,要求:1) 20~40字,一句话,直白说清这个插件是干什么的、对用户有什么用;2) 面向普通用户,避免堆砌英文术语,必要的专有名词保留;3) 只输出一个 JSON 对象,键是序号,值是中文简介,不要任何解释、注释或代码块。'
    const messages = [{ id: 'zat-zh-batch', role: 'user', content: [{ type: 'text', text: lines }], source: { kind: 'user' } }]
    try {
      let out = ''
      for await (const chunk of this.llm.stream({ provider: sel.provider, model: sel.model, messages, system, maxTokens: 1200, temperature: 0.3 })) {
        if (chunk && chunk.type === 'text-delta' && chunk.text) out += chunk.text
      }
      let json: JsonObject | null = null
      try {
        json = JSON.parse(out.replace(/```json|```/g, '').trim()) as JsonObject
      } catch {
        const m = (out || '').match(/\{[\s\S]*\}/)
        if (m) { try { json = JSON.parse(m[0]) as JsonObject } catch { /* ignore */ } }
      }
      const result: Record<string, string> = {}
      if (json && typeof json === 'object') {
        for (let i = 0; i < batch.length; i++) {
          const v = json[String(i)] ?? json[i]
          if (typeof v === 'string' && v.trim()) result[batch[i].fullName] = v.trim().slice(0, 80)
        }
      }
      return result
    } catch {
      this.llmUsable = false
      return {}
    }
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

  private async addSpec(owner: string, repo: string, subdir?: string, taskId?: string, preAnalysis?: { block: string[]; warn: string[] }): Promise<{ ok: boolean; packageName: string | null; message?: string; warning?: string }> {
    const o = safeSegment(owner)
    const repoName = safeSegment(repo)
    const s = subdir === undefined ? undefined : safeSubdir(subdir)
    if (!o || !repoName || s === null) return { ok: false, packageName: null, message: 'invalid repository name or subdirectory' }
    const spec = s ? `github:${o}/${repoName}#path:${s}` : 'github:' + o + '/' + repoName
    const dir = await this.getProfileDir()
    const gate = await this.checkMarketConflict(o, repoName)
    if (gate) return { ok: false, packageName: null, message: gate }
    const analysis = preAnalysis || await this.analyzeCandidateConflicts(o, repoName, s || undefined)
    if (analysis.block.length > 0) {
      return { ok: false, packageName: null, message: `安装已拦截:${analysis.block.join(';')}。确要强制安装请用官方命令。` }
    }
    const warnings = analysis.warn.length > 0 ? analysis.warn.join('; ') : undefined
    this.invalidateListCache()
    const snap = await this.snapshotProfile(dir)
    if (taskId) {
      this.setTaskStep(taskId, 'download', '正在下载安装包…')
      this.setTaskProgress(taskId, 12, '正在下载安装包…(已进行 0 秒)')
    }
    const startedAt = Date.now()
    const pnpmResult = await this.pnpmShell('pnpm add ' + spec, dir, taskId ? (text) => {
      // Surface pnpm's own progress line ("Progress: resolved X, downloaded Y…")
      const lines = String(text).split(/\r?\n/).filter(Boolean)
      let counts = ''
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]!
        if (line.includes('Progress:')) { counts = line.slice(line.indexOf('Progress:')).trim().slice(0, 70); break }
      }
      const secs = Math.floor((Date.now() - startedAt) / 1000)
      const pct = Math.min(82, 12 + secs * 2)
      this.setTaskProgress(taskId, pct, `正在下载安装包…(已进行 ${secs} 秒)${counts ? ' · ' + counts : ''}`)
    } : undefined)
    if (pnpmResult.outcome.exitCode !== 0) {
      await this.restoreProfile(dir, snap)
      const errText = String(pnpmResult.stderr || pnpmResult.stdout || '')
      if (errText.includes('PREPARE_NOT_ALLOWED') || errText.includes('allowBuilds') || errText.includes('build script')) {
        return {
          ok: false,
          packageName: null,
          message: `安装失败:该插件安装时需要运行构建脚本,被 pnpm 安全策略阻止(配置已自动还原)。请手动编辑 ${join(dir, 'pnpm-workspace.yaml')},在 allowBuilds 列表中加入该插件名后重试,或改用官方命令: dsh plugin --profile <你的profile> add ${spec}`,
        }
      }
      return { ok: false, packageName: null, message: (errText.slice(0, 2000) || 'pnpm failed') + ' — profile 配置已自动回滚到安装前状态' }
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
    for (const name of deps) {
      if (bundles.includes(name)) continue
      const specVal = String(((after.dependencies || {}) as Record<string, string>)[name] || '')
      if (!specVal.toLowerCase().includes(o.toLowerCase() + '/' + repoName.toLowerCase())) continue
      matched = true
      try {
        const meta = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { dsh?: { bundle?: { patch?: string } } }
        if (meta.dsh?.bundle?.patch) { bundles.push(name); added = name }
        else missingBundle = true
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
      return { ok: false, packageName: null, message: '安装完成,但该仓库没有声明 dsh.bundle,无法作为插件加载——它可能只是普通库或代码仓库,不是 dsh 插件。已作为普通依赖保留,重启也不会生效。' }
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
      const cacheKey = `list:${sortKey}:${pageNum}:${qText}:${cat}`
      const cached = this.cacheGet(cacheKey) as MarketListResult | null
      if (cached) return cached
      let query = 'topic:dsh-plugin'
      if (catQuery) query += '+' + encodeQueryPart(catQuery)
      if (qText) query += '+' + encodeQueryPart(qText)
      const url = `https://api.github.com/search/repositories?q=${query}&sort=${sortKey}&order=desc&per_page=100&page=${pageNum}`
      const r = await this.ghGet(url)
      if (r.status !== 200) return { ok: false, message: `GitHub 请求失败(${r.status})${r.status === 400 ? '。搜索词可能含特殊字符,换个说法试试' : ''}${r.error ? ' — ' + r.error : ''}。已依次尝试系统代理、直连、国内镜像 gh-proxy.com 和内置请求,全部失败。请确认网络可用;使用 VPN 时请用系统代理模式。` }
      let json: { items?: unknown[]; total_count?: number } | null = null
      try {
        json = JSON.parse(r.body) as { items?: unknown[]; total_count?: number } | null
      } catch {
        json = null
      }
      if (json === null || !Array.isArray(json.items)) return { ok: false, message: 'unexpected GitHub response' }
      let profile: JsonObject | null = null
      try { profile = await this.readProfile() } catch { profile = null }
      const inst = profile ? this.installedMap(profile) : {}
      await this.loadZhCache()
      const items = json.items.map((raw) => {
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
      }).filter((item) => item.fullName.toLowerCase() !== SELF_REPO) // hide the market's own card
      const data: MarketListResult = {
        ok: true,
        items,
        total: json.total_count || 0,
        hasMore: pageNum * 100 < (json.total_count || 0),
        page: pageNum,
        llmUsable: this.checkLlmUsable(),
        source: this.directDown ? 'mirror' : 'direct',
      }
      this.cacheSet(cacheKey, data)
      // Backfill kinds for repos the bundled snapshot does not know yet.
      void this.startKindScan(items.map((item) => ({ owner: item.owner, name: item.name, fullName: item.fullName })))
      return data
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('versions')
  async versions(): Promise<{ ok: boolean; map: Record<string, { local: string | null; remote: string | null; hasUpdate: boolean }> }> {
    const map: Record<string, { local: string | null; remote: string | null; hasUpdate: boolean }> = {}
    try {
      const p = await this.readProfile()
      const inst = this.installedMap(p)
      const seen: Record<string, boolean> = {}
      for (const key of Object.keys(inst)) {
        const entry = inst[key]
        if (!entry.owner || !entry.repo) continue
        const full = entry.owner + '/' + entry.repo
        if (seen[full]) continue
        seen[full] = true
        const local = await this.localVersion(entry.name)
        const remote = await this.remoteVersion(entry.owner, entry.repo, entry.subdir)
        // Lower-case key: the client indexes with the GitHub full name in
        // lower case, immune to owner/repo case drift in specs.
        map[full.toLowerCase()] = { local, remote, hasUpdate: !!(local && remote && local !== remote) }
      }
    } catch { /* empty map */ }
    return { ok: true, map }
  }

  @Remote('translate')
  async translate(items: Array<{ fullName?: string; description?: string }>): Promise<{ ok: boolean; map: Record<string, string>; llmUsable: boolean; pending: number }> {
    const list = Array.isArray(items) ? items : []
    const map: Record<string, string> = {}
    await this.loadZhCache()
    const pending: Array<{ fullName: string; description: string }> = []
    const seen: Record<string, boolean> = {}
    for (const it of list) {
      const key = String(it.fullName || '').toLowerCase()
      if (!key) continue
      const cached = this.zhCache.get(key)
      if (cached && Date.now() - cached.at < ZH_TTL) { map[it.fullName || key] = cached.zh; continue }
      if (seen[key]) continue
      seen[key] = true
      pending.push({ fullName: it.fullName || key, description: it.description || '' })
    }
    if (pending.length && this.checkLlmUsable()) {
      const BATCH = 12
      const CONCURRENCY = 3
      const batches: Array<typeof pending> = []
      for (let i = 0; i < pending.length; i += BATCH) batches.push(pending.slice(i, i + BATCH))
      let next = 0
      const worker = async (): Promise<void> => {
        while (next < batches.length) {
          const my = batches[next++]!
          const res = await this.translateBatch(my)
          for (const fullName of Object.keys(res)) {
            const zh = res[fullName]!
            this.zhCache.set(fullName.toLowerCase(), { at: Date.now(), zh })
            map[fullName] = zh
            this.cacheDirty = true
          }
        }
      }
      const workers: Promise<void>[] = []
      for (let w = 0; w < Math.min(CONCURRENCY, batches.length); w++) workers.push(worker())
      await Promise.all(workers)
      await this.saveZhCache()
    }
    return { ok: true, map, llmUsable: this.checkLlmUsable(), pending: pending.length - Object.keys(map).length }
  }

  @Remote('installed')
  async installed(): Promise<JsonObject> {
    try {
      const p = await this.readProfile()
      const inst = this.installedMap(p)
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
        harnessHasUpdate: isHarness && !!(harnessLocal && harnessRemote && harnessLocal !== harnessRemote),
      }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('selfupdate')
  async selfupdate(doUpdate: boolean): Promise<JsonObject> {
    const parts = SELF_REPO.split('/')
    const owner = parts[0]!
    const repo = parts[1]!
    if (!doUpdate) {
      const remote = await this.remoteVersion(owner, repo)
      if (!remote || remote === SELF_VERSION) return { ok: true, hasUpdate: false, current: SELF_VERSION, latestVersion: remote }
      // Ship a short "what changed" summary with the update notice: the newest
      // changelog block from the zh README, capped at a few bullets.
      let changes: string[] = []
      try {
        const readme = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.zh.md`)
        if (readme.status === 200) {
          const lines = readme.body.split(/\r?\n/)
          let inBlock = false
          for (const line of lines) {
            if (/^###\s+v/.test(line)) { inBlock = true; continue }
            if (inBlock) {
              if (/^##\s/.test(line) || /^###\s+/.test(line)) break
              if (line.startsWith('- ')) {
                changes.push(line.slice(2).trim())
                if (changes.length >= 6) break
              }
            }
          }
        }
      } catch { /* no changelog — the notice still shows the version */ }
      return { ok: true, hasUpdate: true, current: SELF_VERSION, latestVersion: remote, changes }
    }
    const spec = 'github:' + owner + '/' + repo
    const taskId = this.launchTask(async (id) => {
      this.setTaskStep(id, 'update', '正在下载市场新版本…')
      this.setTaskProgress(id, 8, '正在下载市场新版本…(网络慢时可能较久,请稍候)')
      const dir = await this.getProfileDir()
      const startedAt = Date.now()
      const r = await this.pnpmShell('pnpm add ' + spec, dir, () => {
        const secs = Math.floor((Date.now() - startedAt) / 1000)
        this.setTaskProgress(id, Math.min(80, 8 + secs * 2), `正在下载市场新版本…(已进行 ${secs} 秒)`)
      })
      if (r.outcome.exitCode !== 0) return { ok: false, message: (r.stderr || r.stdout || 'pnpm failed').slice(0, 2000) }
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
                  ? { ok: true, packageName: res.packageName, message: `已安装 ${only.name || o + '/' + r} — 重启 dsh 生效${res.warning ? '。风险提示:' + res.warning : ''}` }
                  : { ok: false, packageName: null, message: res.message }
              }, { owner: o, repo: r })
              return { ok: true, taskId }
            }
            return { ok: false, kind: 'multi', packages: sub.packages, message: '这个插件包含多个部分,请选择要安装的:' }
          }
          return { ok: false, message: '这个仓库不是可安装的 dsh 插件:里面没有找到插件声明(dsh.bundle)。它可能是一个技能包、工具库或代码仓库(只是打了 dsh-plugin 标签),无法通过市场一键安装。请到该仓库的 GitHub 页面查看它的使用方式。' }
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
        return res.ok
          ? { ok: true, packageName: res.packageName, message: `已安装 github:${o}/${r}${s ? `#path:${s}` : ''} — 重启 dsh 后生效${res.warning ? '。风险提示:' + res.warning : ''}` }
          : { ok: false, packageName: null, message: res.message }
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
        const version = await this.remoteVersion(o, r, s || undefined)
        return res.ok
          ? { ok: true, version, message: `已更新 github:${o}/${r}${s ? `#path:${s}` : ''} 到 v${version || '?'} — 重启 dsh 后生效${res.warning ? '。风险提示:' + res.warning : ''}` }
          : { ok: false, message: res.message }
      }, { owner: o, repo: r })
      return { ok: true, taskId }
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
  private get persistenceFace(): { list(): Promise<Array<{ id: string; createdAt: number; origin?: string }>>; locate(header: { id: string }): { kind: string; path: string } | undefined } | undefined {
    return this.ctx.get('sessionPersistence') as unknown as { list(): Promise<Array<{ id: string; createdAt: number; origin?: string }>>; locate(header: { id: string }): { kind: string; path: string } | undefined } | undefined
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
      sessions.sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      return { ok: true, sessions }
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
      return { ok: true, message: `已删除会话 ${id}${warning ? '。' + warning : ''}` }
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
      const inst = this.installedMap(p)
      const unique: Array<{ name: string; owner: string; repo: string; enabled: boolean; installing?: boolean; taskId?: string }> = []
      const seen = new Set<string>()
      for (const rec of Object.values(inst)) {
        let owner = rec.owner
        let repo = rec.repo
        if (!owner || !repo) {
          const known = Object.entries(KNOWN_MARKET_REPOS).find(([, pkg]) => pkg === rec.name)
          if (known) { const [full] = known; owner = full.split('/')[0]; repo = full.split('/')[1] }
        }
        if (!owner || !repo) continue // link:/unknown sources have no market card
        const key = (owner + '/' + repo).toLowerCase()
        if (key === SELF_REPO) continue // the market's own card stays hidden
        if (seen.has(key)) continue
        seen.add(key)
        unique.push({ name: rec.name, owner, repo, enabled: rec.enabled })
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
      let next = 0
      const worker = async (): Promise<void> => {
        while (next < unique.length) {
          const rec = unique[next++]!
          const fullName = rec.owner + '/' + rec.repo
          // Local truth first: the card must NEVER vanish because an API
          // call failed or the rate limit kicked in. Enrich when possible.
          let enriched: { name?: string; description?: string | null; stargazers_count?: number; forks_count?: number; language?: string | null; topics?: string[]; updated_at?: string; html_url?: string; homepage?: string | null } | null = null
          const repoRes = await this.ghGet(`https://api.github.com/repos/${fullName}`)
          if (repoRes.status === 200) {
            try { enriched = JSON.parse(repoRes.body) as typeof enriched } catch { enriched = null }
          }
          try {
            const it: { name?: string; description?: string | null; stargazers_count?: number; forks_count?: number; language?: string | null; topics?: string[]; updated_at?: string; html_url?: string; homepage?: string | null } = enriched || {}
            const cachedZh = this.zhCache.get(fullName.toLowerCase())
            const zhIntro = (cachedZh && Date.now() - cachedZh.at < ZH_TTL) ? cachedZh.zh : ''
            const item: JsonObject = {
              fullName,
              owner: rec.owner,
              name: it.name || rec.repo,
              description: it.description || '',
              zhIntro: zhIntro || '',
              needZh: !zhIntro,
              stars: it.stargazers_count || 0,
              forks: it.forks_count || 0,
              language: it.language || '',
              topics: Array.isArray(it.topics) ? it.topics : [],
              updatedAt: it.updated_at || '',
              htmlUrl: it.html_url || `https://github.com/${fullName}`,
              homepage: it.homepage || '',
              installed: rec.enabled,
              installedName: rec.name,
              installedVersion: null,
              isHarness: Boolean(HARNESS_REPOS.includes(fullName.toLowerCase())),
              disabled: Boolean(!rec.enabled),
              kind: this.kindOf(fullName.toLowerCase()),
              cover: 'https://opengraph.githubassets.com/1/' + fullName,
            }
            if (rec.installing) item.installing = true
            if (rec.taskId) item.taskId = rec.taskId
            items.push(item)
          } catch { /* skip unreadable repo json */ }
        }
      }
      const workers: Promise<void>[] = []
      for (let w = 0; w < 3; w++) workers.push(worker())
      await Promise.all(workers)
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
      if (enabled) {
        if (bundles.includes(n)) return { ok: true, enabled: true, message: `${n} 已经在启用列表中` }
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
  @Remote('healthCheck')
  async healthCheck(): Promise<JsonObject> {
    const issues: Array<{ level: string; title: string; detail: string }> = []
    try {
      const dir = await this.getProfileDir()
      const p = await this.readProfile()
      const deps = Object.keys((p.dependencies || {}) as Record<string, string>)
      const bundles = Array.isArray((p.dsh as JsonObject | undefined)?.profile && ((p.dsh as JsonObject).profile as JsonObject).bundles)
        ? ((p.dsh as JsonObject).profile as JsonObject).bundles as string[]
        : []
      interface Scanned { name: string; enabled: boolean; meta: { dependencies?: Record<string, string>; peerDependencies?: Record<string, string>; peerDependenciesMeta?: Record<string, { optional?: boolean }>; dsh?: { bundle?: { patch?: string } } }; patchIds: Set<string> }
      const scanned: Scanned[] = []
      for (const name of deps) {
        try {
          const meta = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as Scanned['meta']
          let patchIds = new Set<string>()
          if (meta.dsh?.bundle?.patch) {
            try { patchIds = extractPatchIds(readFileSync(join(dir, 'node_modules', name, meta.dsh.bundle.patch), 'utf8')) } catch { /* no patch file */ }
          }
          const enabled = bundles.includes(name) || name.startsWith('@deepseek-ai/')
          scanned.push({ name, enabled, meta, patchIds })
          for (const d of Object.keys(meta.dependencies || {})) {
            if (d.startsWith('@deepseek-ai/')) issues.push({ level: 'error', title: `${name} 把官方包 ${d} 写进了 dependencies`, detail: '官方包应使用 peerDependencies 引用;直接依赖会装出第二份拷贝并劫持官方 loader 行,可能让 dsh 起不来。建议反馈给插件作者。' })
          }
          for (const pd of Object.keys(meta.peerDependencies || {})) {
            if (meta.peerDependenciesMeta?.[pd]?.optional) continue // declared optional — not missing
            const provided = await this.moduleProvided(pd)
            if (!provided) issues.push({ level: 'warn', title: `${name} 需要的 peer 依赖 ${pd} 未安装`, detail: 'profile 关闭了自动安装 peer;这个依赖缺失时插件运行时可能报错。手动安装它或反馈给插件作者。' })
          }
          if (!enabled && !name.startsWith('@deepseek-ai/')) {
            issues.push({ level: 'info', title: `${name} 已停用`, detail: '已安装但不在启用名单,重启后不会加载。可在市场卡片上点「启用」。' })
          }
        } catch {
          issues.push({ level: 'warn', title: `找不到 ${name} 的包文件`, detail: '依赖名单里有它,但 node_modules 里没有。可能安装未完成,重装一次即可。' })
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
      // Multiple market/manager plugins.
      const inst = this.installedMap(p)
      const markets: string[] = []
      for (const rec of Object.values(inst)) {
        if (KNOWN_MARKET_REPOS[(rec.owner + '/' + rec.repo).toLowerCase()] !== undefined || Object.values(KNOWN_MARKET_REPOS).includes(rec.name) || isMarketishName(rec.name) || await this.scanLocalMarketish(rec.name)) markets.push(rec.name)
      }
      if (markets.length > 1) issues.push({ level: 'error', title: '装了多个市场/管理器插件', detail: markets.join('、') + ' 会互相覆盖设置页并注册冲突,建议只保留一个。' })
      if (issues.length === 0) issues.push({ level: 'ok', title: '体检通过', detail: '没有发现冲突、依赖矛盾或明显风险。' })
      return { ok: true, issues }
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
    const proxy = await this.loadProxy()
    const proxyArgs = proxy ? ['--proxy', proxy] : []
    let curl = 'curl'
    try { curl = await this.subprocess.resolveExecutable('curl') } catch { curl = '' }
    if (!curl) return { status: 0, body: '', error: 'curl not available' }
    const argv = [curl, ...proxyArgs, '-s', '-L', '--max-time', '30', '-w', '\n%{http_code}', '-H', 'User-Agent: zat-dsh-engine/0.3.1', '-H', 'Accept: application/vnd.github+json', '-X', method]
    if (token) argv.push('-H', `Authorization: Bearer ${token}`)
    argv.push('https://api.github.com' + path)
    const handle = this.subprocess.spawn({
      argv,
      cwd: this.shellCwd(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 16 * 1024 * 1024 }, stderr: { maxBytes: 1024 * 1024 } },
      graceMs: 60000,
    })
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
    return { status: 0, body: '', error: 'curl failed' }
  }

  /** Ask the local git credential helper for the github.com password/token. */
  private async gitCredentialToken(): Promise<string | null> {
    let git = 'git'
    try { git = await this.subprocess.resolveExecutable('git') } catch { return null }
    try {
      const handle = this.subprocess.spawn({
        argv: [git, 'credential', 'fill'],
        cwd: this.shellCwd(),
        stdio: { stdin: { data: 'protocol=https\nhost=github.com\n\n' }, stdout: { maxBytes: 64 * 1024 }, stderr: { maxBytes: 16 * 1024 } },
        graceMs: 30000,
      })
      const outcome = await handle.done
      if (outcome.exitCode !== 0) return null
      const out = handle.collected?.stdout ? handle.collected.stdout.readFrom(0).text || '' : ''
      const line = out.split(/\r?\n/).find((l) => l.startsWith('password='))
      const pw = line ? line.slice('password='.length).trim() : ''
      return pw || null
    } catch { return null }
  }

  /** Resolve a GitHub token: env → local profile config → git credential helper. Cached. */
  private resolveToken(): Promise<string | null> {
    if (this.tokenResolved) return Promise.resolve(this.tokenValue)
    if (this.tokenPromise) return this.tokenPromise
    this.tokenPromise = (async () => {
      try {
        const envTok = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
        if (envTok && envTok.trim()) return envTok.trim()
        try {
          const dir = await this.getProfileDir()
          const cfg = JSON.parse(readFileSync(join(dir, 'zat-market.json'), 'utf8')) as JsonObject
          if (typeof cfg.githubToken === 'string' && cfg.githubToken.trim()) return cfg.githubToken.trim()
        } catch { /* no local config */ }
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
          url: `https://github.com/${o}/${r}`,
          message: '一键星标需要 GitHub 凭据:本机没有可用的 git 凭据,也没有配置 Token。已在浏览器打开仓库页面,可以手动点星;或在市场底部填一个 GitHub Token 后再试。',
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
