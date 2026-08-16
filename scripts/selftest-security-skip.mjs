/**
 * 端到端自测:一键检测不再把市场自己(zat-dsh-engine)打包的快照数据当"可疑网络去向"。
 * 市场自己会被 healthCheck 的安全扫描跳过。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

const libDir = join(realStore, '.zat-secskip')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} })

const tempHome = join(realStore, '.zat-secskip-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })

// 模拟"市场自己已装":把 lib 拷成 zat-dsh-engine 包(含快照数据)。
const selfDir = join(tempProfile, 'node_modules', 'zat-dsh-engine')
mkdirSync(selfDir, { recursive: true })
cpSync(join(repo, 'lib'), join(selfDir, 'lib'), { recursive: true })
writeFileSync(join(selfDir, 'package.json'), JSON.stringify({ name: 'zat-dsh-engine', version: '0.5.0', main: 'lib/index.js', dsh: { bundle: { patch: './cordis.patch.yml' } } }, null, 2))

writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-testdsh',
  private: true,
  dependencies: { 'zat-dsh-engine': '1.0.0' },
  dsh: { profile: { bundles: ['zat-dsh-engine'] } },
}, null, 2))

process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

const fakeSubprocess = {
  resolveExecutable: async () => 'C:\\fake\\tool.cmd',
  spawn: () => ({ done: Promise.resolve({ exitCode: 0 }), collected: { stdout: { readFrom: () => ({ text: '' }) }, stderr: { readFrom: () => ({ text: '' }) } } }),
}
const fakeCtx = {
  get(n) { if (n === 'subprocess') return fakeSubprocess; return undefined },
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

console.log('\n== 一键检测不再扫市场自己 ==')
const hc = await gw.healthCheck()
const issues = (hc.issues || [])
const selfSec = issues.filter((i) => i.title.includes('zat-dsh-engine') && (i.title.includes('可疑') || i.title.includes('外部服务') || i.title.includes('网络去向')))
ok(selfSec.length === 0, `没有市场自己的安全误报(实际 ${selfSec.length} 条)`)
for (const it of selfSec) console.log(`  误报: [${it.level}] ${it.title}`)
console.log('    体检条目(摘要):')
for (const it of issues.slice(0, 15)) console.log(`      [${it.level}] ${it.title}`)

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
process.exitCode = fail ? 1 : 0
