/**
 * 端到端自测:已安装列表检测所有安装途径的插件,包括:
 *  - github 装的(有 owner/repo)
 *  - 纯 npm 装的借官方 scope 的(@deepseek-ai/dsh-client-ui-aqua 这种,之前会被误当官方跳过)
 */
import { mkdirSync, rmSync, cpSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

const libDir = join(realStore, '.zat-installeddetect')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} })

const tempHome = join(realStore, '.zat-installeddetect-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })

function writePkg(name, pkg) {
  const d = join(tempProfile, 'node_modules', name)
  mkdirSync(d, { recursive: true })
  writeFileSync(join(d, 'package.json'), JSON.stringify(pkg, null, 2))
}
// ① github 装的标准插件
writePkg('bundle-a', { name: 'bundle-a', version: '1.0.0', dsh: { bundle: { patch: './cordis.patch.yml' } } })
// ② 纯 npm 装的、借官方 scope 的主题(之前会被误当官方跳过)
writePkg('@deepseek-ai/dsh-client-ui-aqua', { name: '@deepseek-ai/dsh-client-ui-aqua', version: '1.1.1', dsh: { client: { platform: 'web' } } })

writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-testdsh',
  private: true,
  dependencies: {
    'bundle-a': 'github:owner/bundle-a',
    '@deepseek-ai/dsh-client-ui-aqua': '1.1.1', // npm 版本号,无 git 地址
  },
  dsh: { profile: { bundles: ['bundle-a'] } },
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

console.log('\n== 已安装列表检测所有途径 ==')
const r = await gw.installedList()
const items = (r.items || [])
console.log('    检测到:')
for (const it of items) console.log(`      ${it.installedName}  noRepo=${it.noRepo}  enabled=${it.installed}`)
ok(items.some((it) => (it.installedName || '') === 'bundle-a'), 'github 装的 bundle-a 在列')
ok(items.some((it) => (it.installedName || '') === '@deepseek-ai/dsh-client-ui-aqua'), '借 scope 的 npm 主题也在列(不再被误当官方跳过)')
const aqua = items.find((it) => (it.installedName || '') === '@deepseek-ai/dsh-client-ui-aqua')
ok(aqua && aqua.noRepo === true, '借 scope 主题标 noRepo(npm 装,无仓库)')

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
process.exitCode = fail ? 1 : 0
