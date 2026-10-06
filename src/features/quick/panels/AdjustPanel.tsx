import { RotateCcw } from 'lucide-react';
import { Slider } from '../../../components/ui/Slider';
import { useImageStore } from '../../../store/imageStore';
import type { Adjustments } from '../../../types';

interface Group {
  title: string;
  items: { key: keyof Adjustments; label: string; min?: number; max?: number }[];
}

const GROUPS: Group[] = [
  {
    title: 'Luz',
    items: [
      { key: 'brightness', label: 'Brillo' },
      { key: 'contrast', label: 'Contraste' },
      { key: 'exposure', label: 'Exposición' },
      { key: 'highlights', label: 'Luces' },
      { key: 'shadows', label: 'Sombras' },
      { key: 'whites', label: 'Blancos' },
      { key: 'blacks', label: 'Negros' },
    ],
  },
  {
    title: 'Color',
    items: [
      { key: 'saturation', label: 'Saturación' },
      { key: 'vibrance', label: 'Vibrancia' },
      { key: 'temperature', label: 'Temperatura' },
      { key: 'tint', label: 'Matiz Δ' },
      { key: 'hue', label: 'Rotar matiz', min: -180, max: 180 },
    ],
  },
  {
    title: 'Detalle',
    items: [
      { key: 'sharpness', label: 'Nitidez', min: 0, max: 100 },
      { key: 'blur', label: 'Desenfoque', min: 0, max: 20 },
      { key: 'opacity', label: 'Opacidad', min: 0, max: 100 },
    ],
  },
  {
    title: 'Efectos',
    items: [
      { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
      { key: 'grayscale', label: 'Escala de grises', min: 0, max: 100 },
      { key: 'invert', label: 'Invertir', min: 0, max: 100 },
    ],
  },
];

export function AdjustPanel() {
  const adjustments = useImageStore((s) => s.adjustments);
  const setAdjustment = useImageStore((s) => s.setAdjustment);
  const resetAdjustments = useImageStore((s) => s.resetAdjustments);
  const commit = useImageStore((s) => s.commit);

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="panel-section-title">Ajustes manuales</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={resetAdjustments}>
          <RotateCcw size={14} /> Reiniciar
        </button>
      </div>
      {GROUPS.map((group) => (
        <div key={group.title} className="panel-section">
          <span className="panel-section-title">{group.title}</span>
          {group.items.map((item) => (
            <Slider
              key={item.key}
              label={item.label}
              value={adjustments[item.key]}
              min={item.min ?? -100}
              max={item.max ?? 100}
              onChange={(v) => setAdjustment(item.key, v)}
              onCommit={commit}
            />
          ))}
        </div>
      ))}
    </>
  );
}
