import type { FilterPreset, SizePreset } from '../types';

export const FILTERS: FilterPreset[] = [
  { id: 'original', name: 'Original', adjustments: {} },
  {
    id: 'bw',
    name: 'B&N',
    adjustments: { grayscale: 100, contrast: 12 },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    adjustments: { sepia: 42, contrast: -6, saturation: -12, temperature: 18, brightness: 4 },
  },
  {
    id: 'warm',
    name: 'Cálido',
    adjustments: { temperature: 32, saturation: 10, vibrance: 8 },
  },
  {
    id: 'cool',
    name: 'Frío',
    adjustments: { temperature: -32, tint: 8, saturation: 4 },
  },
  {
    id: 'cinematic',
    name: 'Cinemático',
    adjustments: { contrast: 16, saturation: -14, shadows: 18, highlights: -12, temperature: -10 },
  },
  {
    id: 'fade',
    name: 'Fade',
    adjustments: { contrast: -18, blacks: 25, saturation: -16, brightness: 6 },
  },
  {
    id: 'dramatic',
    name: 'Dramático',
    adjustments: { contrast: 32, shadows: -14, highlights: 8, sharpness: 20, saturation: -8 },
  },
  {
    id: 'soft',
    name: 'Suave',
    adjustments: { brightness: 8, contrast: -8, blur: 1, vibrance: 6, highlights: 10 },
  },
  {
    id: 'highcontrast',
    name: 'Contraste+',
    adjustments: { contrast: 34, blacks: -16, whites: 14, sharpness: 12 },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    adjustments: { sepia: 78, contrast: 6, brightness: 2 },
  },
  {
    id: 'matte',
    name: 'Mate',
    adjustments: { contrast: -10, blacks: 18, saturation: -10, temperature: 6 },
  },
  {
    id: 'punch',
    name: 'Punch',
    adjustments: { saturation: 26, vibrance: 26, contrast: 12 },
  },
  {
    id: 'noir',
    name: 'Noir',
    adjustments: { grayscale: 100, contrast: 34, shadows: -18, blacks: -10 },
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    adjustments: { temperature: 40, tint: 12, highlights: 12, vibrance: 18, saturation: 10 },
  },
  {
    id: 'forest',
    name: 'Bosque',
    adjustments: { tint: -18, saturation: 12, temperature: -8, shadows: 12 },
  },
];

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'ig-post', name: 'Instagram', width: 1080, height: 1080, category: 'Redes' },
  { id: 'ig-story', name: 'IG Story', width: 1080, height: 1920, category: 'Redes' },
  { id: 'yt-thumb', name: 'Miniatura YT', width: 1280, height: 720, category: 'Redes' },
  { id: 'yt-cover', name: 'Portada YT', width: 2560, height: 1440, category: 'Redes' },
  { id: 'fb-post', name: 'Facebook', width: 1200, height: 630, category: 'Redes' },
  { id: 'x-post', name: 'X / Twitter', width: 1600, height: 900, category: 'Redes' },
  { id: 'linkedin', name: 'LinkedIn', width: 1200, height: 627, category: 'Redes' },
  { id: 'hd', name: 'HD', width: 1280, height: 720, category: 'Pantalla' },
  { id: 'fhd', name: 'Full HD', width: 1920, height: 1080, category: 'Pantalla' },
  { id: '2k', name: 'QHD 2K', width: 2560, height: 1440, category: 'Pantalla' },
  { id: '4k', name: '4K UHD', width: 3840, height: 2160, category: 'Pantalla' },
  { id: 'wallpaper', name: 'Wallpaper', width: 2560, height: 1440, category: 'Pantalla' },
];

export const CROP_RATIOS = [
  { id: 'free', name: 'Libre', ratio: 0 },
  { id: '1-1', name: '1:1', ratio: 1 },
  { id: '4-3', name: '4:3', ratio: 4 / 3 },
  { id: '3-4', name: '3:4', ratio: 3 / 4 },
  { id: '16-9', name: '16:9', ratio: 16 / 9 },
  { id: '9-16', name: '9:16', ratio: 9 / 16 },
  { id: '3-2', name: '3:2', ratio: 3 / 2 },
  { id: '2-3', name: '2:3', ratio: 2 / 3 },
];

export const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'system-ui',
];

export const TEXT_PRESETS = [
  { id: 'title', name: 'Título', fontSize: 96, bold: true, color: '#ffffff' },
  { id: 'subtitle', name: 'Subtítulo', fontSize: 56, bold: false, color: '#e5e7eb' },
  { id: 'body', name: 'Cuerpo', fontSize: 32, bold: false, color: '#ffffff' },
  { id: 'caption', name: 'Pie', fontSize: 22, bold: false, color: '#9ca3af' },
  { id: 'neon', name: 'Neón', fontSize: 72, bold: true, color: '#22d3ee' },
  { id: 'impact', name: 'Impacto', fontSize: 84, bold: true, color: '#f8fafc' },
];
