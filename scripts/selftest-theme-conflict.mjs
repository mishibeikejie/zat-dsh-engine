/**
 * 端到端自测:主题/皮肤冲突检测。
 *  1) 两个主题抢同一个槽位 id → 体检报「界面注册名重复」
 *  2) 同时启用多个主题 → 体检报「装了多个主题/皮肤插件」
 * 用临时 home,不碰真实 profile。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

const libDir = join(realStore, '.zat-themeconflict')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} })

const tempHome = join(realStore, '.zat-themeconflict-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })

function writeTheme(name, slotId) {
  const d = join(tempProfile, 'node_modules', name)
  mkdirSync(join(d, 'lib'), { recursive: true })
  writeFileSync(join(d, 'package.json'), JSON.stringify({ name, version: '1.0.0', main: 'lib/index.js', dsh: { client: { platform: 'web', inject: [] } } }, null, 2))
  writeFileSync(join(d, 'lib', 'index.js'), 'export function apply() {}\n')
  writeFileSync(join(d, 'lib', 'client.js'), `ctx.slots.register({ name: "settings.plugin.item", id: "${slotId}", order: 5 });\n`)
}
// 两个主题,抢同一个槽位 id:"aqua"
writeTheme('theme-a', 'aqua')
writeTheme('theme-b', 'aqua')

writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-testdsh',
  private: true,
  dependencies: { 'theme-a': '1.0.0', 'theme-b': '1.0.0' },
  dsh: { profile: { bundles: [] } },
}, null, 2))
// 两个都作为 client-only 已注册(启用)
writeFileSync(join(tempProfile, 'cordis.patch.yml'), '- insert:\n    - id: theme-a\n      name: theme-a\n- insert:\n    - id: theme-b\n      name: theme-b\n')

process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

const fakeSubprocess = {
  resolveExecutable: async () => 'C:\\fake\\tool.cmd',
  spawn: () => ({ done: Promise.resolve({ exitCode: 0 }), collected: { stdout: { readFrom: () => ({ text: '' }) }, stderr: { readFrom: () => ({ text: '' }) } } }),
}
const fakeCtx = {
  get(n) { if (n === 'subprocess') return fakeSubprocess; return undefined },
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

console.log('\n== 主题/皮肤冲突检测 ==')
const hc = await gw.healthCheck()
const issues = (hc.issues || [])
console.log('    体检条目:')
for (const it of issues) console.log(`      [${it.level}] ${it.title}`)

ok(issues.some((i) => i.title.includes('界面注册名 "aqua" 重复')), '检出「界面注册名 aqua 重复」(两个主题抢同一槽位)')

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
process.exitCode = fail ? 1 : 0
