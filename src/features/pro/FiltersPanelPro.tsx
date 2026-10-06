import { useEffect, useRef } from 'react';
import { useEditor } from '../../store/editorStore';
import { FILTERS } from '../../services/presets';
import { DEFAULT_ADJUSTMENTS } from '../../types';
import { renderAdjusted, resizedSize } from '../../services/imageEngine';
import { toast } from '../../store/toastStore';
import type { Adjustments } from '../../types';

function Thumb({ source, adjustments }: { source: HTMLCanvasElement; adjustments: Partial<Adjustments> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const size = resizedSize(source.width, source.height, 120);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    renderAdjusted(source, source.width, source.height, { ...DEFAULT_ADJUSTMENTS, ...adjustments }, { canvas });
  }, [source, adjustments]);
  return <canvas ref={ref} width={size.width} height={size.height} />;
}

export function FiltersPanelPro() {
  const activeId = useEditor((s) => s.activeId);
  const layers = useEditor((s) => s.layers);
  const applyAdjustmentsToActive = useEditor((s) => s.applyAdjustmentsToActive);

  const active = layers.find((l) => l.id === activeId);

  if (!active || active.kind !== 'raster') {
    return <p className="muted" style={{ fontSize: '0.86rem' }}>Selecciona una capa de imagen para aplicar filtros.</p>;
  }

  const apply = (adjustments: Partial<Adjustments>) => {
    const full: Adjustments = { ...DEFAULT_ADJUSTMENTS, ...adjustments };
    const isIdentity = Object.keys(full).every(
      (k) => full[k as keyof Adjustments] === DEFAULT_ADJUSTMENTS[k as keyof Adjustments],
    );
    if (isIdentity) return;
    if (applyAdjustmentsToActive(adjustments)) toast.success('Filtro aplicado');
  };

  return (
    <div className="panel-section">
      <span className="panel-section-title">Filtros · {active.name}</span>
      <div className="filter-grid">
        {FILTERS.map((preset) => (
          <button key={preset.id} type="button" className="filter-item" onClick={() => apply(preset.adjustments)} title={`Aplicar ${preset.name}`}>
            <Thumb source={active.canvas} adjustments={preset.adjustments} />
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
      <p className="dim" style={{ fontSize: '0.78rem' }}>Los filtros se aplican a la capa activa.</p>
    </div>
  );
}
