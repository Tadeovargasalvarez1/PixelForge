export type ThemeMode = 'dark' | 'light' | 'system';

export interface LoadedImage {
  id: string;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  bitmap: ImageBitmap;
  url: string;
}

export interface Adjustments {
  brightness: number;
  contrast: number;
  exposure: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  sharpness: number;
  blur: number;
  opacity: number;
  hue: number;
  sepia: number;
  grayscale: number;
  invert: number;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  sharpness: 0,
  blur: 0,
  opacity: 100,
  hue: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
};

export interface FilterPreset {
  id: string;
  name: string;
  adjustments: Partial<Adjustments>;
}

export type ToolId =
  | 'move'
  | 'select'
  | 'crop'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'shape'
  | 'clone'
  | 'eyedropper'
  | 'zoom'
  | 'hand';

export interface ShapeData {
  shape: 'rect' | 'ellipse' | 'line' | 'arrow' | 'triangle' | 'star';
  fill: string;
  stroke: string;
  strokeWidth: number;
  width: number;
  height: number;
}

export interface TextData {
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  color: string;
  lineHeight: number;
  letterSpacing: number;
}

export type LayerKind = 'raster' | 'text' | 'shape';

export interface Layer {
  id: string;
  name: string;
  kind: LayerKind;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  canvas: HTMLCanvasElement;
  text?: TextData;
  shape?: ShapeData;
}

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  scale: number;
  filename: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail: string;
  updatedAt: number;
  createdAt: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

export interface SizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: string;
}
