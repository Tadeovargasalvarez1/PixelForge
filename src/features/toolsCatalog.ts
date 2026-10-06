import {
  Crop,
  Scaling,
  RotateCw,
  FlipHorizontal2,
  Ruler,
  FileImage,
  FileDown,
  Sun,
  Contrast,
  Droplets,
  Thermometer,
  Palette,
  Moon,
  Sparkles,
  Focus,
  Waves,
  Blend,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

export type ToolCategory = 'basicas' | 'ajustes' | 'export';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  studioTab: string;
  shortcut?: string;
}

export const TOOLS: ToolDef[] = [
  { id: 'crop', name: 'Recortar', description: 'Proporciones y selección libre', icon: Crop, category: 'basicas', studioTab: 'crop', shortcut: 'C' },
  { id: 'resize', name: 'Redimensionar', description: 'Tamaños y presets de redes', icon: Scaling, category: 'basicas', studioTab: 'resize', shortcut: 'R' },
  { id: 'rotate', name: 'Rotar', description: '90°, 180° o ángulo libre', icon: RotateCw, category: 'basicas', studioTab: 'transform' },
  { id: 'flip', name: 'Voltear', description: 'Espejo horizontal y vertical', icon: FlipHorizontal2, category: 'basicas', studioTab: 'transform' },
  { id: 'straighten', name: 'Enderezar', description: 'Corrige la inclinación', icon: Ruler, category: 'basicas', studioTab: 'transform' },
  { id: 'filters', name: 'Filtros', description: '16 looks con vista previa', icon: Palette, category: 'basicas', studioTab: 'filters' },
  { id: 'adjust', name: 'Ajustes', description: 'Luz, color y detalle', icon: SlidersHorizontal, category: 'basicas', studioTab: 'adjust' },
  { id: 'compress', name: 'Comprimir', description: 'Reduce el peso sin perder calidad', icon: FileDown, category: 'export', studioTab: 'compress' },
  { id: 'convert', name: 'Convertir', description: 'PNG, JPG y WEBP', icon: FileImage, category: 'export', studioTab: 'convert' },
  { id: 'export', name: 'Exportar', description: 'Formato, calidad y escala', icon: FileDown, category: 'export', studioTab: 'convert' },

  { id: 'brightness', name: 'Brillo', description: 'Luminosidad general', icon: Sun, category: 'ajustes', studioTab: 'adjust' },
  { id: 'contrast', name: 'Contraste', description: 'Rango tonal', icon: Contrast, category: 'ajustes', studioTab: 'adjust' },
  { id: 'exposure', name: 'Exposición', description: 'Luz fotográfica', icon: Sparkles, category: 'ajustes', studioTab: 'adjust' },
  { id: 'saturation', name: 'Saturación', description: 'Intensidad del color', icon: Droplets, category: 'ajustes', studioTab: 'adjust' },
  { id: 'temperature', name: 'Temperatura', description: 'Cálido o frío', icon: Thermometer, category: 'ajustes', studioTab: 'adjust' },
  { id: 'hue', name: 'Matiz', description: 'Rotación del color', icon: Blend, category: 'ajustes', studioTab: 'adjust' },
  { id: 'shadows', name: 'Sombras', description: 'Detalle en zonas oscuras', icon: Moon, category: 'ajustes', studioTab: 'adjust' },
  { id: 'highlights', name: 'Luces', description: 'Recupera zonas claras', icon: Sun, category: 'ajustes', studioTab: 'adjust' },
  { id: 'sharpness', name: 'Nitidez', description: 'Enfoca los detalles', icon: Focus, category: 'ajustes', studioTab: 'adjust' },
  { id: 'blur', name: 'Desenfoque', description: 'Suaviza la imagen', icon: Waves, category: 'ajustes', studioTab: 'adjust' },
  { id: 'opacity', name: 'Opacidad', description: 'Transparencia global', icon: Droplets, category: 'ajustes', studioTab: 'adjust' },
];

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  basicas: 'Básicas',
  ajustes: 'Ajustes',
  export: 'Exportar',
};

export function toolsByCategory(category: ToolCategory): ToolDef[] {
  return TOOLS.filter((t) => t.category === category);
}
