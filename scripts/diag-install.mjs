// 单个插件真实 install 诊断:打印任务每一步状态,确认镜像机制走通。
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync } from 'node:fs'
import { spawn as nodeSpawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')
const libDir = join(realStore, '.zat-diag-install')
rmSync(libDir, { recursive: true, force: true }); mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
const tempHome = join(realStore, '.zat-diag-install-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true }); mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })
writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({ name: 'dsh-profile-testdsh', private: true, dependencies: {}, dsh: { profile: { bundles: [] } } }, null, 2))
writeFileSync(join(tempProfile, 'pnpm-workspace.yaml'), 'packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n')
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} ; try { rmSync(tempHome, { recursive: true, force: true }) } catch {} })
process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

async function resolveExecutable(name) { const r = spawnSync('where.exe', [name], { encoding: 'utf8', timeout: 10000, windowsHide: true }); if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0].trim(); throw new Error('nf ' + name) }
function spawn({ argv, cwd, stdio, graceMs }) {
  const cp = nodeSpawn(argv[0], argv.slice(1), { cwd: cwd || 'C:\\', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  const c = { stdout: [], stderr: [] }
  cp.stdout.on('data', (d) => c.stdout.push(d)); cp.stderr.on('data', (d) => c.stderr.push(d))
  const done = new Promise((res) => { const t = setTimeout(() => { try { cp.kill() } catch {} }, graceMs || 300000); cp.on('close', (code) => { clearTimeout(t); res({ exitCode: code === null ? 1 : code }) }); cp.on('error', () => { clearTimeout(t); res({ exitCode: 1 }) }) })
  if (stdio && stdio.stdin && typeof stdio.stdin.data === 'string') cp.stdin.write(stdio.stdin.data)
  cp.stdin.end()
  const text = (a) => Buffer.concat(a).toString('utf8')
  return { done, collected: { stdout: { readFrom: () => ({ text: text(c.stdout) }) }, stderr: { readFrom: () => ({ text: text(c.stderr) }) } } }
}
const fakeCtx = { get(n) { if (n === 'subprocess') return { resolveExecutable, spawn }; return undefined }, reflect: { provide() {} }, effect(cb) { let x = null; try { x = cb() } catch {} ; return () => { if (typeof x === 'function') x() } }, baseUrl: join(realHome, 'profiles', 'web') }
const { ZatMarketGateway } = await import(pathToFileURL(join(libDir, 'lib', 'index.js')).href)
const gw = new ZatMarketGateway(fakeCtx)

const t0 = Date.now()
const ir = await gw.install('WYH66666666', 'DSH-Transparent-UI-Plugin', '')
console.log('install 外层:', JSON.stringify(ir))
if (ir.ok && typeof ir.taskId === 'string') {
  let last = ''
  for (let i = 0; i < 200; i++) {
    const r = await gw.taskStatus(ir.taskId)
    const task = r.value?.task
    const line = `[${((Date.now() - t0) / 1000).toFixed(0)}s] done=${task?.done} step=${task?.step} progress=${task?.progress} msg=${(task?.message || '').slice(0, 50)}`
    if (line !== last) { console.log(line); last = line }
    if (task?.done) {
      console.log('任务最终结果:', JSON.stringify(task.result))
      break
    }
    await new Promise((res) => setTimeout(res, 3000))
  }
}
