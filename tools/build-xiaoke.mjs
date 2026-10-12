#!/usr/bin/env node
// ============================================================================
// build-xiaoke.mjs —— 由上游源码生成小克（Xiaoke）二创版
// ============================================================================
// 设计目标：**上游文件永远保持原样**，所以 `git merge upstream/main` 不会冲突。
// 本脚本把 upstream 的 lib/index.js 与 assets/whale-widget.js 读进来，应用
// skin/xiaoke-theme.mjs 的「命名空间改名 + 配色映射」，产出：
//
//   lib/xiaoke-index.js    ← 宿主插件（package.json 的 main）
//   lib/xiaoke-widget.js   ← 浏览器端挂件
//
// 这两份产物**提交进仓库**（这样 link: 安装能直接用，且不要求用户跑构建），
// 但永远不要手改 —— 手改会在下次构建时被覆盖。要改就改主题文件。
// 新增功能（动态小克、余额预警换哭脸）不属于换皮，放在 skin/xiaoke-features.mjs，
// 最后一步对产物逐字替换，每条都必须命中预期次数（第 6 步）。
//
// 用法：
//   node tools/build-xiaoke.mjs            # 生成
//   node tools/build-xiaoke.mjs --check    # 只校验产物是最新的（CI / 提交前）
// ============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  RENAMES, HEX_TEXT, HEX_FILL, HEX_FILL_OVERRIDE, RGBA_MAP, EXACT,
  TEXT_PROPS, FILL_PROPS, COLOR_EXEMPT, COLOR_EXEMPT_SCHEMES,
  COPY_REWRITE, COPY_APPEND, LONG_LINE_THRESHOLD, LONG_LINE_SIZE, COPY_FORBIDDEN,
} from '../skin/xiaoke-theme.mjs'
import { HOST_PATCHES, WIDGET_PATCHES } from '../skin/xiaoke-features.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_HOST = path.join(ROOT, 'upstream', 'lib', 'index.js')
const SRC_WIDGET = path.join(ROOT, 'upstream', 'assets', 'whale-widget.js')

const OUT_HOST = path.join(ROOT, 'lib', 'xiaoke-index.js')
const OUT_WIDGET = path.join(ROOT, 'lib', 'xiaoke-widget.js')

// 上游源码的「在哪里」。默认是仓库根的 lib/ 与 assets/（未做目录搬迁时）。
// 这样脚本既能在「上游文件仍原地」的初始状态下跑，也能在把它们挪进
// upstream/ 之后跑（后者更适合长期维护）。
function pickSource(preferred, fallbacks) {
  for (const p of [preferred, ...fallbacks]) {
    if (fs.existsSync(p)) return p
  }
  throw new Error(
    '找不到上游源码：' + [preferred, ...fallbacks].join(' / ') +
    '\n请确认上游文件在位（lib/index.js、assets/whale-widget.js）。')
}

// —— 第 1 步：命名空间改名 ——
// 纯字面量替换。这些标识符在上游里全局唯一，不会与语言关键字或第三方 API 撞名。
function rename(text) {
  let out = text
  for (const [from, to] of RENAMES) {
    if (from === to) continue
    out = out.split(from).join(to)
  }
  return out
}

// —— 第 2 步：配色映射 ——
// 难点：同一个 hex 在上游既可能是正文色也可能是底色（#203170 有 82 处 color:
// 与 13 处 background:），必须按**声明属性**分流；而整族 rgba(32,49,112,α)
// 的透明度阶梯则统一映射。
//
// 做法：逐条 CSS/JS 声明扫描，取出 `属性: 值`，按属性落在 TEXT_PROPS /
// FILL_PROPS 里选表；取不到属性的裸颜色（SVG 呈现属性、JS 表达式）走 EXACT
// 精确表；EXACT 没命中的保留原样并在报告里列出，避免静默漏改。
// 判定「这个 hex 是文字色还是填充色」。
// 上游同一个 hex 会同时出现在两种语义里：CSS 里 #203170 做 color: 82 次、
// 做 background: 13 次；JS 里既做 m.color 又是 m.bg。两者目标色不同
// （正文要暖近黑保证对比度、填充要珊瑚橙保持品牌感），所以必须分流。
function classify(prop) {
  if (!prop) return null
  const p = prop.toLowerCase()
  // 文字/描边语义
  if (p === 'color' || p.endsWith('text-fill-color') || p === 'caret-color') return 'text'
  if (/^(peak|off)color$/.test(p)) return 'text'
  if (p === 'strokestyle') return 'text'
  // 填充语义（底线、底色、边框、阴影、画布填充）
  if (/(bg|background|fill|border|outline|shadow|accent|hex)/.test(p)) return 'fill'
  if (p === 'strokestyle') return 'fill'
  return null
}

function recolor(text, report) {
  const unmapped = new Set()

  // ① 整族 rgba 映射（含透明度变体）。只认 RGBA_MAP 里列出的三元组前缀，
  //    透明度原样保留；**不碰 rgb() 三元组** —— 那是「跑马灯配色方案」里
  //    用户可选的 15 套渐变，属于用户内容而非界面皮肤。
  for (const [from, to] of Object.entries(RGBA_MAP)) {
    const re = new RegExp('(rgba\\()\\s*' + from.replace(/,/g, '\\s*,\\s*') + '\\s*(,)', 'g')
    text = text.replace(re, (m, head, tail) => head + to + tail)
  }

  // ② 精确站点：SVG 呈现属性（fill= / stroke=）与 JS 表达式里的裸颜色。
  //    先跑，避免被后面的通用规则改写掉匹配串。
  for (const [from, to] of EXACT) {
    text = text.split(from).join(to)
  }

  // ③ 通用单 hex 映射：对每个 hex **向前回看最近的 属性/键名** 来定语义。
  //    一套逻辑同时覆盖三种写法：
  //      CSS   `.x{border:1px dashed #203170}`  → border
  //      JSON  `{"color": "#203170"}`           → color
  //      JS    `x.style.color = '#203170'`      → color
  //    回看以 `;`、`{`、`}`、`=` 边界截断，避免误取到上一条语句的属性名。
  const hexRe = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g
  text = text.replace(hexRe, (hex, offset) => {
    const key = hex.toLowerCase()
    const before = text.slice(Math.max(0, offset - 400), offset)
    // 最近的 `标识符:` 或 `标识符=`（允许其后有关键字/单位/引号）
    const ms = [...before.matchAll(/([A-Za-z_$][\w$]*)"?\s*(?::|=)\s*['"`]?[^;{}\n]*?$/g)]
    const prop = ms.length ? ms[ms.length - 1][1] : ''
    const kind = classify(prop)

    if (key === '#fff' || key === '#ffffff') {
      // 白：只有「白底」转米白；按钮上的「白字」必须保留（对比度靠它）
      if (kind === 'text') return hex
      if (kind === 'fill') return '#faf9f5'
      return hex
    }

    const targets = new Set([HEX_TEXT[key], HEX_FILL[key], HEX_FILL_OVERRIDE[key]].filter(Boolean))
    if (kind === null) {
      // 上下文判不出、但两表目标一致 → 可以安全套用；否则报告待人工确认
      if (targets.size === 1) return [...targets][0]
      if (targets.size > 1) unmapped.add(key + ' @?' + (prop || '(none)'))
      return hex
    }
    if (kind === 'text') return HEX_TEXT[key] || (targets.size === 1 ? [...targets][0] : hex)
    return HEX_FILL_OVERRIDE[key] || HEX_FILL[key] || HEX_TEXT[key] || hex
  })

  // ④ 兜底扫描：报告仍未映射的目标色，避免静默漏改
  const leftovers = new Map()
  const allKeys = [...new Set([...Object.keys(HEX_TEXT), ...Object.keys(HEX_FILL)])]
  for (const key of allKeys) {
    if (key === '#fff' || key === '#ffffff') continue
    const re = new RegExp(key + '\\b', 'gi')
    const n = (text.match(re) || []).length
    if (n) leftovers.set(key, n)
  }
  if (leftovers.size) report.leftovers = leftovers

  // ⑤ 冷色残留扫描 —— 补上 ④ 的**结构性盲区**。
  // ④ 只遍历「已经在主题表里的键」，所以从未进过表的颜色永远不会被报告：
  //   v0.4.0 的泡泡框编辑器带进 #3a56a8 / #7d8db8 两条靛蓝，构建**完全静默**，
  //   是我看截图时肉眼发现的。这套皮肤是暖色系，残留的冷色一定是漏改。
  // 判据：蓝通道同时显著高于红与绿（单纯 b>r 会把绿色也误判）。
  // 例外：USER_CONTENT_COLORS 是「跑马灯方案/图表调色板」等**用户可选内容**，
  //   本来就该是原色（例如紫罗兰 #6a6ad0），不参与皮肤换色。
  const cold = new Map()
  for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
    const hex = m[0].toLowerCase()
    if (COLOR_EXEMPT.test(hex)) continue
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    if (b > r + 20 && b > g + 10) cold.set(hex, (cold.get(hex) || 0) + 1)
  }
  if (cold.size) report.coldLeftovers = cold

  // ⑥ 冷色**跑马灯方案**扫描 —— ⑤ 只看 hex，抓不到 `rgb: "indigo"` 这种方案名。
  // 台词/模块可以挂「跑马灯配色方案」，17 套里有几套是冷色（靛蓝/银河紫/深海蓝/极光/薰衣草）。
  // 用户自己选的无所谓；但**默认台词池/默认模块里写死的**冷色方案，在暖色主题上会很突兀
  //   （实测踩过：上游 v0.4.x 给新台词配了 indigo，界面上闪蓝紫）。
  // 只认「被赋值」的用法（`"rgb": "indigo"` / `rgb: 'indigo'`），不认 CSS 方案定义
  // 与方案清单（QC_SCHEMES）—— 那些是用户可选项的定义，必须保留。
  const coldSchemes = new Map()
  for (const name of ['indigo', 'galaxy', 'deepsea', 'aurora', 'lavender', 'mint']) {
    if (COLOR_EXEMPT_SCHEMES.has(name)) continue
    const re = new RegExp('["\']?rgb["\']?\\s*:\\s*["\']' + name + '["\']', 'g')
    const n = (text.match(re) || []).length
    if (n) coldSchemes.set(name, n)
  }
  if (coldSchemes.size) report.coldSchemes = coldSchemes

  if (unmapped.size) report.unmapped = unmapped
  return text
}


// —— 第 3 步：台词替换 ——
// 上游把同一份台词池在源码里放了 4 份副本（1 活跃 + 2 兜底 + 1 死代码）。
// 用全局字面量替换一次性覆盖全部副本，避免「改了不生效」。
// 只替换台词字符串本身（带引号的形式），不会误伤注释里的同名文字以外的代码。
function rewriteCopy(text, report) {
  let out = text
  const missed = []
  for (const [from, to] of Object.entries(COPY_REWRITE)) {
    if (from === to) continue
    const n = out.split(from).length - 1
    if (n === 0) { missed.push(from); continue }
    out = out.split(from).join(to)
  }
  report.copyMissed = missed

  // 长句自动降字号：上游对 25+ 字符的句子手配 size:7。
  // ⚠️ 必须区分两种形态，否则会把 JSON 写坏：
  //    ① JSON（BUBBLE_DEFAULT_ITEMS）：键名带引号 —— 只能用 `, "size": N`
  //    ② JS 对象（兜底函数）：键名裸写 —— 只能用 `, size: N`
  //    而且只在该句后面 120 字符内**还没有 size** 时才补，避免重复插入。
  if (LONG_LINE_THRESHOLD) {
    for (const to of Object.values(COPY_REWRITE)) {
      if (to.length < LONG_LINE_THRESHOLD) continue
      const esc = to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // ① JSON 形态：  "t":  "句子",  后面若没有 "size" 就补
      out = out.replace(
        new RegExp('("t":\\s*)(")' + esc + '\\2(?![\\s\\S]{0,140}?"size")', 'g'),
        (m, head, q) => head + q + to + q + ', "size": ' + LONG_LINE_SIZE)
      // ② JS 对象形态：  t: "句子",  后面若没有 size 就补
      out = out.replace(
        new RegExp('(\\bt:\\s*)(["\'])' + esc + '\\2(?![\\s\\S]{0,140}?\\bsize:)', 'g'),
        (m, head, q) => head + q + to + q + ', size: ' + LONG_LINE_SIZE)
    }
  }
  return out
}

// —— 第 4 步：追加新增台词 ——
// 把 COPY_APPEND 插进活跃台词池（BUBBLE_DEFAULT_ITEMS 里那个 lines 数组）。
// 只插活跃副本：兜底副本保持原样即可，它们是「常量解析失败」时的历史参照。
function appendCopy(text, report) {
  if (!COPY_APPEND.length) return text
  const KEY = '"type":  "random",'
  const idx = text.indexOf(KEY)
  if (idx < 0) { report.appendSkipped = '找不到活跃台词池'; return text }
  // 找该 random 模块里的 "lines": [ ... ]，在数组末尾追加
  const linesKey = text.indexOf('"lines":', idx)
  if (linesKey < 0) { report.appendSkipped = '找不到 lines 数组'; return text }
  const open = text.indexOf('[', linesKey)
  // 括号配对找数组结束
  let depth = 0, end = -1
  for (let k = open; k < text.length; k++) {
    const c = text[k]
    if (c === '[') depth++
    else if (c === ']') { depth--; if (depth === 0) { end = k; break } }
  }
  if (end < 0) { report.appendSkipped = 'lines 数组未闭合'; return text }

  const indent = '                                                                           '
  const items = COPY_APPEND.map(x => {
    // 显式 size 优先（例如诗句单独调小）；否则按长度自动规则
    const sz = x.size != null ? x.size
      : (x.t.length >= LONG_LINE_THRESHOLD ? LONG_LINE_SIZE : null)
    const size = sz != null ? `, "size": ${sz}` : ''
    return `${indent}{ "t": ${JSON.stringify(x.t)}, "w": ${x.w}, "bold": true${size} }`
  }).join(',\n')
  const before = text.slice(0, end).replace(/\s*$/, '')
  const after = text.slice(end)
  report.appended = COPY_APPEND.length
  return before + ',\n' + items + '\n' + indent.slice(0, -8) + after
}

// —— 第 5 步：活跃池断言 ——
// 只报「一条都没找到」是不够的：台词池有 4 份副本，若上游只改了**活跃那份**的措辞，
// 其余副本仍能命中，于是静默漏改 —— 界面上就是「改了不生效」。
// 这里直接解析**产物里的活跃台词池**（BUBBLE_DEFAULT_ITEMS），逐个断言：
//   ① 所有 COPY_REWRITE 的**原句**都不应再出现（出现 = 漏改）
//   ② 所有 COPY_REWRITE 的**新句**中，凡原本来自该池的都应在池内
//   ③ 所有 COPY_APPEND 都应在池内
function assertActivePool(widget, report) {
  const start = widget.indexOf('var BUBBLE_DEFAULT_ITEMS = [')
  if (start < 0) { report.poolError = '产物里找不到 BUBBLE_DEFAULT_ITEMS'; return }
  const end = widget.indexOf('\n];', start)
  if (end < 0) { report.poolError = 'BUBBLE_DEFAULT_ITEMS 数组未闭合'; return }
  let items
  try {
    const raw = widget.slice(start + 'var BUBBLE_DEFAULT_ITEMS = '.length, end + 2).replace(',\n]', ']')
    items = JSON.parse(raw)
  } catch (err) {
    report.poolError = '活跃池 JSON 解析失败（构建把语法写坏了）：' + err.message
    return
  }
  const pool = items[1].options[0].item.modules[0].lines
  const texts = pool.map(x => String(x.t))
  report.poolCount = texts.length

  // ① 原句残留 = 漏改
  const leaked = Object.keys(COPY_REWRITE).filter(src => texts.includes(src))
  // ② 新句缺失。注意：源句与替换句可能是「前缀」关系
  //    （例：源 `上班让我意识到时间是可以被浪费的` 落在池里写作 `...浪费的...`），
  //    所以这里按「池里有任一条包含该新句或其主体」判定，避免误报。
  const missing = Object.values(COPY_REWRITE).filter(dst => {
    const core = dst.replace(/[\.。…！!？?]+$/, '')
    return !texts.some(t => t === dst || t.includes(core))
  })
  // ③ 追加缺失
  const missingAppend = COPY_APPEND.map(x => x.t).filter(t => !texts.includes(t))

  // ④ 特征残留：不依赖具体措辞，能抓住「上游改了字导致替换表失配」的情况
  const residual = []
  for (const t of texts) {
    for (const re of COPY_FORBIDDEN) {
      if (re.test(t)) { residual.push({ t, re: String(re) }); break }
    }
  }
  if (residual.length) report.poolResidual = residual

  if (leaked.length) report.poolLeaked = leaked
  if (missing.length) report.poolMissing = missing
  if (missingAppend.length) report.poolMissingAppend = missingAppend
}

// —— 第 6 步：功能补丁 ——
// skin/xiaoke-features.mjs 里的新增功能，在其余步骤之后对产物逐字替换。
// 和 EXACT 不同：每条都必须命中 count 次（默认 1），否则记为失败、构建退出码非 0，
// 上游改了相关代码时能立刻发现，而不是功能静默失效。
function applyFeatures(text, patches, label, report) {
  let out = text
  for (const patch of patches) {
    const { why, from, to, count = 1 } = patch
    const hits = out.split(from).length - 1
    if (hits !== count) {
      (report.featureErrors ||= []).push(`${label}：「${why}」应命中 ${count} 次，实际 ${hits} 次`)
      continue
    }
    out = out.split(from).join(to)
  }
  report.featuresApplied = (report.featuresApplied || 0) + patches.length
  return out
}

// 读源码时把换行统一成 \n：Windows 上 git（core.autocrlf）检出的是 CRLF，而 EXACT 和功能补丁里
// 跨行的规则都按 \n 写，不统一的话会静默失配（构建照常成功，产物却是上游原样，比如余额变回靛蓝）。
// 产物也就一律是 \n，和在哪个系统上构建无关
function normalizeEol(text) { return text.replace(/\r\n/g, '\n') }

function build() {
  const hostSrc = pickSource(SRC_HOST, [
    path.join(ROOT, 'lib', 'index.js'),
    path.join(ROOT, 'lib', 'upstream-index.js'),
  ])
  const widgetSrc = pickSource(SRC_WIDGET, [
    path.join(ROOT, 'assets', 'whale-widget.js'),
    path.join(ROOT, 'assets', 'upstream-widget.js'),
  ])

  const report = {}
  // 路径一律用正斜杠：Windows 上 path.relative 给的是反斜杠，产物会和 Linux 上构建的不一样
  const banner = (what, from) =>
    '// ⚠️ 本文件由 tools/build-xiaoke.mjs 生成，请勿手改。\n' +
    '// 上游源：' + path.relative(ROOT, from).split(path.sep).join('/') + '\n' +
    '// 要改配色/命名：改 skin/xiaoke-theme.mjs 后重新构建。\n' +
    '// ' + what + '\n'

  const host = banner('宿主侧插件（小克版）', hostSrc) + applyFeatures(
    recolor(rename(normalizeEol(fs.readFileSync(hostSrc, 'utf8'))), report),
    HOST_PATCHES, '宿主', report)
  const widget = applyFeatures(
    appendCopy(
      rewriteCopy(
        recolor(rename(normalizeEol(fs.readFileSync(widgetSrc, 'utf8'))), report),
        report),
      report),
    WIDGET_PATCHES, '挂件', report)

  assertActivePool(widget, report)
  return { host, widget, report, hostSrc, widgetSrc }
}

const check = process.argv.includes('--check')
const { host, widget, report, hostSrc, widgetSrc } = build()

// 幂等性检查：产物必须与上次提交的一致，否则说明改了主题却没重新构建
// 已有的产物也统一换行再比：Windows 上检出成 CRLF 的产物内容没变，不算过期
const same = (p, next) => fs.existsSync(p) && normalizeEol(fs.readFileSync(p, 'utf8')) === next
const stale = []
if (check) {
  if (!same(OUT_HOST, host)) stale.push(path.relative(ROOT, OUT_HOST))
  if (!same(OUT_WIDGET, widget)) stale.push(path.relative(ROOT, OUT_WIDGET))
}
// ⚠️ 注意：--check 也必须走完下面的**台词池校验**再退出。
// 早先的写法在这里直接 process.exit(0/1)，导致 CI 永远看不到台词池断言
// —— 上游改了台词措辞会被静默放过。

if (!check) {
  fs.mkdirSync(path.dirname(OUT_HOST), { recursive: true })
  fs.writeFileSync(OUT_HOST, host)
  fs.writeFileSync(OUT_WIDGET, widget)
  console.log('✓ 已生成')
  console.log('  ' + path.relative(ROOT, hostSrc) + '  → ' + path.relative(ROOT, OUT_HOST))
  console.log('  ' + path.relative(ROOT, widgetSrc) + '  → ' + path.relative(ROOT, OUT_WIDGET))
}

if (report.leftovers) {
  console.log('\n⚠️ 仍有目标色未映射（请检查是否漏了语义分支）：')
  for (const [c, n] of [...report.leftovers].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${c}  ×${n}`)
  }
}
if (report.coldLeftovers) {
  console.log('\n✗ 产物里仍有冷色（这套皮肤是暖色系，冷色一定是漏改）：')
  for (const [c, n] of [...report.coldLeftovers].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${c}  ×${n}`)
  }
  console.log('   要保留就在 skin/xiaoke-theme.mjs 的 COLOR_EXEMPT 里列出（用户可选内容才该保留）。')
}
if (report.coldSchemes) {
  console.log('\n✗ 默认内容里挂着冷色跑马灯方案（暖色主题上会突兀）：')
  for (const [c, n] of [...report.coldSchemes].sort((a, b) => b[1] - a[1])) {
    console.log(`   rgb: "${c}"  ×${n}`)
  }
  console.log('   要么在 skin/xiaoke-theme.mjs 的 EXACT 里换成暖色方案（如 sunset），')
  console.log('   要么确认是既有设计后加进 COLOR_EXEMPT_SCHEMES。')
}
if (report.copyMissed && report.copyMissed.length) {
  console.log('\n⚠️ 以下台词在源码里没找到（上游可能改过措辞，请更新主题表）：')
  for (const m of report.copyMissed) console.log('   ' + JSON.stringify(m))
}
if (report.appended) console.log('\n✓ 已追加快捷台词 ' + report.appended + ' 条')
if (report.poolCount != null) console.log('✓ 活跃台词池共 ' + report.poolCount + ' 条')
if (report.poolError) console.log('\n✗ ' + report.poolError)
if (report.poolLeaked) {
  console.log('\n✗ 活跃池里仍有未替换的原句（上游可能改过措辞，请更新 COPY_REWRITE）：')
  for (const x of report.poolLeaked) console.log('   ' + JSON.stringify(x))
}
if (report.poolMissing) {
  console.log('\n✗ 活跃池里缺少这些新句（替换没落到活跃副本上）：')
  for (const x of report.poolMissing) console.log('   ' + JSON.stringify(x))
}
if (report.poolResidual) {
  console.log('\n✗ 活跃池里仍有上游身份特征（上游可能改过措辞导致替换失配）：')
  for (const r of report.poolResidual) console.log('   ' + r.re + ' 命中 ' + JSON.stringify(r.t))
}
if (report.poolMissingAppend) {
  console.log('\n✗ 活跃池里缺少追加台词：')
  for (const x of report.poolMissingAppend) console.log('   ' + JSON.stringify(x))
}
if (report.featureErrors) {
  console.log('\n✗ 功能补丁没对上（上游可能改了相关代码，请更新 skin/xiaoke-features.mjs）：')
  for (const x of report.featureErrors) console.log('   ' + x)
} else if (report.featuresApplied) {
  console.log('✓ 功能补丁 ' + report.featuresApplied + ' 条全部命中')
}
const hardFail = report.poolError || report.poolLeaked || report.poolMissing || report.poolMissingAppend || report.poolResidual || report.featureErrors
// 冷色残留也算硬失败：这套皮肤是暖色系，漏改的冷色在界面上一眼可见
// （v0.4.0 的 #3a56a8 / #7d8db8 就是这么漏过去的 —— 当时构建完全静默）。
const colorFail = !!report.coldLeftovers || !!report.coldSchemes
const staleFail = stale.length > 0
if (staleFail) {
  console.error('✗ 构建产物不是最新的：\n  ' + stale.join('\n  '))
  console.error('  请运行：node tools/build-xiaoke.mjs')
}
if (hardFail) console.error('\n✗ 台词池 / 功能补丁校验失败（见上）')
if (colorFail) console.error('\n✗ 冷色残留校验失败（见上）')
if (check) {
  if (!hardFail && !colorFail && !staleFail) console.log('\n✓ 构建产物是最新的，台词池与配色校验通过')
  process.exit(hardFail || colorFail || staleFail ? 1 : 0)
}
if (hardFail || colorFail) process.exitCode = 1

if (report.appendSkipped) console.log('\n⚠️ 追加台词跳过：' + report.appendSkipped)
if (report.unmapped) {
  console.log('\n⚠️ 声明属性未在 TEXT/FILL 表里定义目标色：')
  for (const u of report.unmapped) console.log('   ' + u)
}
