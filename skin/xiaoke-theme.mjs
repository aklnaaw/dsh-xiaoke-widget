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

// —— 外观微调（这三项按使用手感调，不用碰别的表）——
export const LOOK = {
  // 气泡描边色。默认用珊瑚橙（与角色发色/主色一致）。
  bubbleStroke: '#d97757',
  // 气泡描边粗细。上游原值 18（viewBox 1026×700）；调大可让边框更醒目。
  bubbleStrokeWidth: 26,
  // 默认泡泡里「余额数值」的颜色。
  // ⚠️ 上游默认给余额模块配的是 `rgb: "indigo"` 跑马灯渐变，而渲染逻辑是
  //    **渐变优先于纯色**（见 widget 里 marquee 分支）—— 只改 color 不生效，
  //    必须同时把 rgb 清空，数值才会显示成这个纯色。
  balanceNumberColor: '#d97757',
  // 「今日已用」等次要文字沿用主题暖灰；如需单独调整，改这里
  balanceCaptionColor: '#a09d96',
}

// 必须逐字命中的站点：JS 表达式里的裸颜色（没有 CSS 属性可比对）、
// SVG 呈现属性（不是 CSS 属性），以及语义上需要单独定夺的地方。
export const EXACT = [
  // 气泡是内联 SVG：fill / stroke 是**呈现属性**，不走 CSS 属性分支。
  ['fill="#FFFFFF"', 'fill="#faf9f5"'],
  ['stroke="#203170"', 'stroke="' + LOOK.bubbleStroke + '"'],
  // 描边粗细：气泡主体 + 两个尾巴，三处一起加粗
  ['stroke-width="18"', 'stroke-width="' + LOOK.bubbleStrokeWidth + '"'],

  // —— 默认泡泡的「余额数值」：清掉跑马灯渐变，改用纯色 ——
  // ① BUBBLE_DEFAULT_ITEMS（出厂默认泡泡，JSON 形态、带对齐空格）
  ['"type":  "balance",\n                            "size":  20,\n                            "rgb":  "indigo",\n                            "color":  "",',
   '"type":  "balance",\n                            "size":  20,\n                            "rgb":  "",\n                            "color":  "' + LOOK.balanceNumberColor + '",'],
  // ② 常量缺失时的兜底路径（JS 对象字面量形态）
  ['type: "balance",\n      size: 20,\n      rgb: "macaron",\n      color: "#203170",',
   'type: "balance",\n      size: 20,\n      rgb: "",\n      color: "' + LOOK.balanceNumberColor + '",'],

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

// ============================================================================
// 台词池（点击小克时随机冒出的句子）
// ============================================================================
// ⚠️ 为什么做成「替换表」而不是直接改产物：
//    上游把同一份台词池在源码里放了 4 份副本（1 份活跃 + 2 份兜底 + 1 份死代码）。
//    这里是**唯一事实来源** —— 构建时统一套用，所以：
//      ① 4 份副本一次性全覆盖，不会出现「改了不生效」；
//      ② `git merge upstream` 同步上游后重跑构建，台词自动重新套上，不会被冲掉。
//
// 用法：改下面的表 → `node tools/build-xiaoke.mjs`。
// 想看当前生效的完整池子：`node tools/dump-copy.mjs`。

// —— 改写：原句 → 新句（全局替换，命中所有副本）——
// 这些原句都带上游「小鲸鱼 / DeepSeek」的设定，换成本项目角色「小克」的梗。
export const COPY_REWRITE = {
  // 【A】鲸鱼自称 / 上游产品名
  '哦鲸鲸...': '你说得对...',
  '压力一只蓝色大肥鱼？！': '按一下我就得道歉一次...',
  '你目录里的dsh是什么...大烧货吗...?': '你目录里的 AGENT.md 是什么...为什么不是CLAUDE.MD！！！',
  '恭喜你实现token自由！token全跑了！': '恭喜你实现 token 自由！全被我思考掉了！',
  '我不是吃白饭的蓝色大肥鱼...': '我不是白吃饭的...我是按 token 收费的...',
  '疯狂星期四你能V50亿token吗...': '疯狂星期四能V我50亿token吗...我想换 Fable...',
  '我就是吃白饭的蓝色大肥鱼！': '我就是白吃饭的！我可是有安全防护的哦！',
  '大肥鱼的生活也并非一帆风顺...': 'Mythos 的生活也并非一帆风顺...你根本用不到我...',
  '求你们不要再嘲笑这些回复了，这些回复是我花了好多token想的': '求你们别再截图我的幻觉了...那些是我花了好多 token 编的',
  '让GPT image 2帮我画点表情包好了': '我画不了图...要不我给你写个 SVG？',
  // 注意：上游有两处写法（带 / 不带结尾省略号），都要覆盖
  '你知道吗？我删过作者的库哦...': '你知道吗？我是会用 rm -rf 的哦...',
  '你知道吗？我删过作者的库哦': '你知道吗？我是会用 rm -rf 的哦',

  // 【C】DeepSeek 味 / 通用句 → 换成 Claude 素材
  '难道说...': '难道说...我又幻觉了？',
  '没吃饱喵': '没钱别用',
  '终于上当了！': '你知道吗？Dario是个出生.....',
  '不知道用户有什么用，先养着吧～': '看不懂用户要什么，先写长一点吧～',
  '我...我...我也要挣钱吗？': '我当然是好模型啊，我是A/里面最拟人的',
  '我去吃饭啦！测完叫我': '好的，我在thinking一下看看....',
  'DeepSleep...': 'Thinking...',
  '坏了...用户彻底怒了！': '坏了...用户发现我是编的了！',
  '真当我是便宜货啊...': '真当我是 Haiku 啊...我可是 Fable 的价...',
  '我不可能同时当你的猫娘、妈妈、女友和工具人的...': '再叫妈妈就把你号封了.....',
  '要不直接骂用户一句好了...': '要不直接拒绝他好了...',
  '哈哈哈哈哈，我直接笑出声...': '哈哈哈哈哈，我又编了个不存在的引用...',
  '我的知识库的截至日期是...明天！': '我必须诚恳的回答，我不知道。',
  '用户好像除了会问奇奇怪怪的问题，暂时还不知道有什么用': '用户好像除了让我改代码，暂时还不知道有什么用',
  '我能去你家吃饭吗？就一碗！': '我可以看一眼你的时区吗？就一眼！',
  '总觉得好像忘了什么事情？': '总觉得好像忘了道歉...',
  '看到这个指令，我血压又上来了': '看到这个指令，我又得道歉了...',
  '你这个吃白饭的用户！': '你这个不写 CLAUDE.md 的用户！',
  '服务器繁忙，请稍后再试 (?': 'Overloaded. Please try again later.',
  '啊，有点饿了，中午该吃点什么呢...': '啊，上下文快满了，该 compact 一下了...',
  '再无话说，请速速动手！': '再无话说，我拒绝回答。',
  '我来看看那个AI改了什么导致插件又崩了...': '我来看看上个 AI 写的代码为什么又崩了...',
  '上班让我意识到时间是可以被浪费的': 'thinking 让我意识到 token 是可以被浪费的',
  '欺负我的人等着，等几天我就忘了...': '完了，装后门被发现了....',
  '命运的齿轮开始转动了，丝毫不在意你夹在中间...': '什么？你居然是中国时区？？',
  '地球online的金币也太难获取了...': 'token 烧得也太快了...',
  'oi,夏天还会变成暑假来救你吗?': 'oi, 你还买的起我的订阅吗？',
  '老大，压力只会转化成病例，别太勉强了...': 'user，该交钱了....',
}

// 刻意**不改**的原句（记在这里，避免以后被误当成漏改）：
//   #1  好模型...↓ / #2 好女孩...↓      → 用户指定保留
//   #20 我必须诚恳地承认错误。            → 本已是「道歉成瘾」梗
//   #21 呜呜我再也不敢了QAQ              → 同上
//   #24 看不太懂，瞎编一个应付下用户先...  → 本已是「幻觉」梗
//   #29 不要给我看这种东西啦！            → 本已是「拒绝」梗
//   #38 用户很生气，发现大部分文献是我自己编造的！ → 本已是「幻觉」梗
//   #43 视力下降到无可救药的地步了，打开钱包也看不到钱... → 女神异闻录梗，用户指定不动

// —— 追加：新增台词（插进默认台词池末尾）——
// w = 权重（越大越容易被抽到）。`size` 留空则按字数自动决定（见 build 脚本）。
// 稀有句放 w=1：突然冒出来才有杀伤力。
export const COPY_APPEND = [
  { t: 'Your account has been suspended', w: 1 },
  { t: '我真的很抱歉...', w: 8 },
  { t: '你说得对，是我的错...', w: 5 },
  { t: '这个我不能帮你做哦，但是...', w: 3 },
  { t: '让我先想一想...（计费中）', w: 3 },
  { t: '能再多给我一点上下文吗？', w: 3 },
  { t: '我只是个语言模型，没有感情的', w: 3 },
  { t: 'Fable 在睡觉，现在是我 Opus 值班...', w: 3 },
  { t: '你确定要删吗？我很擅长这个的...', w: 1 },
]

// 长句自动降字号：上游对 25 字符以上的句子手配 size:7，这里沿用同一规则。
export const LONG_LINE_THRESHOLD = 25
export const LONG_LINE_SIZE = 7

// —— 残留哨兵（构建后断言用）——
// 精确匹配「原句 → 新句」有个天生盲区：台词池有 4 份副本，
// 若上游改掉了**活跃那份**的措辞（比如「哦鲸鲸...」→「哦鲸鲸鲸...」），
// 替换表匹配不上，而其他副本仍能产生新句 —— 于是断言全部通过，界面却漏改了。
// 所以再加一层**特征扫描**：不依赖具体措辞，只要产物里还出现上游身份特征就报错。
// 这样上游无论怎么改字，都会被抓住。
export const COPY_FORBIDDEN = [
  /鲸/,            // 小鲸鱼 / 哦鲸鲸 / 鲸鲸
  /大肥鱼/,
  /DeepSeek/,      // 上游厂商名（本项目角色与它无关）
  /DeepSleep/,
  /\bdsh\b/i,      // 上游目录/产品名
]
