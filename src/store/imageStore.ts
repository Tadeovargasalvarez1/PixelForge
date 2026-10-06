import { create } from 'zustand';
import type { Adjustments, LoadedImage } from '../types';
import { DEFAULT_ADJUSTMENTS } from '../types';
import { FILTERS } from '../services/presets';
import { releaseImage } from '../services/imageService';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EditSnapshot {
  adjustments: Adjustments;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  crop: CropRect | null;
  resize: { width: number; height: number } | null;
  filterId: string;
}

interface ImageState {
  image: LoadedImage | null;
  adjustments: Adjustments;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  crop: CropRect | null;
  resize: { width: number; height: number } | null;
  filterId: string;
  filename: string;
  exportFormat: 'png' | 'jpeg' | 'webp';
  quality: number;
  past: EditSnapshot[];
  future: EditSnapshot[];

  setImage: (image: LoadedImage | null) => void;
  setAdjustment: (key: keyof Adjustments, value: number) => void;
  setAdjustments: (partial: Partial<Adjustments>) => void;
  resetAdjustments: () => void;
  applyFilter: (id: string) => void;
  rotate: (degrees: number) => void;
  setRotation: (degrees: number) => void;
  flip: (axis: 'horizontal' | 'vertical') => void;
  setCrop: (rect: CropRect | null) => void;
  setResize: (size: { width: number; height: number } | null) => void;
  clearTransforms: () => void;
  setExportFormat: (format: 'png' | 'jpeg' | 'webp') => void;
  setQuality: (quality: number) => void;
  setFilename: (name: string) => void;
  reset: () => void;
  commit: () => void;
  undo: () => void;
  redo: () => void;
}

const snapshot = (s: ImageState): EditSnapshot => ({
  adjustments: { ...s.adjustments },
  rotation: s.rotation,
  flipH: s.flipH,
  flipV: s.flipV,
  crop: s.crop ? { ...s.crop } : null,
  resize: s.resize ? { ...s.resize } : null,
  filterId: s.filterId,
});

const MAX_HISTORY = 40;

export const useImageStore = create<ImageState>((set, get) => ({
  image: null,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  rotation: 0,
  flipH: false,
  flipV: false,
  crop: null,
  resize: null,
  filterId: 'original',
  filename: 'imagen-editada',
  exportFormat: 'png',
  quality: 0.92,
  past: [],
  future: [],

  setImage: (image) => {
    releaseImage(get().image);
    set({
      image,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      rotation: 0,
      flipH: false,
      flipV: false,
      crop: null,
      resize: null,
      filterId: 'original',
      filename: image ? `${image.name}-editada` : 'imagen-editada',
      past: [],
      future: [],
    });
  },

  setAdjustment: (key, value) => {
    set((s) => ({ adjustments: { ...s.adjustments, [key]: value }, filterId: 'custom' }));
  },

  setAdjustments: (partial) =>
    set((s) => ({ adjustments: { ...s.adjustments, ...partial }, filterId: 'custom' })),

  resetAdjustments: () =>
    set({ adjustments: { ...DEFAULT_ADJUSTMENTS }, filterId: 'original' }),

  applyFilter: (id) => {
    const preset = FILTERS.find((f) => f.id === id);
    if (!preset) return;
    get().commit();
    set({ adjustments: { ...DEFAULT_ADJUSTMENTS, ...preset.adjustments }, filterId: id });
  },

  rotate: (degrees) => {
    get().commit();
    set((s) => ({ rotation: (s.rotation + degrees + 360) % 360, crop: null, resize: null, future: [] }));
  },

  setRotation: (degrees) =>
    set({ rotation: ((degrees % 360) + 360) % 360, crop: null, resize: null }),

  flip: (axis) => {
    get().commit();
    if (axis === 'horizontal') set((s) => ({ flipH: !s.flipH, crop: null, future: [] }));
    else set((s) => ({ flipV: !s.flipV, crop: null, future: [] }));
  },

  setCrop: (rect) => set({ crop: rect }),

  setResize: (size) => set({ resize: size }),

  clearTransforms: () =>
    set({ rotation: 0, flipH: false, flipV: false, crop: null, resize: null, future: [] }),

  setExportFormat: (format) => set({ exportFormat: format }),
  setQuality: (quality) => set({ quality }),
  setFilename: (filename) => set({ filename }),

  reset: () => {
    get().commit();
    set({ adjustments: { ...DEFAULT_ADJUSTMENTS }, rotation: 0, flipH: false, flipV: false, crop: null, resize: null, filterId: 'original' });
  },

  commit: () => {
    const s = get();
    set({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), snapshot(s)],
      future: [],
    });
  },

  undo: () => {
    const s = get();
    if (!s.past.length) return;
    const previous = s.past[s.past.length - 1];
    set({
      past: s.past.slice(0, -1),
      future: [snapshot(s), ...s.future].slice(0, MAX_HISTORY),
      ...previous,
      adjustments: { ...previous.adjustments },
    });
  },

  redo: () => {
    const s = get();
    if (!s.future.length) return;
    const next = s.future[0];
    set({
      past: [...s.past, snapshot(s)].slice(-MAX_HISTORY),
      future: s.future.slice(1),
      ...next,
      adjustments: { ...next.adjustments },
    });
  },
}));
