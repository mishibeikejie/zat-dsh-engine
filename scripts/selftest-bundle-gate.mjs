/**
 * 端到端自测:验证"非 bundle 插件(clent-only 主题等)绝不能被塞进 dsh.profile.bundles"。
 * 针对线上事故:Aqua 玻璃拟态主题被 setEnabled/repair 硬塞进 bundles,导致 dsh 启动报
 * "declares no dsh.bundle" 拒绝启动。
 *
 * 用临时 home 模拟 profile,不碰真实 profile。测 6 个场景:
 *  1) setEnabled 启用 client-only 主题 → 拦截,不进 bundles
 *  2) setEnabled 启用 bundle → 成功进 bundles
 *  3) setEnabled 停用 bundle → 成功移除
 *  4) healthCheck 正确区分"已停用(bundle)"与"不会加载(非 bundle)"
 *  5) healthCheck 检出"非 bundle 却在 bundles 里"的崩机状态
 *  6) repair 自动把非 bundle 条目清出 bundles
 */
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync } from 'node:fs'
import { spawn as nodeSpawn, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repo = dirname(dirname(fileURLToPath(import.meta.url)))
// 真实 home:lib/index.js 的 @deepseek-ai/* peer import 要在这里解析。
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

// 把刚 build 的 lib 拷进真实 node_modules 下的临时目录,让 peer import 能解析。
const libDir = join(realStore, '.zat-bundletest')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} })

// 临时 home:gateway 的 profile 操作全部落在这里,绝不碰真实 profile。
const tempHome = join(realStore, '.zat-bundletest-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })

function writePkg(name, pkg) {
  const d = join(tempProfile, 'node_modules', name)
  mkdirSync(d, { recursive: true })
  writeFileSync(join(d, 'package.json'), JSON.stringify(pkg, null, 2))
}
// bundle-a(已启用)、bundle-b(未启用):都声明 dsh.bundle.patch。
writePkg('bundle-a', { name: 'bundle-a', version: '1.0.0', dsh: { bundle: { patch: './cordis.patch.yml' } } })
writeFileSync(join(tempProfile, 'node_modules', 'bundle-a', 'cordis.patch.yml'), 'bundle-a-row: {}\n')
writePkg('bundle-b', { name: 'bundle-b', version: '1.0.0', dsh: { bundle: { patch: './cordis.patch.yml' } } })
writeFileSync(join(tempProfile, 'node_modules', 'bundle-b', 'cordis.patch.yml'), 'bundle-b-row: {}\n')
// theme-a:client-only(像 Aqua 主题,只有 dsh.client)。
writePkg('theme-a', { name: 'theme-a', version: '1.0.0', dsh: { client: { platform: 'web', inject: [] } } })
// lib-a:既无 dsh.bundle 也无 dsh.client(纯库)。
writePkg('lib-a', { name: 'lib-a', version: '1.0.0' })

const writeProfile = (bundles) => writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-testdsh',
  private: true,
  dependencies: { 'bundle-a': '1.0.0', 'bundle-b': '1.0.0', 'theme-a': '1.0.0', 'lib-a': '1.0.0' },
  dsh: { profile: { bundles } },
}, null, 2))
const readBundles = () => JSON.parse(readFileSync(join(tempProfile, 'package.json'), 'utf8')).dsh.profile.bundles

writeProfile(['bundle-a'])

// gateway 用临时 home。
process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

async function resolveExecutable(name) {
  if (name === 'pnpm') return 'C:\\fake\\pnpm.cmd' // 让 pnpmAvailable 直接通过,跳过装 pnpm 分支
  const r = spawnSync('where.exe', [name], { encoding: 'utf8', timeout: 10000, windowsHide: true })
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0].trim()
  throw new Error('not found: ' + name)
}
function spawn({ argv, cwd, stdio, graceMs }) {
  const cp = nodeSpawn(argv[0], argv.slice(1), { cwd: cwd || 'C:\\', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  const chunks = { stdout: [], stderr: [] }
  cp.stdout.on('data', (d) => chunks.stdout.push(d))
  cp.stderr.on('data', (d) => chunks.stderr.push(d))
  const done = new Promise((resolve) => {
    const t = setTimeout(() => { try { cp.kill() } catch {} }, graceMs || 30000)
    cp.on('close', (code) => { clearTimeout(t); resolve({ exitCode: code === null ? 1 : code }) })
    cp.on('error', () => { clearTimeout(t); resolve({ exitCode: 1 }) })
  })
  if (stdio && stdio.stdin && typeof stdio.stdin.data === 'string') cp.stdin.write(stdio.stdin.data)
  cp.stdin.end()
  const text = (a) => Buffer.concat(a).toString('utf8')
  return { done, collected: { stdout: { readFrom: () => ({ text: text(chunks.stdout) }) }, stderr: { readFrom: () => ({ text: text(chunks.stderr) }) } } }
}
const fakeCtx = {
  get(name) { if (name === 'subprocess') return { resolveExecutable, spawn }; return undefined },
  reflect: { provide() {} },
  effect(cb) { let d = null; try { d = cb() } catch {} ; return () => { if (typeof d === 'function') d() } },
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

console.log('\n== 1. setEnabled 启用 client-only 主题 → 走 insert,不进 bundles ==')
let r = await gw.setEnabled('theme-a', true)
ok(r.ok === true && r.enabled === true, `启用成功(实际:${r.message})`)
ok(readBundles().includes('theme-a') === false, 'theme-a 没有进 bundles(走 insert,不崩机)')

console.log('\n== 2. setEnabled 启用 bundle → 成功 ==')
r = await gw.setEnabled('bundle-b', true)
ok(r.ok === true && r.enabled === true, `bundle-b 启用成功(实际:${r.message})`)
ok(readBundles().includes('bundle-b') === true, 'bundle-b 进了 bundles')

console.log('\n== 3. setEnabled 停用 bundle → 成功 ==')
r = await gw.setEnabled('bundle-b', false)
ok(r.ok === true && r.enabled === false, 'bundle-b 停用成功')
ok(readBundles().includes('bundle-b') === false, 'bundle-b 移出 bundles')

console.log('\n== 4. healthCheck 区分"已停用"与"不会加载" ==')
let hc = await gw.healthCheck()
const titles = (hc.issues || []).map((i) => `${i.level}:${i.title}`)
ok(titles.some((t) => t.includes('bundle-b 已停用')), 'bundle-b 报「已停用」(bundle,可修复启用)')
ok(titles.some((t) => t.includes('lib-a 已安装但不会被加载')), 'lib-a 报「已安装但不会被加载」(纯库)')
ok(!titles.some((t) => t.includes('theme-a 已停用') || t.includes('theme-a 已安装但不会被加载')), 'theme-a 已启用(insert),不报停用/不加载')
ok(!titles.some((t) => t.includes('在启用名单里但没有声明 dsh.bundle')), '干净状态下没有「崩机条目」误报')

console.log('\n== 5. 注入崩机状态:theme-a 被塞进 bundles → healthCheck 必须检出 ==')
writeProfile(['bundle-a', 'theme-a'])
hc = await gw.healthCheck()
const err = (hc.issues || []).find((i) => i.title.includes('theme-a 在启用名单里但没有声明 dsh.bundle'))
ok(err && err.level === 'error' && err.fixable === true, '检出「theme-a 在启用名单里但没有声明 dsh.bundle」(error,可修复)')

console.log('\n== 6. repair 自动把非 bundle 条目清出 bundles ==')
const rp = await gw.repair()
ok(rp.ok === true, `repair 正常返回(实际:${rp.message})`)
ok(readBundles().includes('theme-a') === false, 'theme-a 已被移出 bundles')
ok(readBundles().includes('bundle-a') === true, 'bundle-a 保留在 bundles')
ok((rp.fixed || []).some((f) => f.includes('theme-a')), `repair 报告已清理 theme-a(实际 fixed:${(rp.fixed || []).join(' | ')})`)

console.log('\n== 7. 修完后 healthCheck 不再报崩机条目 ==')
hc = await gw.healthCheck()
ok(!(hc.issues || []).some((i) => i.title.includes('在启用名单里但没有声明 dsh.bundle')), '崩机条目已消除')

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
process.exitCode = fail ? 1 : 0
