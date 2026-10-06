import { useEffect, useMemo, useRef } from 'react';
import { Check } from 'lucide-react';
import { useImageStore } from '../../../store/imageStore';
import { FILTERS } from '../../../services/presets';
import { DEFAULT_ADJUSTMENTS } from '../../../types';
import { renderAdjusted, drawToCanvas, resizedSize } from '../../../services/imageEngine';

function FilterThumb({
  base,
  adjustments,
  active,
  name,
  onClick,
}: {
  base: HTMLCanvasElement;
  adjustments: Partial<typeof DEFAULT_ADJUSTMENTS>;
  active: boolean;
  name: string;
  onClick: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    renderAdjusted(base, base.width, base.height, { ...DEFAULT_ADJUSTMENTS, ...adjustments }, { canvas });
  }, [base, adjustments]);
  return (
    <button type="button" className={`filter-item ${active ? 'active' : ''}`} onClick={onClick} aria-pressed={active}>
      <canvas ref={ref} width={base.width} height={base.height} />
      <span>
        {active && <Check size={11} style={{ verticalAlign: -1, marginRight: 3 }} />}
        {name}
      </span>
    </button>
  );
}

export function FiltersPanel() {
  const image = useImageStore((s) => s.image);
  const filterId = useImageStore((s) => s.filterId);
  const applyFilter = useImageStore((s) => s.applyFilter);

  const base = useMemo(() => {
    if (!image) return null;
    const size = resizedSize(image.width, image.height, 150);
    return drawToCanvas(image.bitmap, size.width, size.height);
  }, [image]);

  if (!base) return null;

  return (
    <div className="panel-section">
      <span className="panel-section-title">Filtros</span>
      <div className="filter-grid">
        {FILTERS.map((preset) => (
          <FilterThumb
            key={preset.id}
            base={base}
            adjustments={preset.adjustments}
            active={filterId === preset.id}
            name={preset.name}
            onClick={() => applyFilter(preset.id)}
          />
        ))}
      </div>
      <p className="dim" style={{ fontSize: '0.78rem' }}>
        Los ajustes manuales se reinician al aplicar un filtro.
      </p>
    </div>
  );
}
