/** 诊断:list / installedList / 技能清单 在真实 profile 上的返回。只读,不改任何东西。 */
import { mkdirSync, rmSync, cpSync } from 'node:fs'
import { spawn as nodeSpawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const store = join(realHome, 'profiles', 'node_modules')
const libDir = join(store, '.zat-diag')
rmSync(libDir, { recursive: true, force: true }); mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })

async function resolveExecutable(name) { const r = spawnSync('where.exe', [name], { encoding: 'utf8', timeout: 10000, windowsHide: true }); if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0].trim(); throw new Error('nf ' + name) }
function spawn({ argv, cwd, stdio, graceMs }) { const cp = nodeSpawn(argv[0], argv.slice(1), { cwd: cwd || 'C:\\', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }); const c = { stdout: [], stderr: [] }; cp.stdout.on('data', d => c.stdout.push(d)); cp.stderr.on('data', d => c.stderr.push(d)); const done = new Promise(res => { const t = setTimeout(() => { try { cp.kill() } catch {} }, graceMs || 60000); cp.on('close', code => { clearTimeout(t); res({ exitCode: code === null ? 1 : code }) }); cp.on('error', () => { clearTimeout(t); res({ exitCode: 1 }) }) }); cp.stdin.end(); const txt = a => Buffer.concat(a).toString('utf8'); return { done, collected: { stdout: { readFrom: () => ({ text: txt(c.stdout) }) }, stderr: { readFrom: () => ({ text: txt(c.stderr) }) } } } }
const fakeCtx = { get(n) { if (n === 'subprocess') return { resolveExecutable, spawn }; return undefined }, reflect: { provide() {} }, effect(cb) { let x = null; try { x = cb() } catch {} ; return () => { if (typeof x === 'function') x() } }, baseUrl: join(realHome, 'profiles', 'web') }
const { ZatMarketGateway } = await import(pathToFileURL(join(libDir, 'lib', 'index.js')).href)
const gw = new ZatMarketGateway(fakeCtx)

function log(s) { process.stdout.write(s + '\n') }
async function timed(label, fn) {
  const t0 = Date.now()
  try {
    const r = await fn()
    const items = Array.isArray(r && r.items) ? r.items.length : '?'
    log(`${label}: ok=${r && r.ok} items=${items} (${Date.now() - t0}ms)${r && r.message ? ' msg=' + r.message : ''}`)
    if (r && Array.isArray(r.items) && r.items.length) {
      for (const it of r.items.slice(0, 5)) log(`   - ${it.fullName} kind=${it.kind} installed=${it.installed}`)
    }
    return r
  } catch (e) {
    log(`${label}: THREW ${e && e.message} (${Date.now() - t0}ms)`)
    return null
  }
}

log('=== installedList ===')
await timed('installedList', () => gw.installedList())
log('=== list 全部 stars ===')
await timed('list all', () => gw.list(1, 'stars', '', '全部'))
log('=== list 视觉 stars ===')
await timed('list 视觉', () => gw.list(1, 'stars', '视觉', '全部'))
log('=== done ===')
try { rmSync(libDir, { recursive: true, force: true }) } catch {}
process.exit(0)
