// ============================================================================
// 小克主题（xiaoke theme）—— 二创的**唯一事实来源**
// ============================================================================
// 上游（MeteorNOX/DeepSeek-Balance-Whale-Widget）没有任何主题抽象层：颜色是
// 硬编码在 assets/whale-widget.js 的 CSS 数组（约 199 个 hex + 510 个 rgba）
// 与若干 JS 默认值里的。
//
// 为了「随时能同步上游」，本项目**不改上游文件**，而是由 tools/build-xiaoke.mjs
// 读取上游源码 → 应用本文件的映射 → 生成 lib/xiaoke-index.js 与
// lib/xiaoke-widget.js。上游文件永远保持原样，所以 git merge upstream/main
// 不会产生任何冲突；重新构建即可把新上游 + 小克主题合到一起。
//
// 想调配色：改下面的 HEX_* / RGBA_MAP，然后 `node tools/build-xiaoke.mjs`。
// ============================================================================

// —— 包 / 路由 / 数据文件命名空间 ——
// 必须与上游完全隔离：上游插件此刻可能正装在同一台机器上，同路由会冲突。
export const NAMESPACE = {
  pkgName: 'dsh-xiaoke-widget',
  bundleId: 'xiaoke-widget',
  routePrefix: '/dsh-xiaoke/',
  hostMain: 'lib/xiaoke-index.js',
  frontendFile: 'lib/xiaoke-widget.js',
}

// —— 标识符改名（按顺序执行，前面的先跑） ——
// 目的：① 路由/数据文件与上游隔离，可并存；② DOM class/全局变量隔离，
// 两只挂件同时挂在同一页面时 CSS 与 JS 互不覆盖。
export const RENAMES = [
  // 路由前缀（先改，避免被后面的通用规则截断）
  ['/dsh-whale/', '/dsh-xiaoke/'],
  // 包名 / bundle id
  ['dsh-whale-widget', 'dsh-xiaoke-widget'],
  ['whale-balance-widget', 'xiaoke-balance-widget'],
  // CSS class 前缀 dshwv- → dshxkv-（含 dshwvToast 这类标识符）
  ['dshwv', 'dshxkv'],
  // 其余 dshw 前缀：全局变量、DOM id、数据文件名 .dshw-*.json、函数名
  ['dshw', 'dshxk'],
  // camelCase 全局
  ['dshWhale', 'dshXiaoke'],
  // 用户数据目录
  ['whale-roles', 'xiaoke-roles'],
  ['whale-audio', 'xiaoke-audio'],
  ['whale-bubble-imgs', 'xiaoke-bubble-imgs'],
  // 角色图：上游两个候选都指向随包的小克图
  ['DSniang1.png', 'xiaoke1.png'],
  ['DSniang02.png', 'xiaoke1.png'],
  // 前端文件名（宿主里的候选路径要跟着改，命中 lib/xiaoke-widget.js）
  ['whale-widget.js', 'xiaoke-widget.js'],
  // 角色显示名（用户可见）
  ['小鲸鱼', '小克'],
  // 兜底：注释/错误串里的裸 whale
  ['Whale', 'Xiaoke'],
  ['whale', 'xiaoke'],
]

// —— 颜色映射 ——
// 上游调色板是 DeepSeek 靛蓝；小克采用 Claude 暖橙（#d97757 珊瑚 / #faf9f5 米白
// / #141413 近黑），与同机已有的 dsh-claude-theme 皮肤对齐，避免与界面其余部分打架。
//
// 分成两张表是必需的：#203170 在上游既当**正文色**（82 处 color:）又当
// **按钮底色**（13 处 background:），两者必须映射到不同的目标色 —— 正文用暖近黑
// 保证对比度，底色用珊瑚橙保持品牌感。所以按下文的「声明属性」来选表。
export const HEX_TEXT = {
  // 正文 / 强调文字：靛蓝 → Claude 暖近黑；珊瑚橙当正文对比度不足（约 3.2:1）
  '#203170': '#2b2925',
  '#9fb0d9': '#a09d96', // 次要文字 / 提示
  '#536ba9': '#8a5a44', // 气泡正文（暖棕，与角色描边同色系）
  '#2f4488': '#c26847', // 链接 / hover 文字（浅一档珊瑚）
  '#9fb0d9': '#a09d96', // 次要文字
  '#e0433f': '#c64545', // 警示红
  '#2fa24c': '#5db872', // 谷价绿
  '#2fa44c': '#5db872',
  '#c0392b': '#c64545', // 删除红
  '#c9392b': '#c64545',
  '#a93226': '#a03a3a',
  '#b33333': '#a03a3a',
  '#8a1f1f': '#8a3a2a', // toast 底（白字，故深色）
  '#2f7a42': '#4a9e63',
}

export const HEX_FILL = {
  // 填充 / 边框 / 底面
  '#203170': '#d97757', // 主色块（按钮底、滑块、描边、指示条）→ 珊瑚橙
  '#dbe4f5': '#f5f0e8', // 泡泡模块默认底色 → Claude 暖沙
  '#f3f5fb': '#f5f0e8',
  '#f2f5fb': '#f5f0e8',
  '#f2f6ff': '#f5f0e8',
  '#eef1f9': '#efe9de',
  '#eef2fb': '#efe9de',
  '#e8ecf7': '#e8e0d2',
  '#f6f8fd': '#faf9f5',
  '#f8fafd': '#faf9f5',
  '#fafbfe': '#faf9f5',
  '#fbfcfe': '#faf9f5',
  '#ffffff': '#faf9f5', // 面板 / 输入框白底 → 米白（注意：color:#fff 的白字不在本表，保留）
  '#fff': '#faf9f5',
  '#fbe7e6': '#f3e0d8', // 峰价底
  '#e4f3e7': '#e6efe4', // 谷价底
  '#e0433f': '#c64545',
  '#2fa24c': '#5db872',
  '#2fa44c': '#5db872',
  '#c0392b': '#c64545',
  '#c9392b': '#c64545',
  '#a93226': '#a03a3a',
  '#8a1f1f': '#8a3a2a',
  '#2f7a42': '#4a9e63',
}

// rgba 整族映射（不分属性：上游这套 rgba 几乎全是同一色的透明度阶梯）。
// 注意不要动 rgb() 三元组 —— 那是「跑马灯配色方案」里用户可选的 15 套渐变，
// 其中「靛蓝夜曲 indigo」本来就该是靛蓝，属于用户内容，不是界面皮肤。
export const RGBA_MAP = {
  '32,49,112': '95,75,60', // 靛蓝透明度阶梯（边框/hover/填充）→ 暖棕
  '255,255,255': '250,249,245', // 白透明度（面板/文字阴影）→ 米白
  '15,23,42': '20,20,19', // 遮罩 → Claude 暖黑
  '201,57,43': '198,69,69', // 删除红
  '224,67,63': '198,69,69', // 警示红
  '47,122,66': '93,184,114', // 谷价绿
  '246,248,253': '250,249,245',
}

// 必须逐字命中的站点：JS 表达式里的裸颜色（没有 CSS 属性可比对）、
// SVG 呈现属性（不是 CSS 属性），以及语义上需要单独定夺的地方。
export const EXACT = [
  // 气泡是内联 SVG：fill / stroke 是**呈现属性**，不走 CSS 属性分支。
  // 描边取自小克线稿的深棕（#482028 一系），比靛蓝更贴角色画风。
  ['fill="#FFFFFF"', 'fill="#faf9f5"'],
  ['stroke="#203170"', 'stroke="#3d2b28"'],

  // 图表调色板首色 = 主色
  ["var USAGE_PALETTE = ['#203170'", "var USAGE_PALETTE = ['#d97757'"],
  // 柱状图 fillStyle 三元表达式
  ["g.fillStyle = k === hoverIdx ? '#e0433f' : (kToday ? '#2fa44c' : '#203170')",
   "g.fillStyle = k === hoverIdx ? '#c64545' : (kToday ? '#5db872' : '#d97757')"],
  // 拖拽落点指示条（box-shadow）
  ["return '0 -3px 0 #203170'", "return '0 -3px 0 #d97757'"],
  ["return '0 3px 0 #203170'", "return '0 3px 0 #d97757'"],
  ["return 'inset 3px 0 0 #203170'", "return 'inset 3px 0 0 #d97757'"],
  ["return 'inset -3px 0 0 #203170'", "return 'inset -3px 0 0 #d97757'"],
  // 取色器默认值：新建文本模块的默认颜色 = 主色
  // 以下都是「默认文字色」语义（取色器默认值 / 新建模块默认色），统一暖近黑。
  // 珊瑚橙留给填充与描边：#d97757 当正文在米白底上只有约 3.2:1，不适合长文本。
  ["var oHex = opts.defaultHex || '#203170'", "var oHex = opts.defaultHex || '#2b2925'"],
  ["if (!m.color) m.color = '#203170'", "if (!m.color) m.color = '#2b2925'"],
  ["m.color || '#203170'", "m.color || '#2b2925'"],
  ["line.color || mod.color || '#203170'", "line.color || mod.color || '#2b2925'"],
  ["if (!line.color) line.color = '#203170'", "if (!line.color) line.color = '#2b2925'"],
  ["inp.value = '#203170'", "inp.value = '#2b2925'"],
  ["inp.style.color = '#203170'", "inp.style.color = '#2b2925'"],
  ["moduleColorEl.value === '#203170'", "moduleColorEl.value === '#2b2925'"],
  ["ctx.strokeStyle = '#203170'", "ctx.strokeStyle = '#d97757'"],
  // 这一处是设置行**文字**色，要暖近黑而不是珊瑚
  ["bubbleTapAdvRow.style.color = '#203170'", "bubbleTapAdvRow.style.color = '#2b2925'"],
  // 上游 IMAGE_CANDIDATES 是 [DSniang1.png, DSniang02.png] 两个候选；
  // 本二创只随包发一张小克图，两条改名后都指向同一文件会变成重复项，
  // 这里直接把整个数组收敛成单候选（保持「第一个可读的胜出」语义不变）。
  [`const IMAGE_CANDIDATES = [
  path.join(PACKAGE_ROOT, 'assets', 'xiaoke1.png'),
  path.join(PACKAGE_ROOT, 'assets', 'xiaoke1.png'),
]`,
   `const IMAGE_CANDIDATES = [
  path.join(PACKAGE_ROOT, 'assets', 'xiaoke1.png'),
]`],
  // 上游注释里写的是 `DSniang1/DSniang02.png`（斜杠分隔，不是文件名），
  // 单靠 RENAMES 只能命中 DSniang02.png 那半边，这里整段修正。
  ['ship DSniang1/xiaoke1.png in assets/', 'ship xiaoke1.png in assets/'],
  // 注释里的旧色值同步更新（否则文档会与主题不符）
  // 注意：EXACT 在 rename() 之后应用，所以这里要写**改名后**的字符串
  ['（浅色卡片上使用既有 .dshxkv-bubsec：自带 #9fb0d9 颜色与上分隔线）',
   '（浅色卡片上使用既有 .dshxkv-bubsec：自带 #a09d96 颜色与上分隔线）'],
]

// 同一 hex 在不同**属性**下需要不同目标色的例外（属性感知映射的补丁层）。
// 例：#2f4488 做链接文字时是浅珊瑚，做按钮 hover 底色时该是深一档珊瑚。
export const HEX_FILL_OVERRIDE = {
  '#2f4488': '#c26847', // 按钮 hover 底
  '#9fb0d9': '#e8e0d2', // 纯色标签底（restag-built）
  '#203170': '#d97757', // 兜底：任何填充语境
}

// JSON 风格键（"color": "#203170"）与 JS 赋值（x.style.color = '#...'）
// 无法被通用 `属性: 值` 正则覆盖，这里按语义直接分流。
export const KEYED_TEXT_PROPS = ['color', 'peakColor', 'offColor', 'textColor', 'fillColor']
export const KEYED_FILL_PROPS = ['bg', 'peakBg', 'offBg', 'background', 'backgroundColor']

// 「恢复默认」的默认泡泡底色
export const MODULE_BG_DEFAULT = '#f5f0e8'

// 判定一个 CSS 声明属性属于「文字色」还是「填充色」。
export const TEXT_PROPS = new Set([
  'color', 'caret-color', '-webkit-text-fill-color', 'text-decoration-color',
])
export const FILL_PROPS = new Set([
  'background', 'background-color', 'background-image', 'fill',
  'border', 'border-color', 'border-top', 'border-bottom', 'border-left', 'border-right',
  'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
  'outline', 'outline-color', 'box-shadow', 'text-shadow', 'accent-color',
])
