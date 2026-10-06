import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor } from '../../store/editorStore';
import { compositeCanvas } from './composite';
import { createCanvas, getContext } from '../../services/imageEngine';
import { toast } from '../../store/toastStore';
import { CropOverlay, type NormRect } from '../../components/CropOverlay';
import type { ToolId } from '../../types';

interface Pointer {
  docX: number;
  docY: number;
  clientX: number;
  clientY: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hardnessGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  hardness: number,
  color: string,
): CanvasGradient {
  const inner = Math.max(0.01, (radius * hardness) / 100);
  const gradient = ctx.createRadialGradient(x, y, inner, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, `${color}00`);
  return gradient;
}

export function EditorCanvas() {
  const stageRef = useRef<HTMLDivElement>(null);
  const compositeRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const cursorRef = useRef<HTMLDivElement>(null);

  const doc = useEditor((s) => s.doc);
  const renderVersion = useEditor((s) => s.renderVersion);
  const liveAdjust = useEditor((s) => s.liveAdjust);
  const tool = useEditor((s) => s.tool) as ToolId;
  const viewport = useEditor((s) => s.viewport);
  const setSelectionActive = useEditor((s) => s.setSelectionActive);

  const [cropRect, setCropRect] = useState<NormRect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [cropRatio, setCropRatio] = useState(0);
  const [selection, setSelection] = useState<NormRect | null>(null);
  const [marquee, setMarquee] = useState<NormRect | null>(null);
  const marqueeRef = useRef<NormRect | null>(null);
  const drag = useRef<null | {
    mode: 'pan' | 'move' | 'paint' | 'shape' | 'clone' | 'none';
    startX: number;
    startY: number;
    docX: number;
    docY: number;
    space: boolean;
    layerStart?: { x: number; y: number };
    lastPaint?: { x: number; y: number };
    layerId?: string;
    selStart?: { x: number; y: number };
  }>(null);
  const spaceDown = useRef(false);
  const cloneSource = useRef<{ x: number; y: number } | null>(null);
  const cloneAnchor = useRef<{ x: number; y: number } | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<null | { dist: number; scale: number; mx: number; my: number; x: number; y: number }>(null);

  const redraw = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = compositeRef.current;
      if (!canvas) return;
      const state = useEditor.getState();
      compositeCanvas(state.doc.width, state.doc.height, state.layers, state.liveAdjust, canvas);
    });
  }, []);

  useEffect(() => {
    redraw();
  }, [redraw, renderVersion, doc.width, doc.height, liveAdjust]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spaceDown.current) {
        spaceDown.current = true;
        if (stageRef.current) stageRef.current.style.cursor = 'grab';
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDown.current = false;
        if (stageRef.current) stageRef.current.style.cursor = '';
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    setSelectionActive(!!selection);
  }, [selection, setSelectionActive]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key === 'Escape') setSelection(null);
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection) {
        // La selección tiene prioridad sobre el atajo global de "eliminar capa".
        e.preventDefault();
        e.stopImmediatePropagation();
        const state = useEditor.getState();
        const layer = state.layers.find((l) => l.id === state.activeId);
        if (layer && layer.kind === 'raster' && !layer.locked) {
          const ctx = getContext(layer.canvas);
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillRect(
            selection.x * state.doc.width - layer.x,
            selection.y * state.doc.height - layer.y,
            selection.w * state.doc.width,
            selection.h * state.doc.height,
          );
          ctx.restore();
          state.commit();
          state.bump();
          redraw();
        }
        setSelection(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection, redraw]);

  const fitToScreen = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const { doc: d } = useEditor.getState();
    const scale = Math.min((stage.clientWidth - 80) / d.width, (stage.clientHeight - 80) / d.height, 1);
    useEditor.getState().setViewport({ scale: Math.max(0.05, scale), x: 0, y: 0 });
  }, []);

  useEffect(() => {
    fitToScreen();
    const onResize = () => fitToScreen();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fitToScreen, doc.width, doc.height]);

  const toDoc = useCallback(
    (clientX: number, clientY: number): Pointer => {
      const canvas = compositeRef.current;
      if (!canvas) return { docX: 0, docY: 0, clientX, clientY };
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / doc.width || 1;
      return {
        docX: (clientX - rect.left) / scale,
        docY: (clientY - rect.top) / scale,
        clientX,
        clientY,
      };
    },
    [doc.width],
  );

  const paintAt = useCallback(
    (x: number, y: number, from?: { x: number; y: number }) => {
      const state = useEditor.getState();
      const layer = state.layers.find((l) => l.id === state.activeId);
      if (!layer || layer.kind !== 'raster' || layer.locked) return;
      const ctx = getContext(layer.canvas);
      const radius = state.brush.size / 2;
      const erase = state.tool === 'eraser';
      ctx.save();
      ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
      ctx.globalAlpha = state.brush.opacity / 100;
      const color = erase ? '#000000' : state.brush.color;
      const stamp = (px: number, py: number) => {
        ctx.fillStyle = hardnessGradient(ctx, px, py, radius, state.brush.hardness, color);
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      };
      if (from) {
        const dist = Math.hypot(x - from.x, y - from.y);
        const steps = Math.max(1, Math.ceil(dist / (radius / 3)));
        for (let i = 1; i <= steps; i++) {
          stamp(from.x + ((x - from.x) * i) / steps, from.y + ((y - from.y) * i) / steps);
        }
      } else {
        stamp(x, y);
      }
      ctx.restore();
    },
    [],
  );

  const cloneAt = useCallback((p: Pointer, layerId: string) => {
    const source = cloneSource.current;
    if (!source) return;
    if (!cloneAnchor.current) cloneAnchor.current = { x: p.docX, y: p.docY };
    const anchor = cloneAnchor.current;
    const state = useEditor.getState();
    const layer = state.layers.find((l) => l.id === layerId);
    if (!layer) return;
    const radius = state.brush.size / 2;
    const srcX = source.x + (p.docX - anchor.x);
    const srcY = source.y + (p.docY - anchor.y);
    const patch = createCanvas(radius * 2, radius * 2);
    const pctx = getContext(patch);
    pctx.drawImage(layer.canvas, srcX - radius, srcY - radius, radius * 2, radius * 2, 0, 0, radius * 2, radius * 2);
    pctx.globalCompositeOperation = 'destination-in';
    pctx.beginPath();
    pctx.arc(radius, radius, radius, 0, Math.PI * 2);
    pctx.fill();
    const ctx = getContext(layer.canvas);
    const lx = p.docX - layer.x;
    const ly = p.docY - layer.y;
    ctx.save();
    ctx.globalAlpha = state.brush.opacity / 100;
    ctx.drawImage(patch, lx - radius, ly - radius);
    ctx.restore();
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const state = useEditor.getState();
      const p = toDoc(e.clientX, e.clientY);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = {
          dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          scale: state.viewport.scale,
          mx: (a.x + b.x) / 2,
          my: (a.y + b.y) / 2,
          x: state.viewport.x,
          y: state.viewport.y,
        };
        drag.current = null;
        return;
      }

      if (spaceDown.current || state.tool === 'hand') {
        drag.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, docX: p.docX, docY: p.docY, space: true };
        return;
      }
      if (state.tool === 'zoom') {
        state.zoomBy(e.altKey ? 0.8 : 1.25);
        return;
      }
      if (state.tool === 'eyedropper') {
        const canvas = compositeRef.current;
        if (canvas) {
          const ctx = getContext(canvas);
          const data = ctx.getImageData(Math.floor(p.docX), Math.floor(p.docY), 1, 1).data;
          const hex = rgbToHex(data[0], data[1], data[2]);
          state.setBrush({ color: hex });
          navigator.clipboard?.writeText(hex).catch(() => undefined);
          toast.success('Color copiado', `${hex} · rgb(${data[0]}, ${data[1]}, ${data[2]})`);
        }
        return;
      }
      if (state.tool === 'select') {
        drag.current = { mode: 'none', startX: e.clientX, startY: e.clientY, docX: p.docX, docY: p.docY, space: false, selStart: { x: p.docX, y: p.docY } };
        setSelection(null);
        const initial = { x: p.docX / doc.width, y: p.docY / doc.height, w: 0, h: 0 };
        marqueeRef.current = initial;
        setMarquee(initial);
        return;
      }
      if (state.tool === 'text') {
        state.addTextLayer();
        const newLayers = useEditor.getState().layers;
        const layer = newLayers[newLayers.length - 1];
        if (layer) state.updateLayer(layer.id, { x: Math.round(p.docX), y: Math.round(p.docY) });
        return;
      }
      if (state.tool === 'shape') {
        const id = state.addShapeLayer();
        state.updateShape(id, { width: 2, height: 2 });
        const layer = useEditor.getState().layers.find((l) => l.id === id);
        if (layer) state.updateLayer(id, { x: Math.round(p.docX), y: Math.round(p.docY) });
        drag.current = { mode: 'shape', startX: e.clientX, startY: e.clientY, docX: p.docX, docY: p.docY, space: false, layerId: id };
        return;
      }
      if (state.tool === 'brush' || state.tool === 'eraser' || state.tool === 'clone') {
        const layer = state.layers.find((l) => l.id === state.activeId);
        if (!layer || layer.kind !== 'raster' || layer.locked) {
          toast.warning('Selecciona una capa compatible');
          return;
        }
        if (state.tool === 'clone') {
          if (e.altKey) {
            cloneSource.current = { x: p.docX, y: p.docY };
            cloneAnchor.current = null;
            toast.info('Origen de clonado fijado');
            return;
          }
          if (!cloneSource.current) {
            cloneSource.current = { x: p.docX, y: p.docY };
            toast.info('Origen fijado. Vuelve a pintar para clonar.');
            return;
          }
          cloneAnchor.current = null;
          drag.current = { mode: 'clone', startX: e.clientX, startY: e.clientY, docX: p.docX, docY: p.docY, space: false, layerId: layer.id, lastPaint: { x: p.docX, y: p.docY } };
          cloneAt(p, layer.id);
          redraw();
          return;
        }
        const local = { x: p.docX - layer.x, y: p.docY - layer.y };
        paintAt(local.x, local.y);
        drag.current = { mode: 'paint', startX: e.clientX, startY: e.clientY, docX: p.docX, docY: p.docY, space: false, layerId: layer.id, lastPaint: local };
        redraw();
        return;
      }
      if (state.tool === 'move') {
        const layer = state.activeId ? state.layers.find((l) => l.id === state.activeId) : undefined;
        if (layer && !layer.locked) {
          drag.current = { mode: 'move', startX: e.clientX, startY: e.clientY, docX: p.docX, docY: p.docY, space: false, layerStart: { x: layer.x, y: layer.y }, layerId: layer.id };
        }
        return;
      }
      drag.current = { mode: 'none', startX: e.clientX, startY: e.clientY, docX: p.docX, docY: p.docY, space: false };
    },
    [toDoc, paintAt, cloneAt, redraw],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const cursor = cursorRef.current;
      if (cursor) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        cursor.style.display = tool === 'brush' || tool === 'eraser' || tool === 'clone' ? 'block' : 'none';
      }
      if (pointers.current.has(e.pointerId)) {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (pinch.current && pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        const factor = dist / pinch.current.dist;
        const st = useEditor.getState();
        st.setViewport({
          scale: Math.min(16, Math.max(0.05, pinch.current.scale * factor)),
          x: pinch.current.x + ((a.x + b.x) / 2 - pinch.current.mx),
          y: pinch.current.y + ((a.y + b.y) / 2 - pinch.current.my),
        });
        return;
      }
      const d = drag.current;
      if (!d) return;
      const state = useEditor.getState();
      if (d.selStart) {
        const p = toDoc(e.clientX, e.clientY);
        const rect = {
          x: Math.min(p.docX, d.selStart.x) / doc.width,
          y: Math.min(p.docY, d.selStart.y) / doc.height,
          w: Math.abs(p.docX - d.selStart.x) / doc.width,
          h: Math.abs(p.docY - d.selStart.y) / doc.height,
        };
        marqueeRef.current = rect;
        setMarquee(rect);
        return;
      }
      if (d.mode === 'pan') {
        const scale = state.viewport.scale;
        state.setViewport({
          x: state.viewport.x + (e.clientX - d.startX),
          y: state.viewport.y + (e.clientY - d.startY),
        });
        d.startX = e.clientX;
        d.startY = e.clientY;
        void scale;
        return;
      }
      if (d.mode === 'move' && d.layerId && d.layerStart) {
        const p = toDoc(e.clientX, e.clientY);
        state.updateLayer(d.layerId, {
          x: Math.round(d.layerStart.x + (p.docX - d.docX)),
          y: Math.round(d.layerStart.y + (p.docY - d.docY)),
        });
        return;
      }
      if (d.mode === 'shape' && d.layerId) {
        const p = toDoc(e.clientX, e.clientY);
        state.updateShape(d.layerId, {
          width: Math.max(2, Math.abs(p.docX - d.docX)),
          height: Math.max(2, Math.abs(p.docY - d.docY)),
        });
        state.updateLayer(d.layerId, {
          x: Math.round(Math.min(p.docX, d.docX)),
          y: Math.round(Math.min(p.docY, d.docY)),
        });
        return;
      }
      if (d.mode === 'paint' && d.layerId) {
        const p = toDoc(e.clientX, e.clientY);
        const layer = state.layers.find((l) => l.id === d.layerId);
        if (!layer) return;
        const local = { x: p.docX - layer.x, y: p.docY - layer.y };
        paintAt(local.x, local.y, d.lastPaint);
        d.lastPaint = local;
        redraw();
        return;
      }
      if (d.mode === 'clone' && d.layerId) {
        const p = toDoc(e.clientX, e.clientY);
        cloneAt(p, d.layerId);
        redraw();
      }
    },
    [toDoc, paintAt, cloneAt, redraw, tool],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.selStart) {
      const rect = marqueeRef.current;
      if (rect && rect.w > 0.01 && rect.h > 0.01) setSelection(rect);
      marqueeRef.current = null;
      setMarquee(null);
      return;
    }
    if (d.mode === 'paint' || d.mode === 'clone') {
      useEditor.getState().commit();
      useEditor.getState().bump();
    } else if (d.mode === 'move' || d.mode === 'shape') {
      useEditor.getState().commit();
    }
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handler = (e: WheelEvent) => {
      const state = useEditor.getState();
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = stage.getBoundingClientRect();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const qx = e.clientX - rect.left;
        const qy = e.clientY - rect.top;
        const { scale, x, y } = state.viewport;
        const newScale = Math.min(16, Math.max(0.05, scale * factor));
        const docX = (qx - cx - x) / scale + state.doc.width / 2;
        const docY = (qy - cy - y) / scale + state.doc.height / 2;
        const nx = qx - cx - (docX - state.doc.width / 2) * newScale;
        const ny = qy - cy - (docY - state.doc.height / 2) * newScale;
        state.setViewport({ scale: newScale, x: nx, y: ny });
      } else {
        e.preventDefault();
        state.setViewport({
          x: state.viewport.x - (e.shiftKey ? e.deltaY : e.deltaX),
          y: state.viewport.y - (e.shiftKey ? 0 : e.deltaY),
        });
      }
    };
    stage.addEventListener('wheel', handler, { passive: false });
    return () => stage.removeEventListener('wheel', handler);
  }, []);

  const applyCrop = () => {
    const x = cropRect.x * doc.width;
    const y = cropRect.y * doc.height;
    const w = cropRect.w * doc.width;
    const h = cropRect.h * doc.height;
    useEditor.getState().cropDocument(x, y, w, h);
    useEditor.getState().setTool('move');
    toast.success('Lienzo recortado');
  };

  const brushCursorSize = useEditor((s) => s.brush.size) * viewport.scale;

  return (
    <div
      ref={stageRef}
      className="editor-stage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ cursor: tool === 'move' ? 'move' : tool === 'zoom' ? 'zoom-in' : tool === 'eyedropper' ? 'crosshair' : 'default' }}
    >
      <div className="canvas-viewport">
        <div
          className="canvas-inner checker"
          style={{
            width: doc.width,
            height: doc.height,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          }}
        >
          <canvas ref={compositeRef} className="base" width={doc.width} height={doc.height} />
          {tool === 'crop' && (
            <CropOverlay value={cropRect} ratio={cropRatio} onChange={setCropRect} />
          )}
          {(selection || marquee) && tool === 'select' && (
            <div
              style={{
                position: 'absolute',
                left: `${(selection ?? marquee)!.x * 100}%`,
                top: `${(selection ?? marquee)!.y * 100}%`,
                width: `${(selection ?? marquee)!.w * 100}%`,
                height: `${(selection ?? marquee)!.h * 100}%`,
                border: '1px dashed rgba(255,255,255,0.9)',
                background: 'rgba(124,92,255,0.12)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>

      {(tool === 'brush' || tool === 'eraser' || tool === 'clone') && (
        <div
          ref={cursorRef}
          style={{
            position: 'fixed',
            width: Math.max(6, brushCursorSize),
            height: Math.max(6, brushCursorSize),
            border: '1.5px solid rgba(255,255,255,0.9)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.6)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 30,
            display: 'none',
          }}
        />
      )}

      {tool === 'crop' && (
        <div
          className="row gap-2"
          style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}
        >
          {[0, 1, 4 / 3, 16 / 9].map((r) => (
            <button key={r} type="button" className={`btn btn-sm ${cropRatio === r ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCropRatio(r)}>
              {r === 0 ? 'Libre' : r === 1 ? '1:1' : r === 4 / 3 ? '4:3' : '16:9'}
            </button>
          ))}
          <button type="button" className="btn btn-primary btn-sm" onClick={applyCrop}>Aplicar recorte</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => useEditor.getState().setTool('move')}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
