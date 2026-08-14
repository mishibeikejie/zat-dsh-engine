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
import { join } from 'node:path'
import bundledZh from '../data/zh-intro.json'

/** Host platform facts (this package is a plain Node ESM module). */
const IS_WIN = process.platform === 'win32'

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
    stdio: { stdin: 'ignore'; stdout: { maxBytes: number }; stderr: { maxBytes: number } }
    graceMs: number
  }): SpawnHandle
}

interface FsTarget {
  targetKey: string
  displayPath: string
}

interface FsFace {
  resolve(path: string): Promise<FsTarget>
  readText(target: FsTarget): Promise<string>
  writeText(target: FsTarget, content: string): Promise<unknown>
  listDir(target: FsTarget): Promise<Array<{ name: string }>>
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
const SELF_VERSION = '0.2.0'

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

export class ZatMarketGateway extends TypertRemoteService {
  static inject = ['subprocess', 'fs', 'llm']

  private readonly subprocess: SubprocessFace
  private readonly fs: FsFace
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

  constructor(ctx: Context) {
    super(ctx, 'pluginMarket')
    this.subprocess = this.ctx.get('subprocess') as unknown as SubprocessFace
    this.fs = this.ctx.get('fs') as unknown as FsFace
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

  /** Write a file directly through node:fs (this package is trusted Node code). */
  private async writeFileText(path: string, content: string): Promise<void> {
    writeFileSync(path, content, 'utf8')
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
    for (const n of names) {
      if (n === 'node_modules' || n === 'plugins') continue
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

  private async curlGet(url: string): Promise<{ status: number; body: string }> {
    let curl = 'curl'
    try { curl = await this.subprocess.resolveExecutable('curl') } catch { /* keep fallback */ }
    const handle = this.subprocess.spawn({
      argv: [curl, '-s', '-L', '--max-time', '30', '-w', '\n%{http_code}', '-H', 'User-Agent: zat-dsh-engine/0.1.0', url],
      cwd: this.shellCwd(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 16 * 1024 * 1024 }, stderr: { maxBytes: 1024 * 1024 } },
      graceMs: 60000,
    })
    const outcome = await handle.done
    let stdout = ''
    if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || ''
    if (outcome.exitCode !== 0) return { status: 0, body: '' }
    const lines = String(stdout).trimEnd().split('\n')
    const status = Number(lines.pop())
    return { status, body: lines.join('\n') }
  }

  private async ghGet(url: string): Promise<{ status: number; body: string }> {
    if (!this.directDown) {
      const r = await this.curlGet(url)
      if (r.status === 200) return r
      this.directDown = true
    }
    if (!this.mirrorDown) {
      const mr = await this.curlGet(MIRROR + url)
      if (mr.status === 200) return mr
      this.mirrorDown = true
    }
    const r2 = await this.curlGet(url)
    if (r2.status === 200) { this.directDown = false; return r2 }
    const mr2 = await this.curlGet(MIRROR + url)
    if (mr2.status === 200) { this.mirrorDown = false; return mr2 }
    return { status: 0, body: '' }
  }

  private async readProfile(): Promise<JsonObject> {
    const dir = await this.getProfileDir()
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as JsonObject
  }

  private async writeProfile(obj: JsonObject): Promise<void> {
    const dir = await this.getProfileDir()
    await this.writeFileText(join(dir, 'package.json'), JSON.stringify(obj, null, 2))
  }

  private installedMap(p: JsonObject): Record<string, { name: string; spec: string; owner?: string; repo?: string; subdir?: string }> {
    const map: Record<string, { name: string; spec: string; owner?: string; repo?: string; subdir?: string }> = {}
    const deps = (p.dependencies || {}) as Record<string, string>
    for (const key of Object.keys(deps)) {
      const spec = String(deps[key] || '')
      const rec: { name: string; spec: string; owner?: string; repo?: string; subdir?: string } = { name: key, spec }
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
    const spec = subdir ? `github:${owner}/${repo}#path:${subdir}` : 'github:' + owner + '/' + repo
    const dir = await this.getProfileDir()
    const r = await this.pnpmShell('pnpm add ' + spec, dir)
    if (r.outcome.exitCode !== 0) return { ok: false, packageName: null, message: (r.stderr || r.stdout || 'pnpm failed').slice(0, 2000) }
    const after = await this.readProfile()
    const deps = Object.keys((after.dependencies || {}) as Record<string, string>)
    const bundles = Array.isArray((after.dsh as JsonObject | undefined)?.profile && ((after.dsh as JsonObject).profile as JsonObject).bundles)
      ? [...(((after.dsh as JsonObject).profile as JsonObject).bundles as string[])]
      : []
    let added: string | null = null
    for (const name of deps) {
      if (bundles.includes(name)) continue
      const specVal = String(((after.dependencies || {}) as Record<string, string>)[name] || '')
      if (!specVal.toLowerCase().includes(owner.toLowerCase() + '/' + repo.toLowerCase())) continue
      try {
        const meta = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { dsh?: { bundle?: { patch?: string } } }
        if (meta.dsh?.bundle?.patch) { bundles.push(name); added = name }
      } catch { /* not a bundle */ }
    }
    if (added) {
      after.dsh = after.dsh || {}
      ;(after.dsh as JsonObject).profile = (after.dsh as JsonObject).profile || {}
      ;((after.dsh as JsonObject).profile as JsonObject).bundles = bundles
      await this.writeProfile(after)
    }
    return { ok: true, packageName: added }
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
      if (r.status !== 200) return { ok: false, message: `GitHub API ${r.status} — direct and mirror both failed, please check your network` }
      let json: { items?: unknown[]; total_count?: number } | null = null
      try { json = JSON.parse(r.body) as typeof json } catch { /* fall through */ }
      if (!json || !Array.isArray(json.items)) return { ok: false, message: 'unexpected GitHub response' }
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
          installed: rec ? true : false,
          installedName: rec ? rec.name : null,
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
        map[full] = { local, remote, hasUpdate: !!(local && remote && local !== remote) }
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
      const entries = Object.keys(inst).map((key) => ({ key, name: inst[key]!.name, spec: inst[key]!.spec }))
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
      const o = String(owner || '')
      const r = String(repo || '')
      const rootPkg = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/package.json`)
      const isMonorepo = rootPkg.status !== 200
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
      return { ok: true, readme, summary, image, isMonorepo }
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
      const o = String(owner || '')
      const r = String(repo || '')
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
      const o = String(owner || '')
      const r = String(repo || '')
      const s = String(subdir || '').replace(/^\/+/, '')
      // Monorepo guard: when no subdir was picked and the root declares no
      // package.json, list the bundled sub-plugins for the UI to offer.
      if (!s) {
        const rootPkg = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/package.json`)
        if (rootPkg.status !== 200) {
          const sub = await this.subpackages(o, r)
          if (sub.ok && sub.kind === 'multi' && Array.isArray(sub.packages) && sub.packages.length > 0) {
            return { ok: false, kind: 'multi', packages: sub.packages, message: `${o}/${r} 是多插件仓库,请选择要安装的子插件。` }
          }
          return { ok: false, message: `⚠ ${o}/${r} 是多插件仓库(根目录没有 package.json),且未找到可安装的子插件。请到该仓库的 GitHub 页面查看安装方式。` }
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
      const o = String(owner || '')
      const r = String(repo || '')
      const s = String(subdir || '').replace(/^\/+/, '')
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
      const n = String(name || '')
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
}

export default ZatMarketGateway
