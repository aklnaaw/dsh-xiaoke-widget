#!/usr/bin/env python3
# ============================================================================
# gen-cover.py —— 生成小克视频封面（B 站用）
# ============================================================================
# 出两张：
#   cover-4x3.png   1440x1080   4:3
#   cover-16x9.png  1920x1080   16:9
#
# 设计：Claude 官方暖色系（米白 #faf9f5 + 珊瑚橙 #d97757），不写字，纯展示角色。
#   · 背景：米白 + 右下角柔和的珊瑚光晕
#   · 装饰：真实 Claude 星芒（取自 dsh-claude-theme 的 brand-plugin，非重绘近似）
#   · 角色：高清源（1254px）裁切，不放大插件里的 610px 版本，避免发虚
#
# 用法：python3 tools/gen-cover.py
# ============================================================================

import pathlib
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "cover"
OUT.mkdir(exist_ok=True)

# 高清角色源（1254×1254，四角透明）。插件里用的是缩放后的 610px，
# 封面需要更大，所以直接用原始高清图重新裁切。
MASCOT_CANDIDATES = [
    pathlib.Path("/home/aklnaaw/下载/ChatGPT Image 2026年9月25日 20_50_35.png"),
    ROOT / "assets" / "xiaoke1.png",
]

# Claude 星芒的真实路径（与 brand-plugin 注入侧栏的是同一条，
# 不是照着画的近似图形）。取自 dsh-claude-theme/scripts/cover-assets.json。
STARBURST_PATH = (
    "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971"
    "-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972"
    " 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918"
    "-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035"
    ".1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032"
    "-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985"
    ".2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918"
    ".5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053"
    " 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414"
    "-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946"
    "-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247"
    ".7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686"
    " 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17"
    "l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414"
    "-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246"
    ".3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164"
    "-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164"
    "-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
)

CREAM = (250, 249, 245)
CORAL = (217, 119, 87)
CORAL_SOFT = (224, 138, 106)


def load_mascot():
    """高清裁切：去掉透明边，保留原始分辨率。"""
    for p in MASCOT_CANDIDATES:
        if p.exists():
            im = Image.open(p).convert("RGBA")
            bb = im.getchannel("A").getbbox()
            if bb:
                im = im.crop(bb)
            return im, p
    raise SystemExit("找不到角色图源")


def render_starburst(size, color=CORAL):
    """用 rsvg-convert 渲染真实星芒 SVG → PNG（带透明通道）。"""
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.16 17.04" '
        f'width="{size}" height="{int(size * 17.04 / 23.16)}">'
        f'<path d="{STARBURST_PATH}" fill="rgb({color[0]},{color[1]},{color[2]})"/></svg>'
    )
    tmp_svg = pathlib.Path("/tmp/_star.svg")
    tmp_png = pathlib.Path("/tmp/_star.png")
    tmp_svg.write_text(svg, encoding="utf-8")
    subprocess.run(
        ["rsvg-convert", "-o", str(tmp_png), "-w", str(size), str(tmp_svg)],
        check=True, capture_output=True,
    )
    return Image.open(tmp_png).convert("RGBA")


def warm_background(w, h, glow_center, glow_radius):
    """米白底 + 柔和的珊瑚径向光晕（用逐像素算，保证平滑无banding）。"""
    base = Image.new("RGB", (w, h), CREAM)
    glow = Image.new("L", (w, h), 0)
    gd = ImageDraw.Draw(glow)
    gx, gy = glow_center
    # 同心圆由外向内加亮，做出径向渐变
    steps = 60
    for i in range(steps, 0, -1):
        r = glow_radius * i / steps
        v = int(46 * (1 - i / steps) ** 1.6)
        gd.ellipse([gx - r, gy - r * 0.9, gx + r, gy + r * 0.9], fill=v)
    glow = glow.filter(ImageFilter.GaussianBlur(glow_radius * 0.10))
    tint = Image.new("RGB", (w, h), CORAL_SOFT)
    return Image.composite(tint, base, glow)


def compose(w, h, mascot, layout):
    """按布局合成一张封面。layout 决定角色与星芒的位置。"""
    canvas = warm_background(w, h, *layout["glow"])

    # —— 星芒装饰：低透明度，压在角色后面 ——
    star = render_starburst(layout["star_size"])
    star.putalpha(star.getchannel("A").point(lambda a: int(a * layout["star_alpha"])))
    canvas.paste(star, layout["star_pos"], star)

    # —— 角色：缩放到目标高度，底部对齐 ——
    mh = layout["mascot_h"]
    mw = int(mascot.width * mh / mascot.height)
    m = mascot.resize((mw, mh), Image.LANCZOS)

    # 角色自带的柔和投影：用 alpha 做一层模糊暗影，让角色“坐”在背景上
    shadow = Image.new("RGBA", (mw, mh), (0, 0, 0, 0))
    sa = m.getchannel("A").point(lambda a: int(a * 0.16))
    shadow.putalpha(sa.filter(ImageFilter.GaussianBlur(max(6, mh // 90))))
    shadow.putpixel((0, 0), (0, 0, 0, 0))
    sx, sy = layout["mascot_pos"]
    canvas.paste(Image.new("RGB", (mw, mh), (120, 80, 60)), (sx, sy + max(4, mh // 120)), shadow)
    canvas.paste(m, (sx, sy), m)
    return canvas


def main():
    mascot, src = load_mascot()
    print(f"角色源: {src.name}  ({mascot.width}x{mascot.height})")

    # —— 16:9 (1920x1080)：角色偏右（三分线），星芒在左做视觉平衡 ——
    W1, H1 = 1920, 1080
    mh1 = int(H1 * 0.94)
    mw1 = int(mascot.width * mh1 / mascot.height)
    c1 = compose(W1, H1, mascot, {
        "glow": ((W1 * 0.72, H1 * 0.78), int(W1 * 0.46)),
        "star_size": int(W1 * 0.30), "star_alpha": 0.13,
        "star_pos": (int(W1 * 0.07), int(H1 * 0.30)),
        "mascot_h": mh1, "mascot_pos": (W1 - mw1 - int(W1 * 0.045), H1 - mh1),
    })
    c1.save(OUT / "cover-16x9.png")
    print(f"✓ {OUT/'cover-16x9.png'}  {c1.size}")

    # —— 4:3 (1440x1080)：角色居中，星芒当背后光晕 ——
    W2, H2 = 1440, 1080
    mh2 = int(H2 * 0.97)
    mw2 = int(mascot.width * mh2 / mascot.height)
    c2 = compose(W2, H2, mascot, {
        "glow": ((W2 * 0.50, H2 * 0.74), int(W2 * 0.62)),
        "star_size": int(W2 * 0.42), "star_alpha": 0.11,
        "star_pos": (int((W2 - W2 * 0.42) / 2), int(H2 * 0.16)),
        "mascot_h": mh2, "mascot_pos": ((W2 - mw2) // 2, H2 - mh2),
    })
    c2.save(OUT / "cover-4x3.png")
    print(f"✓ {OUT/'cover-4x3.png'}  {c2.size}")


if __name__ == "__main__":
    main()
