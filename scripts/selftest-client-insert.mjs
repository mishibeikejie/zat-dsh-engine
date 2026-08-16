/**
 * 端到端自测:client-only 主题/皮肤插件自动写 cordis.patch.yml insert 行,
 * 装→重启→生效;卸载/启停同步切换;`!!js` 用户条目 round-trip 不被破坏。
 * 用临时 home + 假 pnpm,不碰真实 profile。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

const libDir = join(realStore, '.zat-clientinsert')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} })

const tempHome = join(realStore, '.zat-clientinsert-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })

function writePkg(name, pkg) {
  const d = join(tempProfile, 'node_modules', name)
  mkdirSync(d, { recursive: true })
  writeFileSync(join(d, 'package.json'), JSON.stringify(pkg, null, 2))
}
// theme-a: client-only(只有 dsh.client)
writePkg('theme-a', { name: 'theme-a', version: '1.0.0', dsh: { client: { platform: 'web', inject: [] } } })
// bundle-b: 有 dsh.bundle.patch
writePkg('bundle-b', { name: 'bundle-b', version: '1.0.0', dsh: { bundle: { patch: './cordis.patch.yml' } } })
writeFileSync(join(tempProfile, 'node_modules', 'bundle-b', 'cordis.patch.yml'), 'bundle-b-row: {}\n')

writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-testdsh',
  private: true,
  dependencies: { 'theme-a': 'github:WYH66666666/DSH-Transparent-UI-Plugin', 'bundle-b': 'github:acme/bundle-repo' },
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
const readPatch = () => readFileSync(join(tempProfile, 'cordis.patch.yml'), 'utf8')

console.log('\n== 1. addSpec 装 client-only 主题 → 自动写 insert + ok=true ==')
const r = await gw.addSpec('WYH66666666', 'DSH-Transparent-UI-Plugin', undefined, undefined, { block: [], warn: [] })
console.log('    result:', JSON.stringify({ ok: r.ok, packageName: r.packageName, installedAsDisabled: r.installedAsDisabled }))
ok(r.ok === true, 'ok=true(自动注册成功)')
ok(r.packageName === 'theme-a', `packageName=theme-a(实际:${r.packageName})`)
const patch1 = readPatch()
ok(/insert/.test(patch1) && /name:\s*theme-a/.test(patch1), `cordis.patch.yml 写入了 insert(name=theme-a)`)
console.log('    cordis.patch.yml 内容:\n' + patch1.split('\n').map((l) => '      ' + l).join('\n'))

console.log('\n== 2. installedMap 把 insert 行算作已启用 ==')
const inst = await gw.installedMap(JSON.parse(readFileSync(join(tempProfile, 'package.json'), 'utf8')))
ok(inst['theme-a'] && inst['theme-a'].enabled === true, 'theme-a enabled=true')
ok(inst['bundle-b'] && inst['bundle-b'].enabled === false, 'bundle-b 仍 disabled(没进 bundles)')

console.log('\n== 3. setEnabled 停用 client-only → 移除 insert ==')
const off = await gw.setEnabled('theme-a', false)
ok(off.ok === true && off.enabled === false, `停用成功(实际:${off.message})`)
ok(!/name:\s*theme-a/.test(readPatch()), 'insert 已移除')

console.log('\n== 4. setEnabled 启用 client-only → 重新写 insert ==')
const on = await gw.setEnabled('theme-a', true)
ok(on.ok === true && on.enabled === true, `启用成功(实际:${on.message})`)
ok(/name:\s*theme-a/.test(readPatch()), 'insert 已重新写入')

console.log('\n== 5. !!js 用户条目 round-trip 不被破坏 ==')
const jsYaml = `- id: some-row\n  config:\n    foo: !!js 'process.env.BAR'\n- insert:\n    - id: keep\n      name: keep-pkg\n`
writeFileSync(join(tempProfile, 'cordis.patch.yml'), jsYaml)
const patches = await gw.readPatches()
ok(Array.isArray(patches) && patches.length === 2, '!!js 文件能正常解析成 2 条')
await gw.writePatches(patches)
const roundtrip = readPatch()
ok(/!!js/.test(roundtrip), '!!js 表达式写回后仍在')
ok(/keep-pkg/.test(roundtrip), '原有 insert 条目写回后仍在')
console.log('    写回内容:\n' + roundtrip.split('\n').map((l) => '      ' + l).join('\n'))

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
process.exitCode = fail ? 1 : 0
