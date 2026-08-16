/**
 * 生成市场快照 data/market-snapshot.json:topic:dsh-plugin 按星数排序的前 1000 条。
 * 发布前跑一次,随插件打包 —— 新用户第一次打开商店,先用快照秒开,后台再拉真实数据。
 * 短字段名压缩体积:f=fullName n=name o=owner d=description s=stars k=forks l=language
 *                 t=topics u=updatedAt h=htmlUrl p=homepage
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = dirname(dirname(fileURLToPath(import.meta.url)))
const all = []
for (let p = 1; p <= 10; p++) {
  const url = `https://api.github.com/search/repositories?q=topic:dsh-plugin&sort=stars&order=desc&per_page=100&page=${p}`
  let r = null
  for (const u of [url, `https://gh-proxy.com/${url}`, `https://ghfast.top/${url}`]) {
    try {
      r = await fetch(u, { headers: { 'User-Agent': 'zat-snapshot/1.0' }, signal: AbortSignal.timeout(30000) })
      if (r.ok) break
    } catch { r = null }
  }
  if (!r || !r.ok) { console.log(`page ${p} 全渠道失败,停止`); break }
  const j = await r.json()
  for (const it of (j.items || [])) all.push(it)
  console.log(`page ${p}: +${(j.items || []).length}, 累计 ${all.length}`)
  if (all.length >= (j.total_count || 0)) break
  await new Promise((res) => setTimeout(res, 300)) // 限流缓冲
}
const snap = all.map((it) => ({
  f: it.full_name, n: it.name, o: (it.owner || {}).login || '',
  d: it.description || '', s: it.stargazers_count || 0, k: it.forks_count || 0,
  l: it.language || '', t: Array.isArray(it.topics) ? it.topics : [],
  u: it.updated_at || '', h: it.html_url || '', p: it.homepage || '',
}))
const out = join(repo, 'data', 'market-snapshot.json')
writeFileSync(out, JSON.stringify(snap))
console.log(`写入 ${out}: ${snap.length} 条, ${(snap.length ? JSON.stringify(snap).length / 1024 : 0).toFixed(0)} KB`)
