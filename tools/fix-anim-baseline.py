#!/usr/bin/env python3
# ============================================================================
# fix-anim-baseline.py —— 把动态小克的对齐修正到「贴底」
# ============================================================================
# 问题：挂件用 `.dshxkv-img{position:absolute;right:0;bottom:0;object-position:right bottom}`
#   定位 —— 贴的是**图片画布的下边**，不是人物脚底。静态 xiaoke1.png 的内容
#   正好裁到画布下边缘（底边距 0px），而动态 WebP 每帧上下都留了透明边距
#   （256 档 19px、384 档 30px）⇒ 动态小克看起来悬空、贴不到底。
#
# 修法：**只改 WebP 容器里每个 ANMF 帧的 Y 偏移**（元数据，24 位、单位 2px），
#   把整段动画下移，使动画的最低点落到画布底边。**不重编码、不动任何像素数据**，
#   因此画质零损失（已逐帧比对：208 帧全部逐像素一致，仅整体位移）。
#
# 用法：
#   python3 tools/fix-anim-baseline.py                    # 检查 assets/ 里的 256/384 四档
#   python3 tools/fix-anim-baseline.py --apply            # 应用修复
#   python3 tools/fix-anim-baseline.py --apply <文件…>    # 修指定文件（例如 512 高清包解开后的两个）
# ============================================================================

import pathlib
import struct
import sys

from PIL import Image, ImageSequence

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = [
    'xiaoke-anim-256.webp',
    'xiaoke-anim-384.webp',
    'xiaoke-anim-cry-256.webp',
    'xiaoke-anim-cry-384.webp',
]


def measure(path):
    """返回 (画布宽, 画布高, 动画最低点 Y)。"""
    im = Image.open(path)
    W, H = im.size
    bottoms = []
    for fr in ImageSequence.Iterator(im):
        bb = fr.convert('RGBA').getchannel('A').getbbox()
        if bb:
            bottoms.append(bb[3])
    return W, H, max(bottoms)


def frame_rects(path):
    """列出所有 ANMF 帧的 (x, y, w, h) 及 payload 里 Y 字段的字节偏移。"""
    d = path.read_bytes()
    assert d[:4] == b'RIFF' and d[8:12] == b'WEBP', f'{path} 不是 WebP'
    out = []
    i = 12
    while i + 8 <= len(d):
        fourcc = d[i:i + 4]
        size = struct.unpack('<I', d[i + 4:i + 8])[0]
        if fourcc == b'ANMF':
            p = i + 8
            x = int.from_bytes(d[p:p + 3], 'little') * 2
            y = int.from_bytes(d[p + 3:p + 6], 'little') * 2
            w = int.from_bytes(d[p + 6:p + 9], 'little') + 1
            h = int.from_bytes(d[p + 9:p + 12], 'little') + 1
            out.append((x, y, w, h, p + 3))   # p+3 = Y 字段的三字节起点
        i += 8 + size + (size & 1)
    return out


def shift(path, dy):
    """把每个 ANMF 帧的 Y 偏移加 dy（必须偶数）。就地重写文件，只改这几个字节。"""
    assert dy % 2 == 0, 'ANMF 的 Y 偏移单位是 2px，只能取偶数'
    d = bytearray(path.read_bytes())
    n = 0
    for _, _, _, _, yoff in frame_rects(path):
        v = int.from_bytes(d[yoff:yoff + 3], 'little')
        d[yoff:yoff + 3] = (v + dy // 2).to_bytes(3, 'little')
        n += 1
    path.write_bytes(bytes(d))
    return n


def main():
    argv = sys.argv[1:]
    apply = '--apply' in argv
    # 位置参数 = 指定要处理的文件（用于 512 高清包解开后的两个文件）；
    # 不传则默认处理 assets/ 里的 256/384 四档。
    extra = [a for a in argv if not a.startswith('--')]
    targets = [pathlib.Path(a) for a in extra] if extra else [ROOT / 'assets' / n for n in FILES]

    print('动态小克贴底修正' + ('（应用）' if apply else '（检查，不写文件）'))
    print()
    changed = 0
    for p in targets:
        if not p.exists():
            print(f'  ✗ 找不到 {p}')
            continue
        name = p.name
        W, H, bottom = measure(p)
        gap = H - bottom
        if gap <= 1:
            print(f'  {name:24} 底边距 {gap}px —— 无需修改')
            continue
        dy = (gap // 2) * 2          # 取偶数：ANMF 的 Y 只能以 2px 为单位
        # 校验下移后不越界
        rects = frame_rects(p)
        maxb = max(y + h for _, y, _, h, _ in rects)
        if maxb + dy > H:
            print(f'  {name:24} ✗ 下移 {dy}px 会越界（帧底 {maxb} + {dy} > {H}）')
            continue
        if apply:
            n = shift(p, dy)
            W2, H2, b2 = measure(p)
            print(f'  {name:24} 下移 {dy}px（{n} 帧）→ 底边距 {gap}px ⇒ {H2 - b2}px')
            changed += 1
        else:
            print(f'  {name:24} 底边距 {gap}px ⇒ 建议下移 {dy}px（改后 {gap - dy}px）')
    print()
    if not apply:
        print('加 --apply 应用修复。')
    elif changed:
        print(f'✓ 已修正 {changed} 个文件（未动像素）')
        print('  提示：改的是仓库内 256/384 档时需重新提交；改的是 512 高清包时')
        print('        需重新打包上传 Release，并同步 skin/xiaoke-features.mjs 里的 SHA-256。')
    else:
        print('✓ 无需修改')


if __name__ == '__main__':
    main()
