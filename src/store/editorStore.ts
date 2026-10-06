import { create } from 'zustand';
import type { Adjustments, Layer, ShapeData, TextData } from '../types';
import { DEFAULT_ADJUSTMENTS } from '../types';
import { createCanvas, cloneCanvas, getContext, renderAdjusted } from '../services/imageEngine';
import { cropCanvas } from '../services/imageService';
import { compositeCanvas } from '../features/pro/composite';
import { uid } from '../services/storage';

export interface LiveAdjust {
  layerId: string;
  adjustments: Adjustments;
}

export interface DocState {
  width: number;
  height: number;
  name: string;
}

export interface Viewport {
  scale: number;
  x: number;
  y: number;
}

interface EditorState {
  doc: DocState;
  layers: Layer[];
  activeId: string | null;
  tool: string;
  renderVersion: number;
  brush: { color: string; size: number; hardness: number; opacity: number };
  textDefaults: TextData;
  shapeDefaults: ShapeData;
  viewport: Viewport;
  liveAdjust: LiveAdjust | null;
  selectionActive: boolean;
  past: Layer[][];
  future: Layer[][];

  initDocument: (width: number, height: number, name: string, base?: HTMLCanvasElement) => void;
  setDocName: (name: string) => void;
  resizeDocument: (width: number, height: number) => void;
  addRasterLayer: (name?: string, canvas?: HTMLCanvasElement, atTop?: boolean) => string;
  addTextLayer: (text?: string) => string;
  addShapeLayer: (shape?: ShapeData['shape']) => string;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  reorderLayer: (from: number, to: number) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  updateText: (id: string, patch: Partial<TextData>) => void;
  updateShape: (id: string, patch: Partial<ShapeData>) => void;
  setActive: (id: string | null) => void;
  setTool: (tool: string) => void;
  setBrush: (patch: Partial<EditorState['brush']>) => void;
  setTextDefaults: (patch: Partial<TextData>) => void;
  setShapeDefaults: (patch: Partial<ShapeData>) => void;
  setViewport: (patch: Partial<Viewport>) => void;
  zoomBy: (factor: number, cx?: number, cy?: number) => void;
  bump: () => void;
  commit: () => void;
  undo: () => void;
  redo: () => void;
  replaceLayers: (layers: Layer[]) => void;
  clearAll: () => void;
  setLiveAdjust: (layerId: string, adjustments: Adjustments) => void;
  clearLiveAdjust: () => void;
  setSelectionActive: (active: boolean) => void;
  applyLiveAdjust: () => void;
  applyAdjustmentsToActive: (adjustments: Partial<Adjustments>) => boolean;
  cropDocument: (x: number, y: number, width: number, height: number) => void;
  flatten: () => HTMLCanvasElement;
}

const HISTORY_LIMIT = 20;

let measureCtx: CanvasRenderingContext2D | null = null;
function measureContext(): CanvasRenderingContext2D {
  if (!measureCtx) measureCtx = createCanvas(8, 8).getContext('2d')!;
  return measureCtx;
}

export function textFont(text: TextData): string {
  const style = `${text.italic ? 'italic ' : ''}${text.bold ? '700 ' : '400 '}`;
  return `${style}${text.fontSize}px ${text.fontFamily}, sans-serif`;
}

export function renderTextLayer(layer: Layer): void {
  const t = layer.text;
  if (!t) return;
  const ctx = measureContext();
  ctx.font = textFont(t);
  const lines = t.text.split('\n');
  const lineHeight = t.fontSize * t.lineHeight;
  let maxWidth = 0;
  for (const line of lines) maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
  const width = Math.ceil(maxWidth + t.fontSize * 0.6) || 1;
  const height = Math.ceil(lines.length * lineHeight + t.fontSize * 0.4) || 1;
  layer.canvas.width = width;
  layer.canvas.height = height;
  const c = getContext(layer.canvas);
  c.clearRect(0, 0, width, height);
  c.font = textFont(t);
  c.fillStyle = t.color;
  c.textBaseline = 'top';
  c.textAlign = t.align;
  const x = t.align === 'center' ? width / 2 : t.align === 'right' ? width - t.fontSize * 0.3 : t.fontSize * 0.3;
  lines.forEach((line, i) => {
    c.fillText(line, x, t.fontSize * 0.2 + i * lineHeight);
  });
}

export function renderShapeLayer(layer: Layer): void {
  const s = layer.shape;
  if (!s) return;
  const w = Math.max(2, Math.round(s.width));
  const h = Math.max(2, Math.round(s.height));
  const pad = s.strokeWidth + 2;
  layer.canvas.width = w + pad * 2;
  layer.canvas.height = h + pad * 2;
  const ctx = getContext(layer.canvas);
  ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
  ctx.translate(pad, pad);
  ctx.fillStyle = s.fill;
  ctx.strokeStyle = s.stroke;
  ctx.lineWidth = s.strokeWidth;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (s.shape) {
    case 'rect':
      if (s.fill !== 'transparent') ctx.fillRect(0, 0, w, h);
      if (s.strokeWidth > 0) ctx.strokeRect(0, 0, w, h);
      break;
    case 'ellipse':
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      if (s.fill !== 'transparent') ctx.fill();
      if (s.strokeWidth > 0) ctx.stroke();
      break;
    case 'line':
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.stroke();
      break;
    case 'arrow': {
      const angle = Math.atan2(h, w);
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.stroke();
      const head = Math.max(10, s.strokeWidth * 3);
      ctx.beginPath();
      ctx.moveTo(w, h);
      ctx.lineTo(w - head * Math.cos(angle - Math.PI / 7), h - head * Math.sin(angle - Math.PI / 7));
      ctx.moveTo(w, h);
      ctx.lineTo(w - head * Math.cos(angle + Math.PI / 7), h - head * Math.sin(angle + Math.PI / 7));
      ctx.stroke();
      break;
    }
    case 'triangle':
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      if (s.fill !== 'transparent') ctx.fill();
      if (s.strokeWidth > 0) ctx.stroke();
      break;
    case 'star': {
      const cx = w / 2;
      const cy = h / 2;
      const outer = Math.min(w, h) / 2;
      const inner = outer * 0.45;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (s.fill !== 'transparent') ctx.fill();
      if (s.strokeWidth > 0) ctx.stroke();
      break;
    }
  }
}

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((l) => ({ ...l, canvas: cloneCanvas(l.canvas) }));
}

const defaultText: TextData = {
  text: 'Tu texto',
  fontFamily: 'Inter',
  fontSize: 48,
  bold: true,
  italic: false,
  align: 'left',
  color: '#ffffff',
  lineHeight: 1.2,
  letterSpacing: 0,
};

const defaultShape: ShapeData = {
  shape: 'rect',
  fill: '#7c5cff',
  stroke: '#ffffff',
  strokeWidth: 0,
  width: 240,
  height: 160,
};

export const useEditor = create<EditorState>((set, get) => ({
  doc: { width: 1200, height: 800, name: 'Sin título' },
  layers: [],
  activeId: null,
  tool: 'move',
  renderVersion: 0,
  brush: { color: '#7c5cff', size: 32, hardness: 80, opacity: 100 },
  textDefaults: { ...defaultText },
  shapeDefaults: { ...defaultShape },
  viewport: { scale: 1, x: 0, y: 0 },
  liveAdjust: null,
  selectionActive: false,
  past: [],
  future: [],

  initDocument: (width, height, name, base) => {
    const layer: Layer = {
      id: uid('layer'),
      name: base ? 'Fondo' : 'Capa 1',
      kind: 'raster',
      visible: true,
      locked: false,
      opacity: 1,
      x: 0,
      y: 0,
      canvas: base ? cloneCanvas(base) : createCanvas(width, height),
    };
    set({
      doc: { width, height, name },
      layers: [layer],
      activeId: layer.id,
      past: [],
      future: [],
      viewport: { scale: 1, x: 0, y: 0 },
      selectionActive: false,
      liveAdjust: null,
      renderVersion: get().renderVersion + 1,
    });
  },

  setDocName: (name) => set((s) => ({ doc: { ...s.doc, name } })),

  resizeDocument: (width, height) =>
    set((s) => ({
      doc: { ...s.doc, width, height },
      renderVersion: s.renderVersion + 1,
    })),

  addRasterLayer: (name, canvas, atTop = true) => {
    get().commit();
    const layer: Layer = {
      id: uid('layer'),
      name: name ?? `Capa ${get().layers.length + 1}`,
      kind: 'raster',
      visible: true,
      locked: false,
      opacity: 1,
      x: 0,
      y: 0,
      canvas: canvas ?? createCanvas(get().doc.width, get().doc.height),
    };
    set((s) => ({
      layers: atTop ? [...s.layers, layer] : [layer, ...s.layers],
      activeId: layer.id,
      renderVersion: s.renderVersion + 1,
    }));
    return layer.id;
  },

  addTextLayer: (text) => {
    get().commit();
    const layer: Layer = {
      id: uid('layer'),
      name: 'Texto',
      kind: 'text',
      visible: true,
      locked: false,
      opacity: 1,
      x: Math.round(get().doc.width * 0.15),
      y: Math.round(get().doc.height * 0.4),
      canvas: createCanvas(4, 4),
      text: { ...get().textDefaults, ...(text !== undefined ? { text } : {}) },
    };
    renderTextLayer(layer);
    set((s) => ({
      layers: [...s.layers, layer],
      activeId: layer.id,
      renderVersion: s.renderVersion + 1,
    }));
    return layer.id;
  },

  addShapeLayer: (shape) => {
    get().commit();
    const layer: Layer = {
      id: uid('layer'),
      name: 'Forma',
      kind: 'shape',
      visible: true,
      locked: false,
      opacity: 1,
      x: Math.round(get().doc.width * 0.3),
      y: Math.round(get().doc.height * 0.3),
      canvas: createCanvas(4, 4),
      shape: { ...get().shapeDefaults, ...(shape ? { shape } : {}) },
    };
    renderShapeLayer(layer);
    set((s) => ({
      layers: [...s.layers, layer],
      activeId: layer.id,
      renderVersion: s.renderVersion + 1,
    }));
    return layer.id;
  },

  removeLayer: (id) => {
    if (get().layers.length <= 1) return;
    get().commit();
    set((s) => {
      const layers = s.layers.filter((l) => l.id !== id);
      return {
        layers,
        activeId: s.activeId === id ? layers[layers.length - 1]?.id ?? null : s.activeId,
        renderVersion: s.renderVersion + 1,
      };
    });
  },

  duplicateLayer: (id) => {
    get().commit();
    set((s) => {
      const index = s.layers.findIndex((l) => l.id === id);
      if (index < 0) return s;
      const src = s.layers[index];
      const copy: Layer = {
        ...src,
        id: uid('layer'),
        name: `${src.name} copia`,
        x: src.x + 16,
        y: src.y + 16,
        canvas: cloneCanvas(src.canvas),
        text: src.text ? { ...src.text } : undefined,
        shape: src.shape ? { ...src.shape } : undefined,
      };
      const layers = [...s.layers];
      layers.splice(index + 1, 0, copy);
      return { layers, activeId: copy.id, renderVersion: s.renderVersion + 1 };
    });
  },

  moveLayer: (id, direction) => {
    get().commit();
    set((s) => {
      const index = s.layers.findIndex((l) => l.id === id);
      if (index < 0) return s;
      const target = direction === 'up' ? index + 1 : index - 1;
      if (target < 0 || target >= s.layers.length) return s;
      const layers = [...s.layers];
      [layers[index], layers[target]] = [layers[target], layers[index]];
      return { layers, renderVersion: s.renderVersion + 1 };
    });
  },

  reorderLayer: (from, to) => {
    get().commit();
    set((s) => {
      if (from === to || from < 0 || to < 0 || from >= s.layers.length || to >= s.layers.length) return s;
      const layers = [...s.layers];
      const [moved] = layers.splice(from, 1);
      layers.splice(to, 0, moved);
      return { layers, renderVersion: s.renderVersion + 1 };
    });
  },

  updateLayer: (id, patch) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      renderVersion: s.renderVersion + 1,
    })),

  updateText: (id, patch) => {
    set((s) => ({
      layers: s.layers.map((l) => {
        if (l.id !== id || !l.text) return l;
        const updated = { ...l, text: { ...l.text, ...patch } };
        renderTextLayer(updated);
        return updated;
      }),
      renderVersion: s.renderVersion + 1,
    }));
  },

  updateShape: (id, patch) => {
    set((s) => ({
      layers: s.layers.map((l) => {
        if (l.id !== id || !l.shape) return l;
        const updated = { ...l, shape: { ...l.shape, ...patch } };
        renderShapeLayer(updated);
        return updated;
      }),
      renderVersion: s.renderVersion + 1,
    }));
  },

  setActive: (id) => set({ activeId: id }),
  setTool: (tool) => set({ tool }),
  setBrush: (patch) => set((s) => ({ brush: { ...s.brush, ...patch } })),
  setTextDefaults: (patch) => set((s) => ({ textDefaults: { ...s.textDefaults, ...patch } })),
  setShapeDefaults: (patch) => set((s) => ({ shapeDefaults: { ...s.shapeDefaults, ...patch } })),

  setViewport: (patch) => set((s) => ({ viewport: { ...s.viewport, ...patch } })),

  zoomBy: (factor, cx, cy) =>
    set((s) => {
      const scale = Math.min(16, Math.max(0.05, s.viewport.scale * factor));
      return { viewport: { ...s.viewport, scale, ...(cx !== undefined ? { x: cx } : {}), ...(cy !== undefined ? { y: cy } : {}) } };
    }),

  bump: () => set((s) => ({ renderVersion: s.renderVersion + 1 })),

  commit: () => {
    const s = get();
    set({ past: [...s.past.slice(-(HISTORY_LIMIT - 1)), cloneLayers(s.layers)], future: [] });
  },

  undo: () => {
    const s = get();
    if (!s.past.length) return;
    const previous = s.past[s.past.length - 1];
    set({
      past: s.past.slice(0, -1),
      future: [cloneLayers(s.layers), ...s.future].slice(0, HISTORY_LIMIT),
      layers: cloneLayers(previous),
      activeId: previous[previous.length - 1]?.id ?? null,
      renderVersion: s.renderVersion + 1,
    });
  },

  redo: () => {
    const s = get();
    if (!s.future.length) return;
    const next = s.future[0];
    set({
      past: [...s.past, cloneLayers(s.layers)].slice(-HISTORY_LIMIT),
      future: s.future.slice(1),
      layers: cloneLayers(next),
      activeId: next[next.length - 1]?.id ?? null,
      renderVersion: s.renderVersion + 1,
    });
  },

  replaceLayers: (layers) =>
    set((s) => ({ layers, renderVersion: s.renderVersion + 1, past: [], future: [] })),

  clearAll: () =>
    set({
      layers: [],
      activeId: null,
      liveAdjust: null,
      selectionActive: false,
      past: [],
      future: [],
      renderVersion: get().renderVersion + 1,
    }),

  setLiveAdjust: (layerId, adjustments) => set({ liveAdjust: { layerId, adjustments } }),

  clearLiveAdjust: () => set({ liveAdjust: null }),

  setSelectionActive: (active) => set({ selectionActive: active }),

  applyLiveAdjust: () => {
    const { liveAdjust, layers } = get();
    if (!liveAdjust) return;
    get().commit();
    set({
      layers: layers.map((layer) => {
        if (layer.id !== liveAdjust.layerId) return layer;
        const adjusted = renderAdjusted(
          layer.canvas,
          layer.canvas.width,
          layer.canvas.height,
          liveAdjust.adjustments,
        );
        const canvas = createCanvas(layer.canvas.width, layer.canvas.height);
        getContext(canvas).drawImage(adjusted, 0, 0);
        return { ...layer, canvas };
      }),
      liveAdjust: null,
      renderVersion: get().renderVersion + 1,
    });
  },

  applyAdjustmentsToActive: (adjustments) => {
    const s = get();
    const layer = s.layers.find((l) => l.id === s.activeId);
    if (!layer || layer.kind !== 'raster' || layer.locked) return false;
    s.commit();
    const merged: Adjustments = { ...DEFAULT_ADJUSTMENTS, ...adjustments };
    const result = renderAdjusted(layer.canvas, layer.canvas.width, layer.canvas.height, merged);
    const canvas = createCanvas(layer.canvas.width, layer.canvas.height);
    getContext(canvas).drawImage(result, 0, 0);
    set({
      layers: s.layers.map((l) => (l.id === layer.id ? { ...l, canvas } : l)),
      renderVersion: s.renderVersion + 1,
    });
    return true;
  },

  cropDocument: (x, y, width, height) => {
    get().commit();
    set((s) => ({
      doc: { ...s.doc, width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) },
      layers: s.layers.map((layer) => ({
        ...layer,
        canvas: cropCanvas(layer.canvas, x - layer.x, y - layer.y, width, height),
        x: layer.x - x,
        y: layer.y - y,
      })),
      renderVersion: s.renderVersion + 1,
    }));
  },

  flatten: () => {
    const { doc, layers } = get();
    return compositeCanvas(doc.width, doc.height, layers, null);
  },
}));
