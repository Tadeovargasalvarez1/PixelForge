import type { Adjustments } from '../types';

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D');
  return ctx;
}

export function canvasSize(canvas: HTMLCanvasElement): { width: number; height: number } {
  return { width: canvas.width, height: canvas.height };
}

const clamp = (v: number, min = 0, max = 255) => (v < min ? min : v > max ? max : v);

export function buildCssFilter(adj: Adjustments): string {
  const parts: string[] = [];
  if (adj.brightness) parts.push(`brightness(${1 + adj.brightness / 100})`);
  if (adj.contrast) parts.push(`contrast(${1 + adj.contrast / 100})`);
  if (adj.saturation) parts.push(`saturate(${1 + adj.saturation / 100})`);
  if (adj.hue) parts.push(`hue-rotate(${adj.hue}deg)`);
  if (adj.grayscale) parts.push(`grayscale(${adj.grayscale}%)`);
  if (adj.sepia) parts.push(`sepia(${adj.sepia}%)`);
  if (adj.invert) parts.push(`invert(${adj.invert}%)`);
  if (adj.blur) parts.push(`blur(${adj.blur}px)`);
  if (adj.opacity < 100) parts.push(`opacity(${adj.opacity}%)`);
  return parts.length ? parts.join(' ') : 'none';
}

export function hasPixelAdjustments(adj: Adjustments): boolean {
  return (
    adj.exposure !== 0 ||
    adj.vibrance !== 0 ||
    adj.temperature !== 0 ||
    adj.tint !== 0 ||
    adj.highlights !== 0 ||
    adj.shadows !== 0 ||
    adj.whites !== 0 ||
    adj.blacks !== 0
  );
}

export function applyPixelAdjustments(img: ImageData, adj: Adjustments): void {
  const d = img.data;
  const exposureFactor = adj.exposure ? Math.pow(2, adj.exposure / 100) : 1;
  const temp = adj.temperature / 100;
  const tint = adj.tint / 100;
  const vib = adj.vibrance / 100;
  const hi = adj.highlights / 100;
  const sh = adj.shadows / 100;
  const wh = adj.whites / 100;
  const bl = adj.blacks / 100;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    if (exposureFactor !== 1) {
      r *= exposureFactor;
      g *= exposureFactor;
      b *= exposureFactor;
    }

    if (temp) {
      r += temp * 42;
      b -= temp * 42;
    }
    if (tint) {
      r += tint * 18;
      b += tint * 18;
      g -= tint * 36;
    }

    if (hi || sh || wh || bl) {
      const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      let delta = 0;
      if (sh) delta += sh * Math.pow(1 - Math.max(0, Math.min(1, l)), 2) * 78;
      if (hi) delta += hi * Math.pow(Math.max(0, Math.min(1, l)), 2) * 78;
      if (wh) delta += wh * Math.pow(Math.max(0, Math.min(1, l)), 3) * 88;
      if (bl) delta += bl * Math.pow(1 - Math.max(0, Math.min(1, l)), 3) * 88;
      r += delta;
      g += delta;
      b += delta;
    }

    if (vib) {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max <= 0 ? 0 : (max - min) / 255;
      const amount = vib * (1 - Math.max(0, Math.min(1, sat)));
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * (1 + amount);
      g = gray + (g - gray) * (1 + amount);
      b = gray + (b - gray) * (1 + amount);
    }

    d[i] = clamp(r);
    d[i + 1] = clamp(g);
    d[i + 2] = clamp(b);
  }
}

export function applySharpen(img: ImageData, amount: number): void {
  if (amount <= 0) return;
  const a = amount / 100;
  const { width: w, height: h, data: d } = img;
  const src = new Uint8ClampedArray(d);
  const center = 1 + 4 * a;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const t = i - w * 4;
      const bo = i + w * 4;
      for (let c = 0; c < 3; c++) {
        const v =
          center * src[i + c] -
          a * (src[i - 4 + c] + src[i + 4 + c] + src[t + c] + src[bo + c]);
        d[i + c] = clamp(v);
      }
    }
  }
}

export interface RenderOptions {
  width?: number;
  height?: number;
  canvas?: HTMLCanvasElement;
}

/**
 * Renders `source` with the given adjustments into a canvas.
 * Fast CSS filters run on the GPU; tonal/color corrections run per-pixel.
 */
export function renderAdjusted(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  adj: Adjustments,
  opts: RenderOptions = {},
): HTMLCanvasElement {
  const width = opts.width ?? sourceWidth;
  const height = opts.height ?? sourceHeight;
  const canvas = opts.canvas ?? createCanvas(width, height);
  if (canvas.width !== Math.round(width)) canvas.width = Math.round(width);
  if (canvas.height !== Math.round(height)) canvas.height = Math.round(height);

  const ctx = getContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = buildCssFilter(adj);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (hasPixelAdjustments(adj)) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyPixelAdjustments(img, adj);
    ctx.putImageData(img, 0, 0);
  }
  if (adj.sharpness > 0) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applySharpen(img, adj.sharpness);
    ctx.putImageData(img, 0, 0);
  }
  return canvas;
}

export function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  canvas?: HTMLCanvasElement,
): HTMLCanvasElement {
  const target = canvas ?? createCanvas(width, height);
  if (target.width !== Math.round(width)) target.width = Math.round(width);
  if (target.height !== Math.round(height)) target.height = Math.round(height);
  const ctx = getContext(target);
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, target.width, target.height);
  return target;
}

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  return drawToCanvas(source, source.width, source.height);
}

export function resizedSize(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
