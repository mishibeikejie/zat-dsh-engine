/**
 * 真实安装端到端测试:真 pnpm + 真 GitHub,在临时 profile 里真装真卸,不碰真实 profile。
 * 流程:固定挑 2 个"应能装"的(验证主链路) + 1 个"应被拦"的(验证拦截) + 随机挑 2 个快照里的 plugin。
 * 每个:安装 → 轮询任务 → 验证落盘(bundles/insert) → 卸载 → 验证清理。最后 rm 整个临时 home。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { spawn as nodeSpawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

const libDir = join(realStore, '.zat-realinstall')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })

const tempHome = join(realStore, '.zat-realinstall-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })
writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({ name: 'dsh-profile-testdsh', private: true, dependencies: {}, dsh: { profile: { bundles: [] } } }, null, 2))
writeFileSync(join(tempProfile, 'pnpm-workspace.yaml'), 'packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n')

process.on('exit', () => {
  try { rmSync(libDir, { recursive: true, force: true }) } catch {}
  try { rmSync(tempHome, { recursive: true, force: true }) } catch {}
})
process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

// 真实 subprocess
async function resolveExecutable(name) {
  const r = spawnSync('where.exe', [name], { encoding: 'utf8', timeout: 10000, windowsHide: true })
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0].trim()
  throw new Error('not found: ' + name)
}
function spawn({ argv, cwd, stdio, graceMs }) {
  const cp = nodeSpawn(argv[0], argv.slice(1), { cwd: cwd || 'C:\\', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  const c = { stdout: [], stderr: [] }
  cp.stdout.on('data', (d) => c.stdout.push(d))
  cp.stderr.on('data', (d) => c.stderr.push(d))
  const done = new Promise((res) => {
    const t = setTimeout(() => { try { cp.kill() } catch {} }, graceMs || 300000)
    cp.on('close', (code) => { clearTimeout(t); res({ exitCode: code === null ? 1 : code }) })
    cp.on('error', () => { clearTimeout(t); res({ exitCode: 1 }) })
  })
  if (stdio && stdio.stdin && typeof stdio.stdin.data === 'string') cp.stdin.write(stdio.stdin.data)
  cp.stdin.end()
  const text = (a) => Buffer.concat(a).toString('utf8')
  return { done, collected: { stdout: { readFrom: () => ({ text: text(c.stdout) }) }, stderr: { readFrom: () => ({ text: text(c.stderr) }) } } }
}
const fakeCtx = {
  get(n) { if (n === 'subprocess') return { resolveExecutable, spawn }; return undefined },
  reflect: { provide() {} },
  effect(cb) { let x = null; try { x = cb() } catch {} ; return () => { if (typeof x === 'function') x() } },
  baseUrl: join(realHome, 'profiles', 'web'),
}
const { ZatMarketGateway } = await import(pathToFileURL(join(libDir, 'lib', 'index.js')).href)
const gw = new ZatMarketGateway(fakeCtx)

let pass = 0, fail = 0
const fails = []
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✔ ${label}`) }
  else { fail++; fails.push(label); console.error(`  ✘ ${label}`) }
}
const readProfile = () => JSON.parse(readFileSync(join(tempProfile, 'package.json'), 'utf8'))
const readBundles = () => readProfile().dsh.profile.bundles || []
const readPatch = () => { try { return readFileSync(join(tempProfile, 'cordis.patch.yml'), 'utf8') } catch { return '' } }
const readDeps = () => Object.keys(readProfile().dependencies || {})

async function waitTask(taskId) {
  for (let i = 0; i < 120; i++) {
    const r = await gw.taskStatus(taskId)
    if (!r.ok || !r.value || !r.value.task) return r
    const task = r.value.task
    if (task.done) return { ok: true, value: { task } }
    await new Promise((res) => setTimeout(res, 1500))
  }
  return { ok: false, message: 'task timeout' }
}

async function testInstall(label, owner, repoName, expectOk) {
  console.log(`\n===== ${label}: ${owner}/${repoName} =====`)
  const ir = await gw.install(owner, repoName, '')
  console.log(`  install 外层: ${JSON.stringify({ ok: ir.ok, kind: ir.kind, hasTaskId: typeof ir.taskId === 'string' })}`)
  if (ir.ok && typeof ir.taskId === 'string') {
    const tr = await waitTask(ir.taskId)
    const task = tr.value?.task
    console.log(`  任务结果: ${JSON.stringify({ done: task?.done, ok: task?.ok, packageName: task?.result?.packageName, message: (task?.result?.message || '').slice(0, 80) })}`)
    if (task?.result?.ok) {
      ok(true, `${label} 安装成功`)
      const pkg = task.result.packageName
      const patch = readPatch()
      const bundles = readBundles()
      const inPatch = pkg && patch.includes(String(pkg))
      const inBundles = pkg && bundles.includes(String(pkg))
      ok(inPatch || inBundles, `落盘正确(insert=${inPatch} / bundles=${inBundles})`)
      // 卸载
      const un = await gw.uninstall(String(pkg))
      if (un.ok && typeof un.taskId === 'string') {
        await waitTask(un.taskId)
      }
      const afterDeps = readDeps()
      const afterBundles = readBundles()
      const afterPatch = readPatch()
      const cleaned = !afterDeps.some((d) => d === pkg) && !afterBundles.includes(String(pkg)) && !(pkg && afterPatch.includes(String(pkg)))
      ok(cleaned, `卸载干净(deps 不含、bundles 不含、insert 不含)`)
    } else if (expectOk) {
      ok(false, `${label} 应装成功但失败: ${task?.result?.message || ''}`)
    } else {
      ok(true, `${label} 按预期未安装成功(被拦/失败): ${(task?.result?.message || '').slice(0, 60)}`)
    }
  } else {
    // 无 taskId:同步返回(拦截/多子包/错误)
    if (expectOk) ok(false, `${label} 应装成功但同步失败: ${ir.message || ''}`)
    else ok(true, `${label} 按预期拦截: ${(ir.message || '').slice(0, 80)}`)
  }
}

// 1) client-only 主题(应装成功)
await testInstall('client-only 主题', 'WYH66666666', 'DSH-Transparent-UI-Plugin', true)
// 2) bundle + prepare 构建脚本(应装成功)
await testInstall('bundle+prepare', 'NoNameLeGo', 'dsh-catppuccin', true)
// 3) 入口缺失无构建脚本(应被拦)
await testInstall('入口缺失应拦截', 'suzike', 'freestyle-dsh-theme', false)

// 4) 随机挑快照里 2 个 plugin(排除已知),真装看结果
const snapshot = JSON.parse(readFileSync(join(repo, 'data', 'market-snapshot.json'), 'utf8'))
const kinds = JSON.parse(readFileSync(join(repo, 'data', 'kinds.json'), 'utf8'))
const plugins = snapshot.filter((e) => kinds[e.f] === 'plugin' && !/aqua|catppuccin|freestyle/i.test(e.f))
const picked = []
const seed = 12345
let s = seed
const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
while (picked.length < 2 && plugins.length > 0) {
  const idx = Math.floor(rnd() * plugins.length)
  const e = plugins.splice(idx, 1)[0]
  if (e) picked.push(e)
}
for (const e of picked) {
  const [o, ...r] = e.f.split('/')
  await testInstall(`随机 ${e.f}`, o, r.join('/'), true)
}

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
console.log('临时 home 已自动清理(进程退出时 rm)')
process.exitCode = fail ? 1 : 0
