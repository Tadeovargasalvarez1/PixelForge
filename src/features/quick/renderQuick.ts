import type { Adjustments, LoadedImage } from '../../types';
import { cropCanvas, flipCanvas, resizeCanvas, rotateCanvas } from '../../services/imageService';
import { drawToCanvas, renderAdjusted, resizedSize } from '../../services/imageEngine';
import type { CropRect } from '../../store/imageStore';

export interface QuickTransform {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  crop: CropRect | null;
  resize?: { width: number; height: number } | null;
}

export interface QuickRenderInput extends QuickTransform {
  image: LoadedImage;
  adjustments: Adjustments;
  maxSize?: number;
}

export function buildBase(
  image: LoadedImage,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
): HTMLCanvasElement {
  let base = drawToCanvas(image.bitmap, image.width, image.height);
  if (flipH) base = flipCanvas(base, 'horizontal');
  if (flipV) base = flipCanvas(base, 'vertical');
  if (rotation) base = rotateCanvas(base, rotation);
  return base;
}

function applyPipeline(input: QuickRenderInput): HTMLCanvasElement {
  const base = buildBase(input.image, input.rotation, input.flipH, input.flipV);
  let working = input.crop
    ? cropCanvas(base, input.crop.x, input.crop.y, input.crop.width, input.crop.height)
    : base;
  if (input.resize && (input.resize.width !== working.width || input.resize.height !== working.height)) {
    working = resizeCanvas(working, input.resize.width, input.resize.height);
  }
  return working;
}

export function outputSize(
  image: LoadedImage,
  rotation: number,
  _flipH: boolean,
  _flipV: boolean,
  crop: CropRect | null,
  resize: { width: number; height: number } | null,
): { width: number; height: number } {
  if (resize) return { width: Math.round(resize.width), height: Math.round(resize.height) };
  if (crop) return { width: Math.round(crop.width), height: Math.round(crop.height) };
  let width = image.width;
  let height = image.height;
  if (rotation % 180 !== 0) [width, height] = [height, width];
  return { width, height };
}

export function renderQuickFull(input: QuickRenderInput): HTMLCanvasElement {
  const working = applyPipeline(input);
  return renderAdjusted(working, working.width, working.height, input.adjustments);
}

export function renderQuickPreview(input: QuickRenderInput): {
  canvas: HTMLCanvasElement;
  outputWidth: number;
  outputHeight: number;
} {
  const working = applyPipeline(input);
  const preview = resizedSize(working.width, working.height, input.maxSize ?? 1600);
  const canvas = renderAdjusted(working, working.width, working.height, input.adjustments, {
    width: preview.width,
    height: preview.height,
  });
  return { canvas, outputWidth: working.width, outputHeight: working.height };
}

export function renderAtSize(
  source: HTMLCanvasElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  return resizeCanvas(source, width, height);
}
