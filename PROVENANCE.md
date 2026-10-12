# 素材来源与许可范围（本项目）

本仓库是 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) 的二创。
上游的素材说明原样保留在 [`upstream/PROVENANCE.upstream.md`](upstream/PROVENANCE.upstream.md)，
**那份文本仍然适用于从上游继承的全部素材**（音效、泡泡图）。本文件只补充本项目新增的部分。

## 一、许可范围

| 范围 | 许可 |
|---|---|
| `lib/xiaoke-index.js`、`lib/xiaoke-widget.js` | **MIT**（生成产物，见 [`LICENSE`](LICENSE)；原始版权归 MeteorNOX） |
| `lib/accounting.mjs`、`skin/`、`tools/`、文档 | **MIT** |
| `assets/xiaoke1.png`（本项目新增的角色图） | **CC BY-NC-SA 4.0**（可自由使用，**不可商用**，需署名并以相同协议共享）—— 详见 [`LICENSE-ARTWORK`](LICENSE-ARTWORK) |
| `icon.png`（插件列表图标） | 由 `assets/xiaoke1.png` 裁切合成，**同样 CC BY-NC-SA 4.0**（见 [`LICENSE-ARTWORK`](LICENSE-ARTWORK)）。上游 v0.4.1 起 `package.json` 需要它，随上游那份是鲸鱼娘，本项目已换成小克 |
| `assets/xiaoke-anim-*.webp`、`assets/xiaoke-anim-cry-*.webp`（动态小克），以及 Releases 里的高清包 `xiaoke-anim-hd.zip` | 基于 `xiaoke1.png` 制作的衍生素材（经本项目作者同意），**同样 CC BY-NC-SA 4.0**（见 [`LICENSE-ARTWORK`](LICENSE-ARTWORK)） |
| `assets/` 其余文件（音效 / 泡泡图） | 沿用上游说明，见 [`upstream/PROVENANCE.upstream.md`](upstream/PROVENANCE.upstream.md) |
| `assets/approve-default.wav`、`ask-default.wav`、`cost-default.wav` | 上游 v0.4.0「音效四通道化」新增的默认音，随上游继承 |

## 二、本项目新增素材

| 文件 | 来源 / 说明 |
|---|---|
| `xiaoke1.png`（610×610 RGBA） | **AI 工具生成**的 Claude 拟人角色图，经人工挑选、裁掉透明边、缩放为 610×610 以匹配上游的角色图规格（上游 `setupHitTest` 的命中画布是 610×610）。著作权声明与授权条款见 [`LICENSE-ARTWORK`](LICENSE-ARTWORK)。 |
| `icon.png`（256×256 RGBA） | 由上面那张裁切合成：256×256 圆角方块 + 珊瑚描边。规格对齐上游 `icon.png`（同为 256×256 RGBA 圆角方块），生成方式见 `tools/gen-icon.py`。 |
| `xiaoke-anim-{256,384}.webp`（动态 WebP，透明背景） | 「小克（动态）」用的日常动图，由 [AirsEDA](https://github.com/AirsEDA) 制作：以 `xiaoke1.png` 为底，用 AI 工具重绘睁眼 / 半闭 / 将闭 / 全闭四种眼睛状态，头发轻晃、身体呼吸由程序逐帧变形渲染（约 5.3 秒晃一个来回，16 秒正好 3 个来回，首尾接得上）。16 秒一圈，眨眼预排在第 1.2 秒和第 8.2 秒；眨眼那几帧 25 帧/秒，头发和呼吸 12.5 帧/秒，共 208 帧（浏览器会把动图每帧解码后留在内存里，帧数少一半占用就少一半）。第一帧选了轮廓最居中的姿势：挂件按第一帧算 clip-path 凸包，这样头发摆动时被裁掉的最少。 |
| `xiaoke-anim-cry-{256,384}.webp` | 「小克（含余额预警）」余额告急时换上的大泪珠哭脸，制作方式同上（哭脸和哭脸的眼睛状态由 AI 工具重绘），泪珠随动作轻晃。 |
| `xiaoke-anim-512.webp`、`xiaoke-anim-cry-512.webp`（高清包） | 同上两种表情的 512 档，不放在仓库里，打成 `xiaoke-anim-hd.zip`（`tools/pack-anim-hd.mjs`，条目不压缩）发在 [AirsEDA 的 Releases](https://github.com/AirsEDA/dsh-xiaoke-widget/releases)，本仓库的 Releases 里也放一份（同一个文件，挂件里两个下载地址都有）；插件安装时按 `skin/xiaoke-features.mjs` 里的 SHA-256 核对。 |

### 元数据清理

上游自 0.3.1 起要求随包 PNG 剥离文本 / EXIF 块。本项目照做：

- `xiaoke1.png` 已剥离全部非必要块，只保留 `IHDR` / `IDAT` / `IEND`；
- 生成工具写入的 **`caBX` 块（C2PA 内容来源追踪）** 确认已不存在；
- 剥离是逐块重写，不触碰像素数据，因此画面完全不变。
- 动态小克的 WebP（随插件 4 个、高清包 2 个）由原始像素直接编码，只含 `VP8X` / `ANIM` / `ANMF` 块，没有 `EXIF` / `XMP ` / `ICCP`。

复核方式：

```bash
python3 - <<'EOF'
import struct
d = open('assets/xiaoke1.png','rb').read()
i = 8; chunks = []
while i < len(d):
    n = struct.unpack('>I', d[i:i+4])[0]
    t = d[i+4:i+8].decode('latin1')
    chunks.append(t); i += 12 + n
    if t == 'IEND': break
print(chunks)   # 期望：IHDR/IDAT…/IEND，无 eXIf、iTXt、tEXt、zTXt、caBX
EOF
```

### 已移除的上游素材

为减小仓库体积，以下文件已从本项目删除（它们在生成产物中**不再被引用**）：

| 文件 | 原因 |
|---|---|
| `DSniang1.png` / `DSniang02.png` | 上游的小鲸鱼角色图，已被 `xiaoke1.png` 取代 |
| `DSH2.png` | 上游 README 顶部展示图，本仓库改用 `xiaoke1.png` |

## 三、权利主张 / Takedown

若你认为本项目新增素材侵犯了你的权利，请开 issue 说明**文件名**与**依据**，
会在核实后立即替换或移除。上游素材的权利主张请同时参考上游仓库。
