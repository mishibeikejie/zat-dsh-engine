/**
 * 自检:删除会话时的"记账清理"(适配 DSH 0.1.7 的工作区注册表)。
 *
 * 背景(0.1.7 实测):
 *  - `forgetSession` 已从注册表移除;
 *  - 新增注册表级置顶集合 `pinnedSessionIds`(在工作区之外);
 *  - 归档集合 `archivedSessionIds` 里的会话不在任何工作区的 `sessionIds` 里,
 *    所以旧的 `detachSession` 循环摘不到它。
 * 结果:删除后归档/置顶记录残留,删过的会话会在某些列表里冒头。
 *
 * 本自测用真网关 + 假 ctx/假注册表跑 `deleteSession`,断言:
 *  ① 会话目录被真删掉;
 *  ② 归档集合与置顶集合被显式摘掉(unarchiveSession / unpinSession 被调用);
 *  ③ 工作区 detach 仍执行(不回归旧行为);
 *  ④ 投影缓存行被删除;
 *  ⑤ 清理干净时不出现"没清干净"提示;旧版 dsh(无 unarchive/unpin)不崩,
 *     且残留时如实提示。
 */
import { mkdirSync, rmSync, cpSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = 'C:/Users/23102/Desktop/设计/zat-dsh-engine'
const realHome = process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || 'C:/Users', '.dsh')
const store = join(realHome, 'profiles', 'node_modules')

const libDir = join(store, '.zat-delbook')
rmSync(libDir, { recursive: true, force: true })
mkdirSync(libDir, { recursive: true })
cpSync(join(repo, 'lib'), join(libDir, 'lib'), { recursive: true })

const tempHome = join(store, '.zat-delbook-home')
rmSync(tempHome, { recursive: true, force: true })
const SID = 'session-delbook-0001'
const WS = 'C:\\Users\\Public\\zat-delbook-ws'
const sessionDir = join(tempHome, 'sessions', '--hash--', SID)
mkdirSync(sessionDir, { recursive: true })
writeFileSync(join(sessionDir, 'session.v3.jsonl.zstd'), 'stub', 'utf8')

// 清理:临时目录与 DSH_HOME 环境
process.on('exit', () => {
  try { rmSync(libDir, { recursive: true, force: true }) } catch { /* best effort */ }
  try { rmSync(tempHome, { recursive: true, force: true }) } catch { /* best effort */ }
})
process.env.DSH_HOME = tempHome

const { ZatMarketGateway } = await import(pathToFileURL(join(libDir, 'lib', 'index.js')).href)

let pass = 0, fail = 0
function ok(cond, label) {
  if (cond) { pass++; process.stdout.write('  ✔ ' + label + '\n') }
  else { fail++; process.stdout.write('  ✘ ' + label + '\n') }
}

const calls = { unarchive: [], unpin: [], detach: [], cacheDelete: [], forget: [] }

function makeRegistry({ with0107 = true, keepResidue = false } = {}) {
  const state = { archived: [SID], pinned: [SID], workspaces: [{ sessionIds: [SID] }] }
  const registry = {
    get archivedSessionIds() { return state.archived },
    get pinnedSessionIds() { return state.pinned },
    list: () => state.workspaces.map((w) => ({
      sessionIds: w.sessionIds,
      detachSession: async (id) => { calls.detach.push(id); w.sessionIds = w.sessionIds.filter((x) => x !== id) },
    })),
  }
  if (with0107) {
    registry.unarchiveSession = async (id) => {
      calls.unarchive.push(id)
      if (!keepResidue) state.archived = state.archived.filter((x) => x !== id)
    }
    registry.unpinSession = async (id) => {
      calls.unpin.push(id)
      if (!keepResidue) state.pinned = state.pinned.filter((x) => x !== id)
    }
  }
  return { registry, state }
}

function makeCtx(registry) {
  return {
    get(name) {
      if (name === 'sessionPersistence') {
        return {
          list: async () => [{ header: { id: SID, cwd: WS, createdAt: 1700000000000, version: 3, isSeeded: false } }],
          locate: () => ({ kind: 'file', path: join(sessionDir, 'session.v3.jsonl.zstd') }),
        }
      }
      if (name === 'workspaceRegistry') return registry
      if (name === 'agents') return { get: () => undefined }
      if (name === 'storageDomain') {
        return { get: () => ({ table: () => ({ delete: async (id) => { calls.cacheDelete.push(id) }, get: async () => undefined }) }) }
      }
      return undefined
    },
    reflect: { provide() { /* noop */ } },
    effect(cb) { let x = null; try { x = cb() } catch { /* noop */ } ; return () => { if (typeof x === 'function') x() } },
    baseUrl: join(realHome, 'profiles', 'web'),
  }
}

// ① 0.1.7 形态:归档 + 置顶 + 工作区三处都有记录 → 应全部清理,且无残留提示
{
  const { registry, state } = makeRegistry({ with0107: true })
  const gw = new ZatMarketGateway(makeCtx(registry))
  const r = await gw.deleteSession(SID)
  ok(r && r.ok === true, 'deleteSession 返回 ok')
  ok(!existsSync(sessionDir), '会话目录已被真删除')
  ok(calls.unarchive.includes(SID), '调用了 unarchiveSession(0.1.7 归档记录)')
  ok(calls.unpin.includes(SID), '调用了 unpinSession(0.1.7 置顶记录)')
  ok(calls.detach.includes(SID), '仍然执行了工作区 detachSession(旧行为不回归)')
  ok(calls.cacheDelete.includes(SID), '投影缓存行被删除')
  ok(state.archived.length === 0 && state.pinned.length === 0, '归档集合与置顶集合都已清空')
  ok(!String(r.message || '').includes('没清干净'), '没有残留时不出现"没清干净"提示')
}

// ② 旧版 dsh:没有 unarchive/unpin,归档残留 → 不崩,且如实提示残留
{
  const { registry } = makeRegistry({ with0107: false })
  const gw = new ZatMarketGateway(makeCtx(registry))
  const r = await gw.deleteSession(SID)
  ok(r && r.ok === true, '旧版 dsh 下 deleteSession 不抛错')
  ok(String(r.message || '').includes('没清干净'), '旧版残留时如实提示(不再谎报清理成功)')
}
process.env.DSH_HOME = tempHome
mkdirSync(sessionDir, { recursive: true })
writeFileSync(join(sessionDir, 'session.v3.jsonl.zstd'), 'stub', 'utf8')

// ③ 新版但 unarchive/unpin 实际没生效(残留) → 提示残留,不谎报
{
  const { registry } = makeRegistry({ with0107: true, keepResidue: true })
  const gw = new ZatMarketGateway(makeCtx(registry))
  const r = await gw.deleteSession(SID)
  ok(r && r.ok === true, '残留场景下 deleteSession 仍返回 ok')
  ok(String(r.message || '').includes('没清干净'), '确实残留时给出提示(回读校验生效)')
}

process.stdout.write(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========\n`)
process.exit(fail === 0 ? 0 : 1)
