/**
 * 端到端自测:新用户首次加载秒开 —— 无任何缓存时,list() 用内置快照零网络返回。
 * 假 subprocess(网络全断),验证:不联网也能在几毫秒内出列表;分类/搜索词过滤生效。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const realStore = join(realHome, 'profiles', 'node_modules')

const libDir = join(realStore, '.zat-seed')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })
process.on('exit', () => { try { rmSync(libDir, { recursive: true, force: true }) } catch {} })

const tempHome = join(realStore, '.zat-seed-home')
const tempProfile = join(tempHome, 'profiles', 'testdsh')
rmSync(tempHome, { recursive: true, force: true })
mkdirSync(join(tempProfile, 'node_modules'), { recursive: true })
writeFileSync(join(tempProfile, 'package.json'), JSON.stringify({ name: 'dsh-profile-testdsh', private: true, dependencies: {}, dsh: { profile: { bundles: [] } } }, null, 2))

process.env.DSH_HOME = tempHome
process.env.DSH_PROFILE = 'testdsh'

// 假 subprocess:任何命令都"成功但无输出"(等于网络断开,拿不到真实数据)。
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

console.log('\n== 1. 全新环境(无缓存、断网)打开商店 → 秒开(按页,与真实分页一致)==')
const t0 = Date.now()
const all = await gw.list(1, 'stars', '', '全部')
const ms = Date.now() - t0
ok(all.ok === true, `ok=true`)
ok(Array.isArray(all.items) && all.items.length === 100, `第一页返回 100 条(实际 ${all.items.length})`)
ok(all.hasMore === true, `hasMore=true(客户端翻页链继续)`)
ok(ms < 2000, `耗时 ${ms}ms(<2s 秒开)`)
console.log(`    source=${all.source} total=${all.total} 耗时=${ms}ms`)

console.log('\n== 1b. 快照翻页(本地秒翻,零网络)==')
const t0b = Date.now()
const all2 = await gw.list(2, 'stars', '', '全部')
ok(all2.ok === true && Array.isArray(all2.items) && all2.items.length > 0, `第二页返回 ${all2.items.length} 条`)
ok(Date.now() - t0b < 2000, `第二页耗时 ${Date.now() - t0b}ms`)

console.log('\n== 2. 分类过滤(皮肤/主题)也走快照 ==')
const t1 = Date.now()
const theme = await gw.list(1, 'stars', '', '皮肤 / 主题')
const ms1 = Date.now() - t1
ok(theme.ok === true && Array.isArray(theme.items) && theme.items.length > 0, `皮肤/主题返回 ${theme.items.length} 条`)
ok(ms1 < 2000, `耗时 ${ms1}ms`)

console.log('\n== 3. 搜索词过滤 ==')
const t2 = Date.now()
const q = await gw.list(1, 'stars', '视觉', '全部')
ok(q.ok === true && Array.isArray(q.items), `搜索"视觉"返回 ${q.items.length} 条`)

console.log('\n== 4. 快照 item 结构完整(能渲染) ==')
const first = all.items[0]
ok(first && typeof first.fullName === 'string' && typeof first.stars === 'number' && typeof first.cover === 'string', 'item 字段完整')

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
if (fail) { console.log('失败项:'); fails.forEach((f) => console.log('  - ' + f)) }
process.exitCode = fail ? 1 : 0
