/**
 * 端到端自测:addSpec 对三类包的结果分流。
 *  - client-only(只有 dsh.client):自动写 insert → ok=true(装完重启即生效)
 *  - bundle(有 dsh.bundle.patch):进 bundles → ok=true
 *  - 纯库(既无 bundle 也无 client):ok=false + installedAsDisabled=true(仅当依赖保留)
 * 用临时 home + 假 pnpm,不碰真实 profile。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

const libDir = join(realStore, '.zat-installstate')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} })

const tempHome = join(realStore, '.zat-installstate-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })

function writePkg(name, pkg) {
  const d = join(tempProfile, 'node_modules', name)
  mkdirSync(d, { recursive: true })
  writeFileSync(join(d, 'package.json'), JSON.stringify(pkg, null, 2))
}
writePkg('theme-a', { name: 'theme-a', version: '1.0.0', dsh: { client: { platform: 'web', inject: [] } } })
writePkg('bundle-b', { name: 'bundle-b', version: '1.0.0', dsh: { bundle: { patch: './cordis.patch.yml' } } })
writeFileSync(join(tempProfile, 'node_modules', 'bundle-b', 'cordis.patch.yml'), 'bundle-b-row: {}\n')
writePkg('lib-a', { name: 'lib-a', version: '1.0.0' })

writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-testdsh',
  private: true,
  dependencies: {
    'theme-a': 'github:WYH66666666/DSH-Transparent-UI-Plugin',
    'bundle-b': 'github:acme/bundle-repo',
    'lib-a': 'github:acme/plain-lib',
  },
  dsh: { profile: { bundles: [] } },
}, null, 2))
writeFileSync(join(tempProfile, 'cordis.patch.yml'), '[]\n')

process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

const fakeSubprocess = {
  resolveExecutable: async () => 'C:\\fake\\tool.cmd',
  spawn: () => ({
    done: Promise.resolve({ exitCode: 0 }),
    collected: { stdout: { readFrom: () => ({ text: '' }) }, stderr: { readFrom: () => ({ text: '' }) } },
  }),
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

console.log('\n== 1. client-only 主题 → ok=true + 自动写 insert ==')
const theme = await gw.addSpec('WYH66666666', 'DSH-Transparent-UI-Plugin', undefined, undefined, { block: [], warn: [] })
ok(theme.ok === true, `ok=true(实际:${JSON.stringify({ ok: theme.ok, packageName: theme.packageName })})`)
ok(theme.packageName === 'theme-a', `packageName=theme-a(实际:${theme.packageName})`)
ok(/name:\s*theme-a/.test(readFileSync(join(tempProfile, 'cordis.patch.yml'), 'utf8')), 'insert 已写入 cordis.patch.yml')

console.log('\n== 2. bundle 插件 → ok=true + 进 bundles ==')
const bundle = await gw.addSpec('acme', 'bundle-repo', undefined, undefined, { block: [], warn: [] })
ok(bundle.ok === true, 'ok=true')
ok(bundle.packageName === 'bundle-b', `packageName=bundle-b(实际:${bundle.packageName})`)
const bundlesAfter = JSON.parse(readFileSync(join(tempProfile, 'package.json'), 'utf8')).dsh.profile.bundles
ok(bundlesAfter.includes('bundle-b'), 'bundle-b 进了 bundles')

console.log('\n== 3. 纯库(无 dsh)→ ok=false + installedAsDisabled=true ==')
const lib = await gw.addSpec('acme', 'plain-lib', undefined, undefined, { block: [], warn: [] })
ok(lib.ok === false, 'ok=false')
ok(lib.installedAsDisabled === true, `installedAsDisabled=true(实际:${lib.installedAsDisabled})`)
ok(lib.packageName === 'lib-a', `packageName=lib-a(实际:${lib.packageName})`)

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
process.exitCode = fail ? 1 : 0
