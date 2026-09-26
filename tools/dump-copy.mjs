#!/usr/bin/env node
// ============================================================================
// dump-copy.mjs —— 导出挂件里全部用户可见文案，并**自动定位真实行号**
// ============================================================================
// 只读脚本：不修改任何文件。
//   node tools/dump-copy.mjs            # 打印到终端
//   node tools/dump-copy.mjs > x.md     # 存成清单
//
// 为什么需要它：同一份台词在源码里有 4 份副本（1 份活跃 + 2 份兜底 + 1 份死代码），
// 手抄行号极易出错，所以行号一律现场计算。
// ============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FE = path.join(ROOT, 'lib', 'xiaoke-widget.js')
const HO = path.join(ROOT, 'lib', 'xiaoke-index.js')
const fe = fs.readFileSync(FE, 'utf8')
const ho = fs.readFileSync(HO, 'utf8')

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length
function findAll(src, needle) {
  const out = []
  let i = 0
  while ((i = src.indexOf(needle, i)) !== -1) { out.push(lineOf(src, i)); i += needle.length }
  return out
}
const at = (src, needle) => { const l = findAll(src, needle); return l.length ? 'L' + l.join(', L') : '—' }

// —— 活跃台词池：BUBBLE_DEFAULT_ITEMS[1].options[0].item.modules[0].lines ——
const start = fe.indexOf('var BUBBLE_DEFAULT_ITEMS = [')
const end = fe.indexOf('\n];', start)
const items = JSON.parse(fe.slice(start + 'var BUBBLE_DEFAULT_ITEMS = '.length, end + 2).replace(',\n]', ']'))
const lines = items[1].options[0].item.modules[0].lines
const poolLine = lineOf(fe, start)

const doc = []
const A = (s = '') => doc.push(s)

A('# 小克挂件 · 台词与文案总清单')
A()
A('> 由 `node tools/dump-copy.mjs` 生成（只读，不改任何文件）。行号现场计算，不会过期。')
A()
A('## ℹ️ 台词由构建期替换表统一管理')
A()
A('台词池在**上游源码**里有 4 份副本（1 活跃 + 2 兜底 + 1 死代码），本项目**不手改任何一份** ——')
A('而是由 `skin/xiaoke-theme.mjs` 的 `COPY_REWRITE` / `COPY_APPEND` 在构建时统一套用，')
A('所以 4 份一次性全覆盖，且 `git merge upstream` 后重跑构建会自动重新套上。')
A()
A('| 副本 | 位置 | 状态 |')
A('|---|---|---|')
A(`| ① \`BUBBLE_DEFAULT_ITEMS\` | \`lib/xiaoke-widget.js\` L${poolLine} | **★活跃**（实际用的） |`)
A(`| ② \`bubbleDefaultRandomLines()\` | L${findAll(fe, 'function bubbleDefaultRandomLines()')[0]} | 兜底 |`)
A(`| ③ \`bubbleDefaultSecondModules()\` | L${findAll(fe, 'function bubbleDefaultSecondModules()')[0]} | 兜底 |`)
A(`| ④ \`bubbleDefaultQueue()\` | L${findAll(fe, 'function bubbleDefaultQueue()')[0]} | 死代码（第 3 行就 return） |`)
A()
A('要改台词：编辑 `skin/xiaoke-theme.mjs` → `node tools/build-xiaoke.mjs`。')
A()
A('---')
A()
A(`## 一、点击台词（随机语句池）—— 共 ${lines.length} 条`)
A()
A('点小克时随机冒出。`权重` 越大越容易抽中；抽中后不会连续重复。')
A()
A('| # | 权重 | 台词 | 样式 |')
A('|---:|---:|---|---|')
lines.forEach((x, n) => {
  const ex = []
  if (x.rgb) ex.push('跑马灯 ' + x.rgb)
  if (x.size) ex.push('字号 ' + x.size)
  if (x.italic) ex.push('斜体')
  A(`| ${n + 1} | ${x.w} | ${String(x.t).replace(/\|/g, '\\|')} | ${ex.join('、') || '—'} |`)
})
A()
A('### 按「鲸鱼」人设写的（换成小克建议一并改）')
A()
A('| # | 台词 | 问题 |')
A('|---:|---|---|')
lines.forEach((x, n) => {
  const t = String(x.t); const why = []
  if (t.includes('鲸')) why.push('鲸鱼自称')
  if (t.includes('大肥鱼')) why.push('大肥鱼自称')
  if (/token/i.test(t)) why.push('token 梗')
  if (/GPT|DeepSeek|\bdsh\b/i.test(t)) why.push('产品名')
  if (t.includes('作者的库')) why.push('上游作者梗')
  if (why.length) A(`| ${n + 1} | ${t.replace(/\|/g, '\\|')} | ${why.join('、')} |`)
})
A()
A('---')
A()
A('## 二、余额预警（余额低于设定值时弹）')
A()
A('| 文字 | 前端 | 宿主 |')
A('|---|---|---|')
for (const t of ['老大~你的DS余额', '已经不足', '啦~', '>> 喂 点 米 <<']) {
  A(`| ${t} | ${at(fe, t)} | ${at(ho, t)} |`)
}
A()
A('⚠️ **前端与宿主两份必须逐字段一致**：宿主 = 新用户默认内容，前端 = 编辑器「恢复默认」的目标。')
A('改一处必须同步另一处，否则「恢复默认」会和实际默认不一致。')
A()
A('## 三、今日预算超支（弹窗）')
A()
A('| 文字 | 前端 | 宿主 |')
A('|---|---|---|')
for (const t of ['老大，今天花销已经超过', '穷光蛋']) {
  A(`| ${t} | ${at(fe, t)} | ${at(ho, t)} |`)
}
A()
A('## 四、每轮对话消耗提示')
A()
A('| 文字 | 前端 | 宿主 |')
A('|---|---|---|')
for (const t of ['上一轮对话消耗', '¥ {cost}']) {
  A(`| ${t} | ${at(fe, t)} | ${at(ho, t)} |`)
}
A()
A('（默认开关关闭；`{cost}` 是本轮金额占位符，别改。）')
A()
A('## 五、怎么改')
A()
A('**别直接改 `lib/xiaoke-widget.js`** —— 生成产物，下次构建会被覆盖。')
A('把要改的行圈出来发我，或直接给新台词，我做成构建期替换（同步上游也不会丢）。')

const out = doc.join('\n')
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(ROOT, 'COPY-INVENTORY.md'), out + '\n')
  console.error('✓ 已写入 COPY-INVENTORY.md')
} else {
  console.log(out)
}
