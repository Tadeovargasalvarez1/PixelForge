import type { LoadedImage } from '../types';
import { createCanvas, drawToCanvas, getContext } from './imageEngine';
import { encodeOffThread } from './exporter';

export const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'image/avif',
];

export const MAX_FILE_BYTES = 60 * 1024 * 1024;

let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export class UnsupportedImageError extends Error {}
export class TooLargeError extends Error {}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

async function decodeToBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // fall through to <img> decoding (SVG, some BMP/AVIF cases)
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new UnsupportedImageError('decode-failed'));
    };
    img.src = url;
  });
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (file.size > MAX_FILE_BYTES) throw new TooLargeError('too-large');
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(file.name);
  if (!isImage) throw new UnsupportedImageError('not-image');

  const decoded = await decodeToBitmap(file);
  const width = 'naturalWidth' in decoded ? decoded.naturalWidth : decoded.width;
  const height = 'naturalHeight' in decoded ? decoded.naturalHeight : decoded.height;
  if (!width || !height) throw new UnsupportedImageError('empty');

  const bitmap =
    decoded instanceof ImageBitmap
      ? decoded
      : await createImageBitmap(decoded).catch(() => decoded as unknown as ImageBitmap);

  return {
    id: uid('img'),
    name: file.name.replace(/\.[^.]+$/, '') || 'imagen',
    type: (file.type || 'image/png').split(';')[0],
    size: file.size,
    width,
    height,
    bitmap: bitmap as ImageBitmap,
    url: URL.createObjectURL(file),
  };
}

export async function loadImageFromDataUrl(
  dataUrl: string,
  name = 'proyecto',
): Promise<LoadedImage> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  return {
    id: uid('img'),
    name,
    type: blob.type || 'image/png',
    size: blob.size,
    width: bitmap.width,
    height: bitmap.height,
    bitmap,
    url: dataUrl,
  };
}

/** Libera el Object URL de una imagen temporal (nunca revoca data URLs). */
export function releaseImage(image: LoadedImage | null | undefined): void {
  if (image && image.url.startsWith('blob:')) {
    URL.revokeObjectURL(image.url);
  }
}

export function imageFromCanvas(canvas: HTMLCanvasElement, name = 'imagen'): LoadedImage {
  return {
    id: uid('img'),
    name,
    type: 'image/png',
    size: 0,
    width: canvas.width,
    height: canvas.height,
    bitmap: canvas as unknown as ImageBitmap,
    url: canvas.toDataURL('image/png'),
  };
}

export function imageFromBlob(bitmap: ImageBitmap, name: string, url: string): LoadedImage {
  return { id: uid('img'), name, type: 'image/png', size: 0, width: bitmap.width, height: bitmap.height, bitmap, url };
}

/* ---------------- Transforms ---------------- */

export function rotateCanvas(source: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = source.width;
  const h = source.height;
  const newW = Math.round(w * cos + h * sin);
  const newH = Math.round(w * sin + h * cos);
  const canvas = createCanvas(newW, newH);
  const ctx = getContext(canvas);
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, -w / 2, -h / 2);
  return canvas;
}

export function flipCanvas(
  source: HTMLCanvasElement,
  axis: 'horizontal' | 'vertical',
): HTMLCanvasElement {
  const canvas = createCanvas(source.width, source.height);
  const ctx = getContext(canvas);
  ctx.translate(axis === 'horizontal' ? source.width : 0, axis === 'vertical' ? source.height : 0);
  ctx.scale(axis === 'horizontal' ? -1 : 1, axis === 'vertical' ? -1 : 1);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

export function cropCanvas(
  source: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, x, y, width, height, 0, 0, width, height);
  return canvas;
}

export function resizeCanvas(
  source: HTMLCanvasElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  return drawToCanvas(source, width, height);
}

/* ---------------- Export ---------------- */

export interface ExportResult {
  blob: Blob;
  size: number;
  width: number;
  height: number;
  filename: string;
}

const EXT: Record<string, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' };

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' | 'webp',
  quality = 0.92,
): Promise<Blob> {
  const mime = `image/${format}`;
  const q = format === 'png' ? undefined : quality;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`No se pudo codificar en ${format.toUpperCase()}`));
          return;
        }
        if (format !== 'png' && blob.type !== mime) {
          reject(new Error(`Formato ${format.toUpperCase()} no soportado`));
          return;
        }
        resolve(blob);
      },
      mime,
      q,
    );
  });
}

export async function exportCanvas(
  canvas: HTMLCanvasElement,
  options: { format: 'png' | 'jpeg' | 'webp'; quality: number; scale: number; filename: string },
): Promise<ExportResult> {
  const width = Math.max(1, Math.round(canvas.width * options.scale));
  const height = Math.max(1, Math.round(canvas.height * options.scale));
  const render =
    options.scale === 1 ? canvas : resizeCanvas(canvas, width, height);

  let finalCanvas = render;
  if (options.format === 'jpeg') {
    finalCanvas = createCanvas(width, height);
    const ctx = getContext(finalCanvas);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(render, 0, 0);
  }

  // Intenta codificar en un Web Worker (OffscreenCanvas) para no bloquear la UI;
  // si no está disponible o falla, cae al hilo principal.
  const offThread = await encodeOffThread(finalCanvas, options.format, options.quality);
  const blob = offThread ?? (await canvasToBlob(finalCanvas, options.format, options.quality));
  const filename = `${options.filename}.${EXT[options.format]}`;
  return { blob, size: blob.size, width, height, filename };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function supportsWebp(): boolean {
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = 1;
  return c.toDataURL('image/webp').startsWith('data:image/webp');
}

export { formatBytes };
