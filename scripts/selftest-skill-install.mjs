/**
 * 真实技能(skill)安装验证:真 git clone(镜像优先)+ 真扫描 + 真复制到临时
 * DSH_HOME/skills,再卸载验证清理。不碰用户真实 ~/.dsh。即时输出,不缓冲。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { spawn as nodeSpawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')
const libDir = join(realStore, '.zat-skill')
rmSync(libDir, { recursive: true, force: true }); mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
const tempHome = join(realStore, '.zat-skill-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true }); mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })
writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({ name: 'p', private: true, dependencies: {}, dsh: { profile: { bundles: [] } } }, null, 2))
process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

async function resolveExecutable(name) { const r = spawnSync('where.exe', [name], { encoding: 'utf8', timeout: 10000, windowsHide: true }); if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0].trim(); throw new Error('nf ' + name) }
function spawn({ argv, cwd, stdio, graceMs }) { const cp = nodeSpawn(argv[0], argv.slice(1), { cwd: cwd || 'C:\\', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }); const c = { stdout: [], stderr: [] }; cp.stdout.on('data', d => c.stdout.push(d)); cp.stderr.on('data', d => c.stderr.push(d)); const done = new Promise(res => { const t = setTimeout(() => { try { cp.kill() } catch {} }, graceMs || 300000); cp.on('close', code => { clearTimeout(t); res({ exitCode: code === null ? 1 : code }) }); cp.on('error', () => { clearTimeout(t); res({ exitCode: 1 }) }) }); if (stdio && stdio.stdin && typeof stdio.stdin.data === 'string') cp.stdin.write(stdio.stdin.data); cp.stdin.end(); const txt = a => Buffer.concat(a).toString('utf8'); return { done, collected: { stdout: { readFrom: () => ({ text: txt(c.stdout) }) }, stderr: { readFrom: () => ({ text: txt(c.stderr) }) } } } }
const fakeCtx = { get(n) { if (n === 'subprocess') return { resolveExecutable, spawn }; return undefined }, reflect: { provide() {} }, effect(cb) { let x = null; try { x = cb() } catch {} ; return () => { if (typeof x === 'function') x() } }, baseUrl: join(realHome, 'profiles', 'web') }
const { ZatMarketGateway } = await import(pathToFileURL(join(libDir, 'lib', 'index.js')).href)
const gw = new ZatMarketGateway(fakeCtx)

function log(s) { process.stdout.write(s + '\n') }
let pass = 0, fail = 0
function ok(cond, label) { if (cond) { pass++; log('  ✔ ' + label) } else { fail++; log('  ✘ ' + label) } }

const OWNER = 'Tiger3807861189'
const REPO = 'J-Space-Cognition-Suite-V3.6'

log(`开始真实安装技能 ${OWNER}/${REPO} …`)
const t0 = Date.now()
const ir = await gw.install(OWNER, REPO, '')
log(`install 返回: ${JSON.stringify(ir)} (${(Date.now() - t0) / 1000}s)`)
ok(ir.ok === true && typeof ir.taskId === 'string', 'install 返回 taskId')

let result = null
if (ir.ok && typeof ir.taskId === 'string') {
  for (let i = 0; i < 120; i++) {
    const r = await gw.taskStatus(ir.taskId)
    const task = r.value?.task
    if (i < 3) log(`  [poll ${i}] raw=${JSON.stringify(r)}`)
    if (task && i % 5 === 0) log(`  [${((Date.now() - t0) / 1000).toFixed(0)}s] ${task.step} ${task.progress}% ${(task.message || '').slice(0, 60)}`)
    if (task?.done) {
      result = task.result
      log(`任务完成: ok=${task.ok} result=${JSON.stringify(task.result)}`)
      break
    }
    await new Promise((res) => setTimeout(res, 1500))
  }
}

if (result) {
  ok(result.ok === true, '技能安装任务成功')
  const skillsDir = join(tempHome, 'skills')
  const jspace = join(skillsDir, 'j-space')
  ok(existsSync(jspace), 'j-space 目录已复制进 skills')
  ok(existsSync(join(jspace, 'SKILL.md')), 'j-space/SKILL.md 存在')
  const manifestPath = join(tempHome, 'zat-skill-installs.json')
  ok(existsSync(manifestPath), '技能清单 zat-skill-installs.json 已写')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const key = (OWNER + '/' + REPO).toLowerCase()
  ok(manifest[key] && Array.isArray(manifest[key].dirs) && manifest[key].dirs.includes('j-space'), '清单记录了 j-space 条目')

  // 已装列表应把该技能当已安装
  const il = await gw.installedList()
  const hit = (il.items || []).find((x) => String(x.fullName).toLowerCase() === key)
  ok(Boolean(hit && hit.installed), 'installedList 把技能标记为已安装')

  // 卸载
  log(`卸载 ${OWNER}/${REPO} …`)
  const un = await gw.uninstall(OWNER + '/' + REPO)
  log(`uninstall 返回: ${JSON.stringify(un)}`)
  ok(un.ok === true && !un.taskId, '技能卸载同步返回 ok(不走 pnpm 任务)')
  ok(!existsSync(jspace), '卸载后 j-space 目录已删除')
  const m2 = JSON.parse(readFileSync(manifestPath, 'utf8'))
  ok(!(key in m2), '卸载后清单条目已删除')
} else {
  log('✘ 任务未完成(网络或 git 问题)')
  fail++
}

try { rmSync(tempHome, { recursive: true, force: true }) } catch {}
try { rmSync(libDir, { recursive: true, force: true }) } catch {}
log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
process.exit(fail ? 1 : 0)
