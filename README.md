# 小克桌宠（Xiaoke Widget）

DSH Web 界面右下角的常驻桌宠：**Claude 拟人角色「小克」** + DeepSeek 余额 / 今日已用 / 峰谷定价 / 每轮消耗，
泡泡内容可完全自定义（点击序列、模块化排版、并列加权出泡、随机语句与随机图片）。

二创自 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)（MIT）。
上游是「小鲸鱼 + DeepSeek 靛蓝」，本项目换成 **小克 + Claude 暖橙**，功能一个不少。

![小克](assets/xiaoke1.png)

---

## 一、这个二创改了什么

| 维度 | 上游（小鲸鱼） | 本项目（小克） |
|---|---|---|
| 角色 | `DSniang1.png` 小鲸鱼 | `xiaoke1.png` Claude 拟人（橘发 / 黑橘礼服 / 手持星芒手账本） |
| 主色 | DeepSeek 靛蓝 `#203170` | Claude 珊瑚橙 `#d97757`（与 `dsh-claude-theme` 皮肤同源） |
| 正文色 | 靛蓝 | Claude 暖近黑 `#2b2925` |
| 面板底 | 冷白 `#fff` | 暖米白 `#faf9f5` |
| 次要文字 | `#9fb0d9` | 暖灰 `#a09d96` |
| 气泡描边 | 靛蓝 | 深棕 `#3d2b28`（取角色线稿色，与画风一致） |
| 角色名 | 小鲸鱼 | 小克 |
| 路由 | `/dsh-whale/*` | `/dsh-xiaoke/*`（与上游隔离，可并存） |
| 数据文件 | `~/.dsh/.dshw-*.json` | `~/.dsh/.dshxk-*.json`（各自独立记账） |
| 包名 / bundle | `dsh-whale-widget` | `dsh-xiaoke-widget` |

**没有改的**：记账内核、峰谷定价算法、34 个多厂商模板、凭据安全策略、拖拽吸附、音效引擎、
泡泡系统（模块/随机/加权/拖拽排版）、Codex 统计 —— 全部原样继承。

> ⚠️ 两个插件的**记账账本互相独立**：小克从零开始观察余额，不会继承小鲸鱼已有的消费历史。

---

## 二、怎么改配色（改这里就够了）

本项目**没有任何手改的上游代码**。所有差异都由两个文件描述：

- **`skin/xiaoke-theme.mjs`** —— 唯一事实来源：命名空间改名表 + 配色映射表
- **`tools/build-xiaoke.mjs`** —— 读取上游源码，套用主题，生成产物

```bash
# 改完 skin/xiaoke-theme.mjs 后：
node tools/build-xiaoke.mjs          # 生成 lib/xiaoke-index.js 与 lib/xiaoke-widget.js
node tools/build-xiaoke.mjs --check  # 只校验产物是否最新（提交前跑）
```

配色表分三张，**必须分工**（原因见下）：

| 表 | 管什么 | 例 |
|---|---|---|
| `HEX_TEXT` | 正文 / 链接 / 警示等**文字**色 | `#203170 → #2b2925`（暖近黑） |
| `HEX_FILL` | 按钮底 / 边框 / 面板底等**填充**色 | `#203170 → #d97757`（珊瑚） |
| `RGBA_MAP` | 整族透明度阶梯 | `rgba(32,49,112,α) → rgba(95,75,60,α)` |

> **为什么同一个 `#203170` 要映射成两种颜色？**
> 上游它在 CSS 里做 `color:` 82 次（正文）、做 `background:` 13 次（按钮底）。
> 珊瑚橙 `#d97757` 在米白底上对比度只有约 **3.2:1**，当正文不合格 —— 所以正文走暖近黑，
> 只有填充才用珊瑚。构建脚本会**向前回看声明属性**来自动分流，三种写法都认：
> CSS（`border:#203170`）、JSON（`"color": "#203170"`）、JS（`x.style.color = '#203170'`）。

**不会碰的东西**：`rgb()` 三元组一律不动 —— 那是泡泡「跑马灯配色方案」里用户可选的
15 套渐变（马卡龙 / 酒红 / 靛蓝夜曲…），属于**用户内容**而非界面皮肤。其中「靛蓝夜曲」
本来就该是靛蓝。

---

## 三、怎么同步上游更新

上游在持续发版（0.3.x 修 bug 很勤）。本项目按「**上游原样 + 生成式皮肤**」组织，
所以同步就是一次普通的 merge：

```bash
cd dsh-xiaoke-widget
git fetch upstream
git merge upstream/main          # ← 不会冲突：上游文件从没被改过
node tools/build-xiaoke.mjs      # 重新套主题
git add -A && git commit -m "同步上游 + 重新构建"
```

**为什么不会冲突**：上游的两个源文件（`lib/index.js`、`assets/whale-widget.js`）被原封不动
放在 `upstream/` 下，本仓库**没有任何一处修改它们**；小克版是生成出来的。改上游文件的
只有 `git merge` 本身，因此永远是快进或干净三方合并。

> 已实测：造一个改了两份上游文件的「未来提交」→ merge 无冲突 → `--check` 报产物过期 →
> 重新构建后新上游代码正确进入产物。

---

## 四、安装

```bash
# 1) 装（本机 link 方式，改代码立即生效）
dsh plugin --profile web add link:/home/aklnaaw/项目/xiaoke/dsh-xiaoke-widget

# 2) 重启 dsh web，然后刷新浏览器（F5）
```

**与小鲸鱼并存**：两个包名 / bundle id / 路由前缀 / 数据文件全部不同，
可以同时装、各挂一只。想卸掉任一只：

```bash
dsh plugin --profile web remove dsh-xiaoke-widget
```

> 若要取代小鲸鱼，装小克后先把鲸鱼卸掉（`remove dsh-whale-widget`），避免屏幕上挤两只。

---

## 五、目录结构

```text
dsh-xiaoke-widget/
├── upstream/                     # ★ 上游源码原样存放，**永不修改**（merge 的锚点）
│   ├── lib/index.js
│   ├── assets/whale-widget.js
│   └── *.upstream.md             # 上游 README / PROVENANCE / 规格提示词
├── skin/xiaoke-theme.mjs         # ★ 唯一事实来源：改名表 + 配色映射表
├── tools/build-xiaoke.mjs        # ★ 生成器：上游 + 主题 → 产物
├── lib/
│   ├── xiaoke-index.js           # ⚙ 生成产物（宿主插件，package.json main）
│   ├── xiaoke-widget.js          # ⚙ 生成产物（浏览器端挂件）
│   └── accounting.mjs            # 记账内核（上游原样）
├── assets/
│   ├── xiaoke1.png               # 小克角色图（610×610 RGBA，元数据已剥离）
│   └── *.mp3/*.wav/*.gif         # 上游音频与泡泡图
├── package.json                  # 包名 dsh-xiaoke-widget
└── cordis.patch.yml              # bundle 挂载声明
```

⚙ = **生成产物，请勿手改**（下次构建会覆盖）。要改就改 `skin/` 或 `tools/`。

---

## 六、许可与致谢

- **代码**：MIT，来自上游 MeteorNOX（见 [`LICENSE`](LICENSE)，保留原始版权声明）。
- **小克角色图**：由本项目维护者提供（AI 工具生成），按 as-is 随插件分发；
  PNG 的 `eXIf`/`iTXt`/`tEXt`/`zTXt` 元数据块已剥离（含生成工具写入的 `caBX`/C2PA 来源块）。
- 上游的素材许可范围见 [`upstream/PROVENANCE.upstream.md`](upstream/PROVENANCE.upstream.md)。

致谢 **MeteorNOX** 的 [DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) ——
记账内核、多厂商模板、泡泡系统与大量边界情况处理都出自上游，本项目只做了角色与皮肤的替换。
上游 README 记录的每一位问题报告人（含 0.3.15 凭据安全修复的报告者）同样间接惠及本项目。
