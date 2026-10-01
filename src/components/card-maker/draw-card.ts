// Draws the share card onto a <canvas>; the same drawing is the live preview
// and the exported PNG. Port of the app's CardPreview (arch / frame / minimal).
import { type CardStyle, type ContentType, type Design, isLight } from "./presets";

export const CARD_WIDTH = 1080;

export type CardContent = { type: ContentType; text: string; reference: string };
export type CardFonts = { quran: string; naskh: string; modern: string; label: string };

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function khatam(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, inner = 0.62) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 8;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function rubElHizb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (const rot of [Math.PI / 4, 0]) {
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * Math.PI) / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.moveTo(cx + r * 0.32, cy);
  ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
}

function archPath(ctx: CanvasRenderingContext2D, w: number, h: number, inset: number) {
  const left = inset;
  const right = w - inset;
  const top = inset;
  const bottom = h - inset;
  const mid = w / 2;
  const archH = w * 0.34;
  const spring = top + archH;
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(left, spring);
  ctx.bezierCurveTo(left, spring - archH * 0.62, mid - (mid - left) * 0.3, top + archH * 0.22, mid, top);
  ctx.bezierCurveTo(mid + (right - mid) * 0.3, top + archH * 0.22, right, spring - archH * 0.62, right, spring);
  ctx.lineTo(right, bottom);
  ctx.closePath();
}

/** Greedy word wrap for RTL text; keeps explicit line breaks. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** Largest font size (≤ base) whose wrapped text fits the box; returns the layout. */
function fit(ctx: CanvasRenderingContext2D, text: string, family: string, base: number, lh: number, w: number, h: number) {
  let size = base;
  for (;;) {
    ctx.font = `${size}px ${family}`;
    const lines = wrap(ctx, text, w);
    if (lines.length * size * lh <= h || size <= 14) return { size, lines };
    size = Math.max(14, Math.floor(size * 0.94));
  }
}

export function drawCard(
  canvas: HTMLCanvasElement,
  content: CardContent,
  design: Design,
  style: CardStyle,
  fonts: CardFonts,
  labels: { quran: string; hadith: string; quranTag: string; empty: string; watermark: string },
) {
  const W = CARD_WIDTH;
  const ratio = design.aspect === "square" ? 1 : design.aspect === "story" ? 9 / 16 : 4 / 5;
  const H = Math.round(W / ratio);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const u = W / 340; // the app's design unit
  const light = isLight(style);
  const accent = style.accent;
  const isQuran = content.type === "quran";

  // Background gradient, top-right to bottom-left.
  const bg = ctx.createLinearGradient(W, 0, 0, H);
  bg.addColorStop(0, style.bg[0]);
  bg.addColorStop(1, style.bg[style.bg.length - 1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Girih pattern, faded where the text sits.
  if (design.pattern) {
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const p = off.getContext("2d")!;
    const cell = 34 * u;
    p.strokeStyle = alpha(accent, light ? 0.22 : 0.16);
    p.lineWidth = 0.8 * u * 0.9;
    for (let y = 0; y <= H + cell; y += cell)
      for (let x = 0; x <= W + cell; x += cell) {
        khatam(p, x, y, cell * 0.34);
        p.stroke();
        const s = cell * 0.16;
        const dx = x + cell / 2;
        const dy = y + cell / 2;
        p.beginPath();
        p.moveTo(dx, dy - s);
        p.lineTo(dx + s, dy);
        p.lineTo(dx, dy + s);
        p.lineTo(dx - s, dy);
        p.closePath();
        p.stroke();
      }
    p.globalCompositeOperation = "destination-in";
    let mask: CanvasGradient;
    if (design.layout === "minimal") {
      mask = p.createLinearGradient(0, H, 0, 0);
      mask.addColorStop(0, "#fff");
      mask.addColorStop(0.45, "rgba(255,255,255,0)");
    } else {
      const r = Math.hypot(W, H) / 2 * 0.85;
      mask = p.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, r);
      mask.addColorStop(0.35, "rgba(255,255,255,0)");
      mask.addColorStop(1, "#fff");
    }
    p.fillStyle = mask;
    p.fillRect(0, 0, W, H);
    ctx.drawImage(off, 0, 0);
  }

  // Soft glow behind the text.
  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75 / 1.4);
  glow.addColorStop(0, alpha(accent, 0.12));
  glow.addColorStop(1, alpha(accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = W / 2;
  const header = isQuran ? labels.quran : content.type === "hadith" ? labels.hadith : null;

  const label = (text: string, y: number, size: number) => {
    ctx.font = `700 ${size}px ${fonts.label}`;
    ctx.fillStyle = accent;
    ctx.fillText(text, cx, y);
  };
  const star = (x: number, y: number, r: number, color = accent, width = r * 0.14) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    rubElHizb(ctx, x, y, r);
    ctx.stroke();
  };
  const diamond = (x: number, y: number, s: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = accent;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  };
  const divider = (y: number, left: number, right: number, center?: string) => {
    let half = 8 * u;
    if (center) {
      ctx.font = `700 ${13 * u}px ${fonts.label}`;
      half = Math.min(ctx.measureText(center).width, (right - left) * 0.6) / 2;
    }
    const inner = half + 10 * u;
    for (const [from, to] of [
      [left, cx - inner - 6 * u],
      [cx + inner + 6 * u, right],
    ]) {
      const g = ctx.createLinearGradient(from, 0, to, 0);
      const fadeLeft = from === left;
      g.addColorStop(0, alpha(accent, fadeLeft ? 0 : 1));
      g.addColorStop(fadeLeft ? 0.4 : 0.6, accent);
      g.addColorStop(1, alpha(accent, fadeLeft ? 1 : 0));
      ctx.fillStyle = g;
      ctx.fillRect(from, y - u * 0.5, to - from, u);
    }
    diamond(cx - inner, y, 4 * u);
    diamond(cx + inner, y, 4 * u);
    if (center) label(center, y, 13 * u);
    else star(cx, y, 7 * u);
  };
  const watermark = (y: number) => {
    const color = alpha(style.text, 0.45);
    ctx.font = `${12 * u}px ${fonts.naskh}`;
    ctx.fillStyle = color;
    const tw = ctx.measureText(labels.watermark).width;
    ctx.fillText(labels.watermark, cx - 8 * u, y);
    star(cx + tw / 2, y, 5 * u, color, 0.7 * u);
  };
  const reference = (y: number) => {
    ctx.font = `700 ${13 * u}px ${fonts.label}`;
    ctx.fillStyle = accent;
    ctx.fillText(isQuran ? `﴿ ${content.reference} ﴾` : content.reference, cx, y, W - 70 * u);
  };
  const pill = (y: number) => {
    ctx.font = `700 ${13 * u}px ${fonts.label}`;
    const text = isQuran ? `﴿ ${content.reference} ﴾` : content.reference;
    const w = Math.min(ctx.measureText(text).width + 28 * u, W - 70 * u);
    const h = 28 * u;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, y - h / 2, w, h, h / 2);
    ctx.fillStyle = alpha(accent, 0.12);
    ctx.fill();
    ctx.strokeStyle = alpha(accent, 0.45);
    ctx.lineWidth = u;
    ctx.stroke();
    reference(y);
  };
  const body = (left: number, right: number, top: number, bottom: number) => {
    const w = right - left;
    const h = bottom - top;
    if (!content.text) {
      ctx.font = `${15 * u}px ${fonts.modern}`;
      ctx.fillStyle = alpha(style.text, 0.4);
      ctx.fillText(labels.empty, cx, (top + bottom) / 2);
      return;
    }
    const family = isQuran ? fonts.quran : design.font === "modern" ? fonts.modern : fonts.naskh;
    const base = (isQuran ? 30 : 22) * u * design.scale;
    const lh = isQuran ? 1.95 : 1.75;
    const { size, lines } = fit(ctx, content.text, family, base, lh, w, h);
    ctx.font = `${size}px ${family}`;
    ctx.fillStyle = style.text;
    if (!light) {
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 8 * u;
    }
    const lineH = size * lh;
    let y = (top + bottom) / 2 - ((lines.length - 1) * lineH) / 2;
    for (const line of lines) {
      ctx.fillText(line, cx, y);
      y += lineH;
    }
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  };

  const hasRef = content.reference.length > 0;

  if (design.layout === "arch") {
    const inset = 14 * u;
    ctx.strokeStyle = alpha(accent, 0.85);
    ctx.lineWidth = 1.6 * u * 0.9;
    archPath(ctx, W, H, inset);
    ctx.stroke();
    ctx.strokeStyle = alpha(accent, 0.4);
    ctx.lineWidth = 0.8 * u;
    archPath(ctx, W, H, inset + 6 * u);
    ctx.stroke();
    ctx.fillStyle = accent;
    khatam(ctx, cx, inset, 7 * u);
    ctx.fill();

    const top = inset + W * 0.34 * 0.55;
    const bottom = H - inset - 12 * u;
    const side = 32 * u;
    const y = top + 10 * u;
    if (header) label(header, y, 13 * u);
    else star(cx, y, 9 * u);
    const bodyTop = y + 22 * u;
    let yb = bottom - 8 * u;
    watermark(yb);
    yb -= 24 * u;
    if (hasRef) {
      reference(yb);
      yb -= 20 * u;
      divider(yb, side, W - side);
      yb -= 18 * u;
    }
    body(side, W - side, bodyTop, yb);
  } else if (design.layout === "frame") {
    const inset = 16 * u;
    const gap = 12 * u;
    ctx.strokeStyle = alpha(accent, 0.75);
    ctx.lineWidth = 1.4 * u * 0.9;
    const [l, t, r, b] = [inset, inset, W - inset, H - inset];
    ctx.beginPath();
    ctx.moveTo(l + gap, t);
    ctx.lineTo(r - gap, t);
    ctx.moveTo(l + gap, b);
    ctx.lineTo(r - gap, b);
    ctx.moveTo(l, t + gap);
    ctx.lineTo(l, b - gap);
    ctx.moveTo(r, t + gap);
    ctx.lineTo(r, b - gap);
    ctx.stroke();
    ctx.strokeStyle = alpha(accent, 0.35);
    ctx.lineWidth = 0.8 * u;
    ctx.strokeRect(l + 7 * u, t + 7 * u, r - l - 14 * u, b - t - 14 * u);
    for (const [x, y] of [
      [l, t],
      [r, t],
      [l, b],
      [r, b],
    ])
      star(x, y, 8 * u, accent, 1.2 * u);

    const side = 34 * u;
    const top = inset + 22 * u;
    divider(top + 8 * u, side, W - side, header ?? undefined);
    let yb = H - inset - 14 * u - 8 * u;
    watermark(yb);
    yb -= 30 * u;
    if (hasRef) {
      pill(yb);
      yb -= 30 * u;
    }
    body(side, W - side, top + 30 * u, yb);
  } else {
    const tag = isQuran ? labels.quranTag : content.type === "hadith" ? labels.hadith : null;
    const pad = 28 * u;
    const y0 = pad + 8 * u;
    let half = 8 * u;
    if (tag) {
      ctx.font = `700 ${12 * u}px ${fonts.label}`;
      half = ctx.measureText(tag).width / 2;
      label(tag, y0, 12 * u);
    } else star(cx, y0, 7 * u);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(cx - half - 8 * u - 22 * u, y0 - 1.5 * u, 22 * u, 3 * u, 2 * u);
    ctx.roundRect(cx + half + 8 * u, y0 - 1.5 * u, 22 * u, 3 * u, 2 * u);
    ctx.fill();

    let yb = H - 22 * u - 8 * u;
    ctx.font = `${12 * u}px ${fonts.naskh}`;
    const ww = ctx.measureText(labels.watermark).width + 24 * u;
    ctx.fillStyle = alpha(style.text, 0.15);
    ctx.fillRect(pad, yb - 0.5 * u, cx - ww / 2 - pad, u);
    ctx.fillRect(cx + ww / 2, yb - 0.5 * u, W - pad - cx - ww / 2, u);
    watermark(yb);
    yb -= 28 * u;
    if (hasRef) {
      reference(yb);
      yb -= 24 * u;
    }
    body(pad, W - pad, y0 + 22 * u, yb);
  }
}
