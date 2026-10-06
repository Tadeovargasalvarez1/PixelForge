import { Check, RotateCcw } from 'lucide-react';
import { useEditor } from '../../store/editorStore';
import { Slider } from '../../components/ui/Slider';
import { DEFAULT_ADJUSTMENTS, type Adjustments } from '../../types';

const GROUPS: { title: string; items: { key: keyof Adjustments; label: string; min?: number; max?: number }[] }[] = [
  {
    title: 'Luz',
    items: [
      { key: 'brightness', label: 'Brillo' },
      { key: 'contrast', label: 'Contraste' },
      { key: 'exposure', label: 'Exposición' },
      { key: 'highlights', label: 'Luces' },
      { key: 'shadows', label: 'Sombras' },
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
    title: 'Detalle y efectos',
    items: [
      { key: 'sharpness', label: 'Nitidez', min: 0, max: 100 },
      { key: 'blur', label: 'Desenfoque', min: 0, max: 20 },
      { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
      { key: 'grayscale', label: 'Escala de grises', min: 0, max: 100 },
      { key: 'invert', label: 'Invertir', min: 0, max: 100 },
    ],
  },
];

export function AdjustPanelPro() {
  const activeId = useEditor((s) => s.activeId);
  const layers = useEditor((s) => s.layers);
  const liveAdjust = useEditor((s) => s.liveAdjust);
  const setLiveAdjust = useEditor((s) => s.setLiveAdjust);
  const applyLiveAdjust = useEditor((s) => s.applyLiveAdjust);
  const clearLiveAdjust = useEditor((s) => s.clearLiveAdjust);

  const active = layers.find((l) => l.id === activeId);
  const adjustments = liveAdjust?.layerId === activeId ? liveAdjust.adjustments : DEFAULT_ADJUSTMENTS;

  if (!active || active.kind !== 'raster') {
    return (
      <p className="muted" style={{ fontSize: '0.86rem' }}>
        Selecciona una capa de imagen para ajustar su color y tono.
      </p>
    );
  }

  const update = (key: keyof Adjustments, value: number) => {
    setLiveAdjust(activeId!, { ...adjustments, [key]: value });
  };

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="panel-section-title">Ajustes · {active.name}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { clearLiveAdjust(); }} title="Reiniciar">
          <RotateCcw size={13} />
        </button>
      </div>
      {GROUPS.map((g) => (
        <div key={g.title} className="panel-section">
          <span className="panel-section-title">{g.title}</span>
          {g.items.map((item) => (
            <Slider
              key={item.key}
              label={item.label}
              value={adjustments[item.key]}
              min={item.min ?? -100}
              max={item.max ?? 100}
              onChange={(v) => update(item.key, v)}
            />
          ))}
        </div>
      ))}
      <button type="button" className="btn btn-primary" onClick={applyLiveAdjust}>
        <Check size={16} /> Aplicar a la capa
      </button>
    </>
  );
}
