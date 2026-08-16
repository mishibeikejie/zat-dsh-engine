/** 诊断:在(可能超时的)系统代理下,真实网络请求的耗时。只读。 */
import { mkdirSync, rmSync, cpSync } from 'node:fs'
import { spawn as nodeSpawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const store = join(realHome, 'profiles', 'node_modules')
const libDir = join(store, '.zat-diag-net')
rmSync(libDir, { recursive: true, force: true }); mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })

async function resolveExecutable(name) { const r = spawnSync('where.exe', [name], { encoding: 'utf8', timeout: 10000, windowsHide: true }); if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0].trim(); throw new Error('nf ' + name) }
function spawn({ argv, cwd, stdio, graceMs }) { const cp = nodeSpawn(argv[0], argv.slice(1), { cwd: cwd || 'C:\\', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }); const c = { stdout: [], stderr: [] }; cp.stdout.on('data', d => c.stdout.push(d)); cp.stderr.on('data', d => c.stderr.push(d)); const done = new Promise(res => { const t = setTimeout(() => { try { cp.kill() } catch {} }, graceMs || 60000); cp.on('close', code => { clearTimeout(t); res({ exitCode: code === null ? 1 : code }) }); cp.on('error', () => { clearTimeout(t); res({ exitCode: 1 }) }) }); cp.stdin.end(); const txt = a => Buffer.concat(a).toString('utf8'); return { done, collected: { stdout: { readFrom: () => ({ text: txt(c.stdout) }) }, stderr: { readFrom: () => ({ text: txt(c.stderr) }) } } } }
const fakeCtx = { get(n) { if (n === 'subprocess') return { resolveExecutable, spawn }; return undefined }, reflect: { provide() {} }, effect(cb) { let x = null; try { x = cb() } catch {} ; return () => { if (typeof x === 'function') x() } }, baseUrl: join(realHome, 'profiles', 'web') }
const { ZatMarketGateway } = await import(pathToFileURL(join(libDir, 'lib', 'index.js')).href)
const gw = new ZatMarketGateway(fakeCtx)

function log(s) { process.stdout.write(s + '\n') }

// 先看系统代理是什么
const p = spawnSync('powershell.exe', ['-NoProfile', '-Command', "$p=Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -ErrorAction SilentlyContinue; if($p -and $p.ProxyEnable -eq 1){ Write-Output ('proxy=' + $p.ProxyServer) } else { Write-Output 'no proxy' }"], { encoding: 'utf8', timeout: 10000, windowsHide: true })
log('system proxy: ' + (p.stdout || '').trim())

async function timed(label, fn) {
  const t0 = Date.now()
  try {
    const r = await fn()
    log(`${label}: ok=${r && r.ok} (${Date.now() - t0}ms)`)
    return r
  } catch (e) {
    log(`${label}: THREW ${e && e.message} (${Date.now() - t0}ms)`)
  }
}

log('=== 网络请求耗时(超时代理下)==')
await timed('detail(qing9835/dsh-eyes)', () => gw.detail('qing9835', 'dsh-eyes'))
await timed('list 视觉', () => gw.list(1, 'stars', '视觉', '全部'))
await timed('installedList', () => gw.installedList())
log('=== done ===')
try { rmSync(libDir, { recursive: true, force: true }) } catch {}
process.exit(0)
