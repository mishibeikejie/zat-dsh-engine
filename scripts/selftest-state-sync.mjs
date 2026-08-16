/** 自检:状态同步(缓存重盖 installed)+ 已安装本地秒出 + 星数。真 profile,只读。 */
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync } from 'node:fs'
import { spawn as nodeSpawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const store = join(realHome, 'profiles', 'node_modules')
const profileDir = join(realHome, 'profiles', 'web')
const cacheFile = join(profileDir, 'plugin-market-list.json')
const libDir = join(store, '.zat-sync')
rmSync(libDir, { recursive: true, force: true }); mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })

async function resolveExecutable(name) { const r = spawnSync('where.exe', [name], { encoding: 'utf8', timeout: 10000, windowsHide: true }); if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0].trim(); throw new Error('nf ' + name) }
function spawn({ argv, cwd, stdio, graceMs }) { const cp = nodeSpawn(argv[0], argv.slice(1), { cwd: cwd || 'C:\\', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }); const c = { stdout: [], stderr: [] }; cp.stdout.on('data', d => c.stdout.push(d)); cp.stderr.on('data', d => c.stderr.push(d)); const done = new Promise(res => { const t = setTimeout(() => { try { cp.kill() } catch {} }, graceMs || 60000); cp.on('close', code => { clearTimeout(t); res({ exitCode: code === null ? 1 : code }) }); cp.on('error', () => { clearTimeout(t); res({ exitCode: 1 }) }) }); cp.stdin.end(); const txt = a => Buffer.concat(a).toString('utf8'); return { done, collected: { stdout: { readFrom: () => ({ text: txt(c.stdout) }) }, stderr: { readFrom: () => ({ text: txt(c.stderr) }) } } } }
const fakeCtx = { get(n) { if (n === 'subprocess') return { resolveExecutable, spawn }; return undefined }, reflect: { provide() {} }, effect(cb) { let x = null; try { x = cb() } catch {} ; return () => { if (typeof x === 'function') x() } }, baseUrl: profileDir }
const { ZatMarketGateway } = await import(pathToFileURL(join(libDir, 'lib', 'index.js')).href)
const gw = new ZatMarketGateway(fakeCtx)

let pass = 0, fail = 0
function ok(cond, label) { if (cond) { pass++; process.stdout.write('  ✔ ' + label + '\n') } else { fail++; process.stdout.write('  ✘ ' + label + '\n') } }

// 1. 已安装列表:本地秒出 + j-space 已安装 + kind=skill + 星数
const t0 = Date.now()
const il = await gw.installedList()
const ms = Date.now() - t0
const jspace = (il.items || []).find((x) => String(x.fullName).toLowerCase() === 'tiger3807861189/j-space-cognition-suite-v3.6')
ok(il.ok === true, `installedList ok (${ms}ms)`)
ok(ms < 200, `installedList 本地秒出 (实际 ${ms}ms)`)
ok(Boolean(jspace), 'installedList 里能看到 J-Space')
ok(jspace && jspace.installed === true, 'J-Space 标记为已安装')
ok(jspace && jspace.kind === 'skill', 'J-Space kind=skill')
ok(jspace && Number(jspace.stars) > 0, `J-Space 星数非 0 (实际 ${jspace && jspace.stars})`)

// 2. 模拟过期缓存:写一份 installed=false 的 j-space 到磁盘缓存,再 list 搜索,应被重盖成 installed=true
const cacheKey = 'list:stars:1:j-space:全部'
const staleItem = {
  fullName: 'Tiger3807861189/J-Space-Cognition-Suite-V3.6', owner: 'Tiger3807861189', name: 'J-Space-Cognition-Suite-V3.6',
  description: 'x', zhIntro: '', needZh: false, stars: 35, forks: 0, language: '', topics: [], updatedAt: '', htmlUrl: '', homepage: '',
  installed: false, installedName: null, isHarness: false, disabled: false, kind: 'skill', cover: '',
}
const staleCache = {}
staleCache[cacheKey] = { at: Date.now(), data: { ok: true, items: [staleItem], total: 1, hasMore: false, page: 1, source: 'cache' } }
writeFileSync(cacheFile, JSON.stringify(staleCache), 'utf8')

const gw2 = new ZatMarketGateway(fakeCtx)
const lr = await gw2.list(1, 'stars', 'j-space', '全部')
const found = (lr.items || []).find((x) => String(x.fullName).toLowerCase() === 'tiger3807861189/j-space-cognition-suite-v3.6')
ok(lr.ok === true, 'list(搜索 j-space) 正常返回')
ok(Boolean(found), '搜索结果里有 J-Space')
ok(found && found.installed === true, '缓存命中后被重盖为 installed=true(修复"装了还显示安装")')

process.stdout.write(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========\n`)
try { rmSync(cacheFile, { force: true }) } catch {}
try { rmSync(libDir, { recursive: true, force: true }) } catch {}
process.exit(fail ? 1 : 0)
