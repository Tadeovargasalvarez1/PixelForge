import type { Layer } from '../../types';
import { createCanvas, getContext, renderAdjusted } from '../../services/imageEngine';
import type { LiveAdjust } from '../../store/editorStore';

export function compositeCanvas(
  width: number,
  height: number,
  layers: Layer[],
  liveAdjust?: LiveAdjust | null,
  target?: HTMLCanvasElement,
): HTMLCanvasElement {
  const canvas = target ?? createCanvas(width, height);
  if (canvas.width !== Math.round(width)) canvas.width = Math.round(width);
  if (canvas.height !== Math.round(height)) canvas.height = Math.round(height);
  const ctx = getContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const layer of layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    if (liveAdjust && liveAdjust.layerId === layer.id) {
      const adjusted = renderAdjusted(layer.canvas, layer.canvas.width, layer.canvas.height, liveAdjust.adjustments);
      ctx.drawImage(adjusted, layer.x, layer.y);
    } else {
      ctx.drawImage(layer.canvas, layer.x, layer.y);
    }
    ctx.restore();
  }
  return canvas;
}
