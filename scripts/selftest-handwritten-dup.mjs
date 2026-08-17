/**
 * 端到端自测:profile patch 手抄 insert 行 id 与插件自带 patch id 冲突。
 *  场景:AI 装插件时,把插件的 insert 行(如 id: plugin-market)手抄进
 *  profile 的 cordis.patch.yml,而插件自带的 cordis.patch.yml 也声明了同 id
 *  → dsh loader 对同 id insert 两次 → 起不来。
 *  期望:healthCheck 报「cordis.patch.yml 手抄了挂载行 id "plugin-market"」,
 *        repair 一键删掉手抄行,删完不再报。
 * 用临时 home,不碰真实 profile。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

const libDir = join(realStore, '.zat-handdup')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} })

const tempHome = join(realStore, '.zat-handdup-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })

// 一个 bundle 插件,自带 patch 声明 id: plugin-market
function writeBundle(name, patchIds) {
  const d = join(tempProfile, 'node_modules', name)
  mkdirSync(join(d, 'lib'), { recursive: true })
  writeFileSync(join(d, 'package.json'), JSON.stringify({ name, version: '1.0.0', main: 'lib/index.js', dsh: { bundle: { patch: 'cordis.patch.yml' } } }, null, 2))
  writeFileSync(join(d, 'lib', 'index.js'), 'export function apply() {}\n')
  const rows = patchIds.map((id) => `    - id: ${id}\n      name: ${name}`).join('\n')
  writeFileSync(join(d, 'cordis.patch.yml'), `- insert:\n${rows}\n`)
}
writeBundle('zat-dsh-engine', ['plugin-market'])
writeBundle('ocr-provider', ['ocr-provider'])

writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-testdsh',
  private: true,
  dependencies: { 'zat-dsh-engine': '1.0.0', 'ocr-provider': '1.0.0' },
  dsh: { profile: { bundles: ['zat-dsh-engine', 'ocr-provider'] } },
}, null, 2))
// AI 手抄:把两个插件的 insert 行也写进了 profile patch(导致重复 insert)
writeFileSync(join(tempProfile, 'cordis.patch.yml'), '- insert:\n    - id: plugin-market\n      name: zat-dsh-engine\n- insert:\n    - id: ocr-provider\n      name: ocr-provider\n')

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

console.log('\n== 手抄 insert 行 id 冲突检测 ==')
const hc1 = await gw.healthCheck()
const issues1 = (hc1.issues || [])
for (const it of issues1) if (it.level !== 'info') console.log(`      [${it.level}] ${it.title}`)

ok(issues1.some((i) => i.title.includes('手抄了挂载行 id "plugin-market"')), '体检检出 plugin-market 手抄重复')
ok(issues1.some((i) => i.title.includes('手抄了挂载行 id "ocr-provider"')), '体检检出 ocr-provider 手抄重复')

console.log('\n== repair 一键修复手抄重复 ==')
const r = await gw.repair()
console.log('    repair fixed:', r.fixed || [])
ok(Array.isArray(r.fixed) && r.fixed.some((f) => f.includes('手抄重复')), 'repair 报告删除了手抄重复行')

// 修完再查:手抄行应已删除,冲突应消失
const patchAfter = readFileSync(join(tempProfile, 'cordis.patch.yml'), 'utf8')
console.log('    修复后 patch:\n' + patchAfter)
ok(!patchAfter.includes('id: plugin-market') && !patchAfter.includes('id: ocr-provider'), '手抄行已从 cordis.patch.yml 删除')

const hc2 = await gw.healthCheck()
const issues2 = (hc2.issues || [])
ok(!issues2.some((i) => i.title.includes('手抄了挂载行 id')), '修复后手抄冲突消失')

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
process.exitCode = fail ? 1 : 0
