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
  TEXT_PROPS, FILL_PROPS,
} from '../skin/xiaoke-theme.mjs'

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
  if (unmapped.size) report.unmapped = unmapped
  return text
}

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
  const banner = (what, from) =>
    '// ⚠️ 本文件由 tools/build-xiaoke.mjs 生成，请勿手改。\n' +
    '// 上游源：' + path.relative(ROOT, from) + '\n' +
    '// 要改配色/命名：改 skin/xiaoke-theme.mjs 后重新构建。\n' +
    '// ' + what + '\n'

  const host = banner('宿主侧插件（小克版）', hostSrc) +
    recolor(rename(fs.readFileSync(hostSrc, 'utf8')), report)
  const widget = banner('浏览器端挂件（小克版）', widgetSrc) +
    recolor(rename(fs.readFileSync(widgetSrc, 'utf8')), report)

  return { host, widget, report, hostSrc, widgetSrc }
}

const check = process.argv.includes('--check')
const { host, widget, report, hostSrc, widgetSrc } = build()

// 幂等性检查：产物必须与上次提交的一致，否则说明改了主题却没重新构建
const same = (p, next) => fs.existsSync(p) && fs.readFileSync(p, 'utf8') === next
if (check) {
  const stale = []
  if (!same(OUT_HOST, host)) stale.push(path.relative(ROOT, OUT_HOST))
  if (!same(OUT_WIDGET, widget)) stale.push(path.relative(ROOT, OUT_WIDGET))
  if (stale.length) {
    console.error('✗ 构建产物不是最新的：\n  ' + stale.join('\n  '))
    console.error('  请运行：node tools/build-xiaoke.mjs')
    process.exit(1)
  }
  console.log('✓ 构建产物是最新的')
  process.exit(0)
}

fs.mkdirSync(path.dirname(OUT_HOST), { recursive: true })
fs.writeFileSync(OUT_HOST, host)
fs.writeFileSync(OUT_WIDGET, widget)

console.log('✓ 已生成')
console.log('  ' + path.relative(ROOT, hostSrc) + '  → ' + path.relative(ROOT, OUT_HOST))
console.log('  ' + path.relative(ROOT, widgetSrc) + '  → ' + path.relative(ROOT, OUT_WIDGET))

if (report.leftovers) {
  console.log('\n⚠️ 仍有目标色未映射（请检查是否漏了语义分支）：')
  for (const [c, n] of [...report.leftovers].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${c}  ×${n}`)
  }
}
if (report.unmapped) {
  console.log('\n⚠️ 声明属性未在 TEXT/FILL 表里定义目标色：')
  for (const u of report.unmapped) console.log('   ' + u)
}
