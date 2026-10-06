import { useCallback, useEffect, useRef, useState } from 'react';
import { useImageStore } from '../store/imageStore';
import { renderQuickPreview } from '../features/quick/renderQuick';

export interface QuickPreviewState {
  canvas: HTMLCanvasElement | null;
  outputWidth: number;
  outputHeight: number;
  processing: boolean;
}

export function useQuickPreview(maxSize = 1600, ignoreCrop = false): QuickPreviewState {
  const image = useImageStore((s) => s.image);
  const adjustments = useImageStore((s) => s.adjustments);
  const rotation = useImageStore((s) => s.rotation);
  const flipH = useImageStore((s) => s.flipH);
  const flipV = useImageStore((s) => s.flipV);
  const crop = useImageStore((s) => s.crop);
  const resize = useImageStore((s) => s.resize);

  const [state, setState] = useState<QuickPreviewState>({
    canvas: null,
    outputWidth: 0,
    outputHeight: 0,
    processing: false,
  });
  const raf = useRef(0);

  useEffect(() => {
    if (!image) {
      setState({ canvas: null, outputWidth: 0, outputHeight: 0, processing: false });
      return;
    }
    setState((s) => ({ ...s, processing: true }));
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      try {
        const { canvas, outputWidth, outputHeight } = renderQuickPreview({
          image,
          adjustments,
          rotation,
          flipH,
          flipV,
          crop: ignoreCrop ? null : crop,
          resize,
          maxSize,
        });
        setState({ canvas, outputWidth, outputHeight, processing: false });
      } catch (error) {
        console.error(error);
        setState({ canvas: null, outputWidth: 0, outputHeight: 0, processing: false });
      }
    });
    return () => cancelAnimationFrame(raf.current);
  }, [image, adjustments, rotation, flipH, flipV, crop, resize, maxSize, ignoreCrop]);

  return state;
}

export function useCanvasDataUrl(canvas: HTMLCanvasElement | null, type = 'image/png'): string {
  const [url, setUrl] = useState('');
  const update = useCallback(() => {
    if (!canvas) {
      setUrl('');
      return;
    }
    setUrl(canvas.toDataURL(type));
  }, [canvas, type]);
  useEffect(() => {
    update();
  }, [update]);
  return url;
}
