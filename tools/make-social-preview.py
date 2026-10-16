#!/usr/bin/env python3
"""Generate the BloodBuddy 1200x630 social preview image (pure Pillow, portable).

Reproduces the project's OWN brand: the favicon blood-drop path
(frontend/public/favicon.svg, crimson #A51D35 + white drop) and the README
tagline. No machine paths, no external assets - runs from any cwd.

Usage: python3 tools/make-social-preview.py [output.png]
"""

from __future__ import annotations

import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

# Brand tokens - taken from frontend/public/favicon.svg + README
CRIMSON = (165, 29, 53)          # #A51D35
CRIMSON_DARK = (120, 18, 38)     # darkened for depth
WHITE = (255, 255, 255)
WHITE_SOFT = (255, 255, 255, 235)

W, H = 1200, 630


def cubic(p0, p1, p2, p3, t):
    """De Casteljau point on a cubic bezier."""
    u = 1 - t
    return (
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    )


def drop_polygon(scale=1.0, origin=(0.0, 0.0), samples=48):
    """Sample the favicon drop path (viewBox 32x32) into a polygon.

    Path from favicon.svg: M16 8c-2 4-6 6-6 10a6 6 0 1 0 12 0c0-4-4-6-6-10z
    """
    ox, oy = origin
    pts = []

    # c-2 4 -6 6 -6 10 : cubic from (16,8) to (10,18)
    p0, p1, p2, p3 = (16, 8), (14, 12), (10, 14), (10, 18)
    for i in range(samples + 1):
        x, y = cubic(p0, p1, p2, p3, i / samples)
        pts.append((ox + x * scale, oy + y * scale))

    # a6 6 0 1 0 12 0 : arc from (10,18) to (22,18), r=6, sweep=0 (bottom half)
    cx, cy = 16, 18
    for i in range(samples + 1):
        # sweep=0 => go clockwise through the bottom (angle from pi to 0)
        a = math.pi * (1 - i / samples)
        x = cx + 6 * math.cos(a)
        y = cy + 6 * math.sin(a)
        pts.append((ox + x * scale, oy + y * scale))

    # c0 -4 -4 -6 -6 -10 : cubic from (22,18) back to (16,8)
    p0, p1, p2, p3 = (22, 18), (22, 14), (18, 12), (16, 8)
    for i in range(samples + 1):
        x, y = cubic(p0, p1, p2, p3, i / samples)
        pts.append((ox + x * scale, oy + y * scale))

    return pts


def vgrad(w, h, top, bottom):
    """Vertical gradient image."""
    base = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(h - 1, 1)
        col = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=col)
    return base


def font_path(size):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


def main() -> int:
    out = sys.argv[1] if len(sys.argv) > 1 else "frontend/public/og-image.png"

    img = vgrad(W, H, CRIMSON, CRIMSON_DARK)
    d = ImageDraw.Draw(img, "RGBA")

    # soft glow behind the drop
    glow_r = 260
    glow_center = (W // 2, 245)
    for r in range(glow_r, 0, -8):
        alpha = int(14 * (1 - r / glow_r) + 6)
        d.ellipse(
            [glow_center[0] - r, glow_center[1] - r, glow_center[0] + r, glow_center[1] + r],
            fill=(255, 255, 255, alpha),
        )

    # blood-drop logo (reproduced from favicon.svg), centered upper area
    drop_scale = 11.0
    drop_w = 12 * drop_scale      # ~132
    drop_h = 20 * drop_scale      # ~220
    drop_origin = (W // 2 - 6 * drop_scale, 150)
    d.polygon(
        drop_polygon(scale=drop_scale, origin=drop_origin),
        fill=WHITE,
    )

    # wordmark
    f_title = font_path(92)
    title = "BloodBuddy"
    tb = d.textbbox((0, 0), title, font=f_title)
    tw = tb[2] - tb[0]
    d.text(((W - tw) / 2, 395), title, font=f_title, fill=WHITE)

    # tagline (README tagline, exact copy)
    f_tag = font_path(38)
    tagline = "Every donor counts. Every connection matters."
    tb2 = d.textbbox((0, 0), tagline, font=f_tag)
    tw2 = tb2[2] - tb2[0]
    d.text(((W - tw2) / 2, 522), tagline, font=f_tag, fill=WHITE_SOFT)

    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, "PNG")
    print(f"wrote {out} {img.size[0]}x{img.size[1]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
