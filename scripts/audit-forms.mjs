/**
 * 全分类安装形态审计:对每个分类抽样仓库,检查各自的安装形态与潜在失败点,
 * 验证市场的一键安装流程能不能全覆盖。只读网络操作,不装任何东西。
 *
 * 对每个仓库检查:
 *  形态: bundle(有 dsh.bundle.patch) / client(只有 dsh.client) / multi(子目录) / skill / 纯库
 *  构建脚本: prepare/preinstall/install/postinstall → 需要 allowBuilds
 *  入口文件: main/exports 指向的文件在仓库里是否存在(缺 = 装了也加载不了)
 *  官方依赖: dependencies 里写了 @deepseek-ai/*(错误写法)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = dirname(dirname(fileURLToPath(import.meta.url)))
const CATS = [
  ['皮肤/主题', 'theme'], ['工具/终端', 'tool'], ['浏览器/自动化', 'browser'],
  ['技能', 'skill'], ['视觉/多媒体', 'vision'], ['网络/MCP', 'network'],
  ['多智能体', 'agent'], ['数据/存储', 'data'], ['硬件/桌面', 'desktop'],
  ['设计/文档', 'design'], ['安全/通知', 'security'], ['全部', ''],
]
const PER_CAT = 18
const CONC = 10

const UA = { 'User-Agent': 'zat-audit/1.0' }

async function tryFetch(url, opts) {
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(12000) })
    return { status: res.status, body: await res.text() }
  } catch { return { status: 0, body: '' } }
}

async function searchRepos(q) {
  const url = q
    ? `https://api.github.com/search/repositories?q=topic:dsh-plugin+${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${PER_CAT}`
    : `https://api.github.com/search/repositories?q=topic:dsh-plugin&sort=stars&order=desc&per_page=${PER_CAT}`
  const r = await tryFetch(url, { headers: UA })
  if (r.status !== 200) return []
  try { return (JSON.parse(r.body).items || []).map((it) => it.full_name) } catch { return [] }
}

const rows = [] // { cat, repo, form, build, entryMissing, officialDep, peerOk }

async function analyze(repo, cat) {
  const [owner, ...rest] = repo.split('/')
  const name = rest.join('/')
  const pkgRes = await tryFetch(`https://raw.githubusercontent.com/${owner}/${name}/HEAD/package.json`, { headers: UA })
  if (pkgRes.status !== 200) {
    rows.push({ cat, repo, form: pkgRes.status === 404 ? '无package.json' : '网络失败', build: false, entryMissing: [], officialDep: [], peerOk: true })
    return
  }
  let meta
  try { meta = JSON.parse(pkgRes.body) } catch {
    rows.push({ cat, repo, form: '坏JSON', build: false, entryMissing: [], officialDep: [], peerOk: true })
    return
  }
  const dsh = meta.dsh || {}
  let form = '纯库'
  if (dsh.bundle && dsh.bundle.patch) form = 'bundle'
  else if (dsh.client) form = 'client-only'
  const scripts = meta.scripts || {}
  const buildKeys = ['prepare', 'preinstall', 'install', 'postinstall'].filter((k) => scripts[k])
  // 入口文件检查(最多2个)
  const entries = []
  if (typeof meta.main === 'string' && meta.main) entries.push(meta.main)
  for (const v of Object.values(meta.exports || {})) {
    const rel = typeof v === 'string' ? v : (v && typeof v === 'object' && typeof v.default === 'string' ? v.default : '')
    if (rel) entries.push(rel)
    if (entries.length >= 2) break
  }
  const entryMissing = []
  for (const rel of [...new Set(entries)].slice(0, 2)) {
    if (!rel || rel.includes('*')) continue
    const h = await tryFetch(`https://raw.githubusercontent.com/${owner}/${name}/HEAD/${rel.replace(/^\.\//, '')}`, { method: 'HEAD', headers: UA })
    if (h.status !== 200 && h.status !== 0) entryMissing.push(rel)
  }
  const officialDep = Object.keys(meta.dependencies || {}).filter((d) => d.startsWith('@deepseek-ai/'))
  rows.push({ cat, repo, form, build: buildKeys, entryMissing, officialDep, peerOk: true })
}

const tasks = []
for (const [cat, q] of CATS) {
  const repos = await searchRepos(q)
  console.log(`${cat}: 搜到 ${repos.length} 个`)
  for (const r of repos) tasks.push({ r, cat })
}
console.log(`共 ${tasks.length} 个仓库待分析,并发 ${CONC}`)

let next = 0
async function worker() {
  while (next < tasks.length) {
    const t = tasks[next++]
    await analyze(t.r, t.cat)
  }
}
const workers = Array.from({ length: CONC }, worker)
await Promise.all(workers)

// 汇总
const byCat = {}
for (const row of rows) {
  byCat[row.cat] = byCat[row.cat] || []
  byCat[row.cat].push(row)
}
console.log('\n===== 各分类形态分布 =====')
for (const [cat, list] of Object.entries(byCat)) {
  const dist = {}
  for (const r of list) dist[r.form] = (dist[r.form] || 0) + 1
  const build = list.filter((r) => r.build.length).length
  const entryMiss = list.filter((r) => r.entryMissing.length).length
  const offDep = list.filter((r) => r.officialDep.length).length
  console.log(`${cat}: ${JSON.stringify(dist)} | 带构建脚本 ${build} | 入口缺失 ${entryMiss} | 官方依赖写错 ${offDep}`)
}

console.log('\n===== 需要 allowBuilds 的仓库(构建脚本)=====')
for (const r of rows.filter((x) => x.build.length)) console.log(`  ${r.cat} ${r.repo} [${r.form}] scripts:${r.build.join(',')}`)

console.log('\n===== 入口文件缺失的仓库(装了也加载不了)=====')
for (const r of rows.filter((x) => x.entryMissing.length)) console.log(`  ${r.cat} ${r.repo} [${r.form}] 缺:${r.entryMissing.join(',')}`)

console.log('\n===== 官方依赖写进 dependencies 的仓库 =====')
for (const r of rows.filter((x) => x.officialDep.length)) console.log(`  ${r.cat} ${r.repo} [${r.form}] deps:${r.officialDep.join(',')}`)

const outPath = join(repo, 'scripts', 'audit-forms.json')
writeFileSync(outPath, JSON.stringify(rows, null, 2))
console.log(`\n明细已存 ${outPath}`)
