/**
 * 端到端自测:构建脚本被 pnpm 拦(PREPARE_NOT_ALLOWED)→ 自动写 allowBuilds + 重试。
 * 场景:
 *  1) 装前检测到 prepare 脚本 → 先自动放行
 *  2) pnpm 仍报构建拦截 → 从报错抠包名 → 写 allowBuilds → 重试成功
 *  3) ensureAllowBuilds 幂等
 */
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

const libDir = join(realStore, '.zat-allowbuilds')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} })

const tempHome = join(realStore, '.zat-allowbuilds-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })

// 已"装好"的 client-only 包(模拟 pnpm 成功后)
const d = join(tempProfile, 'node_modules', 'theme-x')
mkdirSync(d, { recursive: true })
writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'theme-x', version: '1.0.0', dsh: { client: { platform: 'web', inject: [] } } }, null, 2))

writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-testdsh',
  private: true,
  dependencies: { 'theme-x': 'github:owner/theme-x' },
  dsh: { profile: { bundles: [] } },
}, null, 2))
writeFileSync(join(tempProfile, 'cordis.patch.yml'), '[]\n')
writeFileSync(join(tempProfile, 'pnpm-workspace.yaml'), 'packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n')

process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

// 假 pnpm:前 3 次 pnpm add(官方+两个镜像)都报 PREPARE_NOT_ALLOWED,
// 自动写 allowBuilds 后的重试(第 4 次起)才成功。
let pnpmAddCalls = 0
const fakeSubprocess = {
  resolveExecutable: async () => 'C:\\fake\\tool.cmd',
  spawn: () => {
    pnpmAddCalls++
    const fail = pnpmAddCalls <= 3
    return {
      done: Promise.resolve({ exitCode: fail ? 1 : 0 }),
      collected: {
        stdout: { readFrom: () => ({ text: '' }) },
        stderr: { readFrom: () => ({ text: fail ? 'ERR_PNPM_PREPARE_NOT_ALLOWED The prepare script of dependency "theme-x" was not run because it is not allowed to run build scripts.\nIgnored build scripts: theme-x.' : '' }) },
      },
    }
  },
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
const readWs = () => readFileSync(join(tempProfile, 'pnpm-workspace.yaml'), 'utf8')

console.log('\n== 1. PREPARE_NOT_ALLOWED → 自动写 allowBuilds + 重试成功 ==')
const r = await gw.addSpec('owner', 'theme-x', undefined, undefined, { block: [], warn: [], name: 'theme-x', scripts: {} })
ok(r.ok === true, `安装最终成功(实际:${JSON.stringify({ ok: r.ok, packageName: r.packageName })})`)
ok(pnpmAddCalls >= 4, `pnpm 重试过(实际调用 ${pnpmAddCalls} 次)`)
ok(/theme-x/.test(readWs()), 'allowBuilds 里写入了 theme-x')
console.log('    pnpm-workspace.yaml 内容:\n' + readWs().split('\n').map((l) => '      ' + l).join('\n'))

console.log('\n== 2. ensureAllowBuilds 幂等(再写一次不重复)==')
await gw.ensureAllowBuilds('theme-x')
const ws = readWs()
ok((ws.match(/theme-x/g) || []).length === 1, 'theme-x 只出现一次')

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
process.exitCode = fail ? 1 : 0
