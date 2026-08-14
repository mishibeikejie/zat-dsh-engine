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
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import bundledZh from '../data/zh-intro.json'
import bundledKinds from '../data/kinds.json'

/** Host platform facts (this package is a plain Node ESM module). */
const IS_WIN = process.platform === 'win32'

/** Repositories that ARE the DeepSeek Harness itself (never installable). */
const HARNESS_REPOS = ['deepseek-ai/deepseek-harness']

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
const SELF_VERSION = '0.3.1'

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
  return s.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s+/g, '+')
}

/** Reject anything that is not a plain GitHub owner/repo segment. */
function safeSegment(value: string): string {
  const v = String(value || '').trim()
  return /^[\w.-]+$/.test(v) ? v : ''
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

  /** Run one shell command line on the host platform. */
  private async runShell(command: string, cwd?: string): Promise<{ outcome: { exitCode: number }; stdout: string; stderr: string }> {
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
    const handle = this.subprocess.spawn({
      argv,
      cwd: cwd || this.shellCwd(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 8 * 1024 * 1024 }, stderr: { maxBytes: 1024 * 1024 } },
      graceMs: 120000,
    })
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
   * from the environment naturally), then retry through the gh-proxy mirror
   * when the direct attempt fails. The mirror retry rewrites github.com URLs
   * onto gh-proxy.com through per-process GIT_CONFIG_* variables, touching
   * no global git configuration.
   */
  private async pnpmShell(command: string, dir: string): Promise<{ outcome: { exitCode: number }; stdout: string; stderr: string }> {
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
      const mirrorRetry = [
        command + ';',
        'if ($LASTEXITCODE -ne 0) {',
        '  $env:GIT_CONFIG_COUNT=1;',
        "  $env:GIT_CONFIG_KEY_0='url.https://gh-proxy.com/https://github.com/.insteadOf';",
        "  $env:GIT_CONFIG_VALUE_0='https://github.com/';",
        '  ' + command + ';',
        '}',
      ].join(' ')
      return this.runShell(proxySetup + ' ' + mirrorRetry, dir)
    }
    const mirrorRetry = [
      command + ' || {',
      "  export GIT_CONFIG_COUNT=1;",
      "  export GIT_CONFIG_KEY_0='url.https://gh-proxy.com/https://github.com/.insteadOf';",
      "  export GIT_CONFIG_VALUE_0='https://github.com/';",
      '  ' + command + ';',
      '}',
    ].join(' ')
    return this.runShell(mirrorRetry, dir)
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
   * Fetch one URL. Tries curl first, then wget (some Linux distributions
   * ship only wget). On Windows the system proxy is passed explicitly
   * (--proxy); elsewhere both tools honor the inherited environment.
   * Failures carry a diagnostic `error` string.
   */
  private async httpGet(url: string): Promise<{ status: number; body: string; error?: string }> {
    const proxy = await this.loadProxy()
    const proxyArgs = proxy ? ['--proxy', proxy] : []
    // 1) curl (reports the HTTP status via -w even on 404).
    let curl = 'curl'
    try { curl = await this.subprocess.resolveExecutable('curl') } catch { curl = '' }
    if (curl) {
      const handle = this.subprocess.spawn({
        argv: [curl, ...proxyArgs, '-s', '-L', '--max-time', '30', '-w', '\n%{http_code}', '-H', 'User-Agent: zat-dsh-engine/0.2.0', url],
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
    }
    // 2) wget (HTTP status parsed from --server-response stderr).
    let wget = 'wget'
    try { wget = await this.subprocess.resolveExecutable('wget') } catch { wget = '' }
    if (wget) {
      const handle = this.subprocess.spawn({
        argv: [wget, '-q', '-O-', '--server-response', '--timeout=30', '--max-redirect=5', '-U', 'zat-dsh-engine/0.2.0', url],
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
    }
    return { status: 0, body: '', error: 'no curl or wget available on this system' }
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

  private async addSpec(owner: string, repo: string, subdir?: string): Promise<{ ok: boolean; packageName: string | null; message?: string }> {
    const o = safeSegment(owner)
    const repoName = safeSegment(repo)
    const s = subdir === undefined ? undefined : safeSubdir(subdir)
    if (!o || !repoName || s === null) return { ok: false, packageName: null, message: 'invalid repository name or subdirectory' }
    const spec = s ? `github:${o}/${repoName}#path:${s}` : 'github:' + o + '/' + repoName
    const dir = await this.getProfileDir()
    const pnpmResult = await this.pnpmShell('pnpm add ' + spec, dir)
    if (pnpmResult.outcome.exitCode !== 0) {
      const errText = String(pnpmResult.stderr || pnpmResult.stdout || '')
      if (errText.includes('PREPARE_NOT_ALLOWED') || errText.includes('allowBuilds') || errText.includes('build script')) {
        return {
          ok: false,
          packageName: null,
          message: `安装失败:该插件安装时需要运行构建脚本,被 pnpm 安全策略阻止。请手动编辑 ${join(dir, 'pnpm-workspace.yaml')},在 allowBuilds 列表中加入该插件名后重试,或改用官方命令: dsh plugin --profile <你的profile> add ${spec}`,
        }
      }
      return { ok: false, packageName: null, message: errText.slice(0, 2000) || 'pnpm failed' }
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
      return { ok: true, packageName: added }
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
      if (r.status !== 200) return { ok: false, message: `GitHub 请求失败(${r.status})${r.error ? ' — ' + r.error : ''}。直连与镜像均未成功:请确认网络可用;使用 VPN 时请开启系统代理模式,或安装 curl(Windows 自带)。` }
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
          isHarness: isHarness || undefined,
          disabled: rec && !rec.enabled ? true : undefined,
          kind: kind === 'unknown' ? undefined : kind,
          cover: 'https://opengraph.githubassets.com/1/' + fullName,
        } satisfies PluginListItem
      })
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
        notPlugin: notPlugin || undefined,
        isHarness: isHarness || undefined,
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
      return { ok: true, hasUpdate: true, current: SELF_VERSION, latestVersion: remote }
    }
    const spec = 'github:' + owner + '/' + repo
    const dir = await this.getProfileDir()
    const r = await this.pnpmShell('pnpm add ' + spec, dir)
    if (r.outcome.exitCode !== 0) return { ok: false, message: (r.stderr || r.stdout || 'pnpm failed').slice(0, 2000) }
    return { ok: true, message: 'updated to v' + (await this.remoteVersion(owner, repo)) + ' — restart dsh to activate' }
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
              const res = await this.addSpec(o, r, only.dir)
              return res.ok
                ? { ok: true, packageName: res.packageName, message: `已安装 ${only.name || o + '/' + r} — 重启 dsh 生效` }
                : { ok: false, message: res.message }
            }
            return { ok: false, kind: 'multi', packages: sub.packages, message: '这个插件包含多个部分,请选择要安装的:' }
          }
          return { ok: false, message: '这个仓库不是可安装的 dsh 插件:里面没有找到插件声明(dsh.bundle)。它可能是一个技能包、工具库或代码仓库(只是打了 dsh-plugin 标签),无法通过市场一键安装。请到该仓库的 GitHub 页面查看它的使用方式。' }
        }
      }
      const res = await this.addSpec(o, r, s || undefined)
      return res.ok
        ? { ok: true, packageName: res.packageName, message: `installed github:${o}/${r}${s ? `#path:${s}` : ''} — restart dsh to activate` }
        : { ok: false, message: res.message }
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
      const res = await this.addSpec(o, r, s || undefined)
      const version = await this.remoteVersion(o, r, s || undefined)
      return res.ok
        ? { ok: true, version, message: `updated github:${o}/${r}${s ? `#path:${s}` : ''} to v${version || '?'} — restart dsh to activate` }
        : { ok: false, message: res.message }
    } catch (err) {
      return { ok: false, message: String((err as { message?: string })?.message || err) }
    }
  }

  @Remote('uninstall')
  async uninstall(name: string): Promise<JsonObject> {
    try {
      const n = safePackageName(name)
      if (!n) return { ok: false, message: 'invalid package name' }
      const dir = await this.getProfileDir()
      const r = await this.pnpmShell('pnpm remove ' + n, dir)
      if (r.outcome.exitCode !== 0) return { ok: false, message: (r.stderr || r.stdout || 'pnpm failed').slice(0, 2000) }
      const after = await this.readProfile()
      const profile = ((after.dsh as JsonObject | undefined)?.profile || {}) as JsonObject
      const bundles = Array.isArray(profile.bundles) ? (profile.bundles as string[]).filter((b) => b !== n) : []
      if (bundles.length !== ((profile.bundles as string[] | undefined) || []).length) {
        after.dsh = after.dsh || {}
        ;(after.dsh as JsonObject).profile = (after.dsh as JsonObject).profile || {}
        ;((after.dsh as JsonObject).profile as JsonObject).bundles = bundles
        await this.writeProfile(after)
      }
      return { ok: true, message: 'removed ' + n }
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
