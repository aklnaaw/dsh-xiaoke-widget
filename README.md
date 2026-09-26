# 小克桌宠（dsh-xiaoke-widget）

> **这是二创。** 基于 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)（MIT）改的私人版本。
> 上游是「小鲸鱼 + DeepSeek 靛蓝」，这里换成 **Claude 拟人角色「小克」+ Claude 暖橙**，功能一个不少。

「小克」是 SillyTavern 中文圈对 Claude 的习惯叫法。

![小克](assets/xiaoke1.png)

## 改了什么

| | 上游 | 这里 |
|---|---|---|
| 角色 | 小鲸鱼 | **小克**（橘发 / 手持星芒手账本） |
| 主色 | 靛蓝 `#203170` | **珊瑚橙 `#d97757`** |
| 正文色 | 靛蓝 | 暖近黑 `#2b2925` |
| 面板底 | 冷白 `#fff` | 暖米白 `#faf9f5` |
| 气泡描边 | 靛蓝，粗细 18 | 珊瑚橙，粗细 26 |
| 台词 | 大量鲸鱼 / DeepSeek 梗 | **全部换成 Claude 的梗**（`你说得对`、道歉成瘾、幻觉、`rm -rf`、画不了图、Claude Code 后门事件…） |
| 包名 / 路由 | `dsh-whale-widget` / `/dsh-whale/` | `dsh-xiaoke-widget` / `/dsh-xiaoke/` |

**没改**：记账内核、峰谷定价、34 个多厂商模板、凭据安全策略、拖拽吸附、音效引擎、泡泡系统、Codex 统计 —— 全部继承上游。

## 功能

余额 / 今日已用 / 峰谷定价 / 每轮消耗 + 可自定义泡泡（点击序列、模块化排版、并列加权、随机语句与随机图片）、
自定义角色与音效、拖拽吸附与翻转。详见 [上游 README](upstream/README.upstream.md)。

## 安装

```bash
dsh plugin --profile web add link:/home/aklnaaw/项目/xiaoke/dsh-xiaoke-widget
# 然后在 web profile 里重启 dsh web
```

## 怎么改

上游源码原样放在 `upstream/`（**永不修改**），产物由构建脚本生成：

```bash
node tools/build-xiaoke.mjs          # 生成 lib/xiaoke-index.js 与 lib/xiaoke-widget.js
node tools/build-xiaoke.mjs --check  # 校验产物是最新的
npm run verify                       # 全部检查（构建 + 语法 + 路由 + 可执行性）
npm run copy                         # 刷新台词清单 COPY-INVENTORY.md
```

| 想改 | 改哪 |
|---|---|
| 配色 / 气泡描边 / 余额数字颜色 | `skin/xiaoke-theme.mjs` 顶部的 `LOOK` 与配色表 |
| **台词** | `skin/xiaoke-theme.mjs` 的 `COPY_REWRITE` / `COPY_APPEND` |
| 角色图 | 替换 `assets/xiaoke1.png`（610×610 RGBA） |

> ⚙️ `lib/` 下两个文件是**生成产物，勿手改** —— 下次构建会覆盖。

## 同步上游

```bash
git fetch upstream
git merge upstream/main      # 不会冲突：上游文件从没被改过
node tools/build-xiaoke.mjs  # 重新套主题与台词
```

因为上游文件保持原样、差异全部由 `skin/xiaoke-theme.mjs` 描述，merge 永远是干净快进。

## 台词清单

- [COPY-INVENTORY.md](COPY-INVENTORY.md) —— **当前生效的 61 条**（自动生成）
- [COPY-FINAL.md](COPY-FINAL.md) —— 定稿记录（改写 40 / 新增 13 / 保留 8 的对照）

## 许可

- **代码**：MIT，原始版权归 MeteorNOX（见 [LICENSE](LICENSE)）。
- **小克角色图**：本项目提供（AI 工具生成），PNG 元数据已剥离。见 [PROVENANCE.md](PROVENANCE.md)。

致谢 **MeteorNOX** 的上游项目 —— 记账内核、多厂商模板、泡泡系统与大量边界处理都出自那里，本项目只做了角色与皮肤的替换。
