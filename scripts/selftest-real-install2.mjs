/**
 * 真实安装验证(镜像优先修复后):真 pnpm 真网络,临时 profile 里装 client-only 主题,
 * 验证落盘(insert),再卸载验证清理。process.stdout.write 即时输出,不缓冲。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { spawn as nodeSpawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')
const libDir = join(realStore, '.zat-real2')
rmSync(libDir, { recursive: true, force: true }); mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
const tempHome = join(realStore, '.zat-real2-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true }); mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })
writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({ name: 'p', private: true, dependencies: {}, dsh: { profile: { bundles: [] } } }, null, 2))
writeFileSync(join(tempProfile, 'pnpm-workspace.yaml'), 'packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n')
process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

async function resolveExecutable(name) { const r = spawnSync('where.exe', [name], { encoding: 'utf8', timeout: 10000, windowsHide: true }); if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0].trim(); throw new Error('nf ' + name) }
function spawn({ argv, cwd, stdio, graceMs }) { const cp = nodeSpawn(argv[0], argv.slice(1), { cwd: cwd || 'C:\\', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }); const c = { stdout: [], stderr: [] }; cp.stdout.on('data', d => c.stdout.push(d)); cp.stderr.on('data', d => c.stderr.push(d)); const done = new Promise(res => { const t = setTimeout(() => { try { cp.kill() } catch {} }, graceMs || 300000); cp.on('close', code => { clearTimeout(t); res({ exitCode: code === null ? 1 : code }) }); cp.on('error', () => { clearTimeout(t); res({ exitCode: 1 }) }) }); if (stdio && stdio.stdin && typeof stdio.stdin.data === 'string') cp.stdin.write(stdio.stdin.data); cp.stdin.end(); const txt = a => Buffer.concat(a).toString('utf8'); return { done, collected: { stdout: { readFrom: () => ({ text: txt(c.stdout) }) }, stderr: { readFrom: () => ({ text: txt(c.stderr) }) } } } }
const fakeCtx = { get(n) { if (n === 'subprocess') return { resolveExecutable, spawn }; return undefined }, reflect: { provide() {} }, effect(cb) { let x = null; try { x = cb() } catch {} ; return () => { if (typeof x === 'function') x() } }, baseUrl: join(realHome, 'profiles', 'web') }
const { ZatMarketGateway } = await import(pathToFileURL(join(libDir, 'lib', 'index.js')).href)
const gw = new ZatMarketGateway(fakeCtx)

function log(s) { process.stdout.write(s + '\n') }

log(`开始真实安装 Aqua(client-only)…`)
const t0 = Date.now()
const ir = await gw.install('WYH66666666', 'DSH-Transparent-UI-Plugin', '')
log(`install 返回: ${JSON.stringify(ir)} (${Date.now() - t0}ms)`)

if (ir.ok && typeof ir.taskId === 'string') {
  for (let i = 0; i < 100; i++) {
    const r = await gw.taskStatus(ir.taskId)
    const task = r.value?.task
    if (task && i % 4 === 0) log(`  [${((Date.now() - t0) / 1000).toFixed(0)}s] ${task.step} ${task.progress}% ${(task.message || '').slice(0, 40)}`)
    if (task?.done) {
      log(`任务完成: ok=${task.ok} result=${JSON.stringify(task.result)}`)
      const patch = readFileSync(join(tempProfile, 'cordis.patch.yml'), 'utf8')
      log(`cordis.patch.yml:\n${patch}`)
      const inserted = /insert/.test(patch) && /dsh-client-ui-aqua/.test(patch)
      log(inserted ? '✔ client-only 自动写 insert 成功' : '✘ insert 没写对')
      // 卸载
      const pkg = task.result?.packageName
      if (pkg) {
        log(`卸载 ${pkg} …`)
        const un = await gw.uninstall(String(pkg))
        if (un.ok && typeof un.taskId === 'string') {
          for (let j = 0; j < 60; j++) {
            const ur = await gw.taskStatus(un.taskId)
            if (ur.value?.task?.done) break
            await new Promise((res) => setTimeout(res, 2000))
          }
        }
        const deps = Object.keys(JSON.parse(readFileSync(join(tempProfile, 'package.json'), 'utf8')).dependencies || {})
        const patch2 = readFileSync(join(tempProfile, 'cordis.patch.yml'), 'utf8')
        log(deps.length === 0 && !patch2.includes('dsh-client-ui-aqua') ? '✔ 卸载干净(deps 空、insert 清空)' : `✘ 卸载不干净 deps=${deps.join(',')} patch=${patch2}`)
      }
      break
    }
    await new Promise((res) => setTimeout(res, 2000))
  }
}
try { rmSync(tempHome, { recursive: true, force: true }) } catch {}
try { rmSync(libDir, { recursive: true, force: true }) } catch {}
log('完成,临时目录已清理')
process.exit(0)
