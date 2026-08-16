/**
 * 重扫 kinds.json:把带 dsh.client 的 nonplugin 重新归为 'client'(可安装的主题/UI),
 * 让"可安装"筛选和卡片按钮对 client-only 主题正确。
 * 只重查 nonplugin(plugin/multi/skill 的判定逻辑没变)。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = dirname(dirname(fileURLToPath(import.meta.url)))
const kindsPath = join(repo, 'data', 'kinds.json')
const kinds = JSON.parse(readFileSync(kindsPath, 'utf8'))

const entries = Object.entries(kinds)
const targets = entries.filter(([, v]) => v === 'nonplugin')
console.log(`总 ${entries.length} 条,需复查 nonplugin ${targets.length} 条`)

let changed = 0
let failed = 0
let next = 0
const CONCURRENCY = 10

async function check(owner, repoName) {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repoName}/HEAD/package.json`, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return
    const meta = await res.json().catch(() => null)
    if (meta && meta.dsh && meta.dsh.client && !meta.dsh.bundle) {
      kinds[owner + '/' + repoName] = 'client'
      changed++
    }
  } catch { failed++ }
}

async function worker() {
  while (next < targets.length) {
    const [full] = targets[next++]
    const [owner, ...rest] = full.split('/')
    await check(owner, rest.join('/'))
  }
}

const workers = Array.from({ length: CONCURRENCY }, worker)
await Promise.all(workers)

writeFileSync(kindsPath, JSON.stringify(kinds, null, 2) + '\n')
const dist = {}
for (const v of Object.values(kinds)) dist[v] = (dist[v] || 0) + 1
console.log(`完成:改判 ${changed} 条为 client,失败 ${failed} 条,分布:`, JSON.stringify(dist))
