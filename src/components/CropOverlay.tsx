import { useCallback, useRef } from 'react';

export interface NormRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CropOverlayProps {
  value: NormRect;
  ratio: number;
  onChange: (rect: NormRect) => void;
}

const HANDLES = [
  { id: 'nw', x: 0, y: 0 },
  { id: 'n', x: 0.5, y: 0 },
  { id: 'ne', x: 1, y: 0 },
  { id: 'e', x: 1, y: 0.5 },
  { id: 'se', x: 1, y: 1 },
  { id: 's', x: 0.5, y: 1 },
  { id: 'sw', x: 0, y: 1 },
  { id: 'w', x: 0, y: 0.5 },
] as const;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function CropOverlay({ value, ratio, onChange }: CropOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    mode: 'move' | string;
    startX: number;
    startY: number;
    rect: NormRect;
    rectPx: { w: number; h: number };
  } | null>(null);

  const rectPx = () => {
    const el = rootRef.current;
    return el ? el.getBoundingClientRect() : { width: 1, height: 1, left: 0, top: 0 };
  };

  const begin = useCallback(
    (mode: 'move' | string) => (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const r = rectPx();
      drag.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        rect: { ...value },
        rectPx: { w: r.width, h: r.height },
      };
    },
    [value],
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = (e.clientX - d.startX) / d.rectPx.w;
      const dy = (e.clientY - d.startY) / d.rectPx.h;
      const start = d.rect;
      let next: NormRect = { ...start };

      if (d.mode === 'move') {
        next.x = clamp01(start.x + dx);
        next.y = clamp01(start.y + dy);
        if (next.x + next.w > 1) next.x = 1 - next.w;
        if (next.y + next.h > 1) next.y = 1 - next.h;
      } else {
        const hasN = d.mode.includes('n');
        const hasS = d.mode.includes('s');
        const hasW = d.mode.includes('w');
        const hasE = d.mode.includes('e');
        let left = start.x;
        let top = start.y;
        let right = start.x + start.w;
        let bottom = start.y + start.h;
        if (hasW) left = clamp01(start.x + dx);
        if (hasE) right = clamp01(start.x + start.w + dx);
        if (hasN) top = clamp01(start.y + dy);
        if (hasS) bottom = clamp01(start.y + start.h + dy);
        next = { x: Math.min(left, right), y: Math.min(top, bottom), w: Math.abs(right - left), h: Math.abs(bottom - top) };
      }

      if (ratio > 0 && d.mode !== 'move') {
        const pxW = next.w * d.rectPx.w;
        const pxH = next.h * d.rectPx.h;
        if (pxW / Math.max(1, pxH) > ratio) {
          next.w = (pxH * ratio) / d.rectPx.w;
        } else {
          next.h = pxW / ratio / d.rectPx.h;
        }
        if (d.mode.includes('w')) next.x = start.x + start.w - next.w;
        if (d.mode.includes('n')) next.y = start.y + start.h - next.h;
      }

      next.w = Math.max(0.03, next.w);
      next.h = Math.max(0.03, next.h);
      next.x = clamp01(next.x);
      next.y = clamp01(next.y);
      if (next.x + next.w > 1) next.w = 1 - next.x;
      if (next.y + next.h > 1) next.h = 1 - next.y;
      onChange(next);
    },
    [onChange, ratio],
  );

  const end = useCallback(() => {
    drag.current = null;
  }, []);

  const style = { left: `${value.x * 100}%`, top: `${value.y * 100}%`, width: `${value.w * 100}%`, height: `${value.h * 100}%` };

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="crop-frame" style={style} onPointerDown={begin('move')}>
        <div className="crop-third" style={{ left: '33.33%', top: 0, bottom: 0, width: 1 }} />
        <div className="crop-third" style={{ left: '66.66%', top: 0, bottom: 0, width: 1 }} />
        <div className="crop-third" style={{ top: '33.33%', left: 0, right: 0, height: 1 }} />
        <div className="crop-third" style={{ top: '66.66%', left: 0, right: 0, height: 1 }} />
        {HANDLES.map((h) => (
          <div
            key={h.id}
            className="crop-handle"
            style={{
              left: `calc(${h.x * 100}% - 7px)`,
              top: `calc(${h.y * 100}% - 7px)`,
              cursor: `${h.id}-resize`,
            }}
            onPointerDown={begin(h.id)}
          />
        ))}
      </div>
    </div>
  );
}
