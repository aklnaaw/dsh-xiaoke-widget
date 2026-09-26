# 素材来源与许可范围（本项目）

本仓库是 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) 的二创。
上游的素材说明原样保留在 [`upstream/PROVENANCE.upstream.md`](upstream/PROVENANCE.upstream.md)，
**那份文本仍然适用于从上游继承的全部素材**（音效、泡泡图）。本文件只补充本项目新增的部分。

## 一、许可范围

| 范围 | 许可 |
|---|---|
| `lib/xiaoke-index.js`、`lib/xiaoke-widget.js` | **MIT**（生成产物，见 [`LICENSE`](LICENSE)；原始版权归 MeteorNOX） |
| `lib/accounting.mjs`、`skin/`、`tools/`、文档 | **MIT** |
| `assets/xiaoke1.png`（本项目新增的角色图） | **不适用 MIT**：AI 工具生成，按 as-is 随插件分发，仅用于运行本插件；不授予再许可，也不声明为原创作品 |
| `assets/` 其余文件（音效 / 泡泡图） | 沿用上游说明，见 [`upstream/PROVENANCE.upstream.md`](upstream/PROVENANCE.upstream.md) |

## 二、本项目新增素材

| 文件 | 来源 / 说明 |
|---|---|
| `xiaoke1.png`（610×610 RGBA） | **AI 工具生成**的 Claude 拟人角色图，经人工挑选、裁掉透明边、缩放为 610×610 以匹配上游的角色图规格（上游 `setupHitTest` 的命中画布是 610×610）。 |

### 元数据清理

上游自 0.3.1 起要求随包 PNG 剥离文本 / EXIF 块。本项目照做：

- `xiaoke1.png` 已剥离全部非必要块，只保留 `IHDR` / `IDAT` / `IEND`；
- 生成工具写入的 **`caBX` 块（C2PA 内容来源追踪）** 确认已不存在；
- 剥离是逐块重写，不触碰像素数据，因此画面完全不变。

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
