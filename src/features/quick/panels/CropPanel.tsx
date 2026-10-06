import { Check, X } from 'lucide-react';
import { CROP_RATIOS } from '../../../services/presets';
import type { NormRect } from '../../../components/CropOverlay';

interface CropPanelProps {
  rect: NormRect;
  onRect: (rect: NormRect) => void;
  ratio: number;
  onRatio: (ratio: number) => void;
  baseSize: { width: number; height: number };
  onApply: () => void;
  onReset: () => void;
}

export function CropPanel({ rect, onRect, ratio, onRatio, baseSize, onApply, onReset }: CropPanelProps) {
  const pxW = Math.round(rect.w * baseSize.width);
  const pxH = Math.round(rect.h * baseSize.height);

  const setPx = (w?: number, h?: number) => {
    const nw = w ? Math.min(baseSize.width, Math.max(16, w)) / baseSize.width : rect.w;
    const nh = h ? Math.min(baseSize.height, Math.max(16, h)) / baseSize.height : rect.h;
    onRect({ ...rect, w: Math.min(1, nw), h: Math.min(1, nh) });
  };

  return (
    <>
      <div className="panel-section">
        <span className="panel-section-title">Proporción</span>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {CROP_RATIOS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`btn btn-sm ${ratio === r.ratio ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onRatio(r.ratio)}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-section">
        <span className="panel-section-title">Tamaño seleccionado</span>
        <div className="row gap-2">
          <label className="field grow">
            <span className="label" style={{ textTransform: 'none' }}>Ancho</span>
            <input className="input mono" type="number" value={pxW} onChange={(e) => setPx(Number(e.target.value), undefined)} />
          </label>
          <label className="field grow">
            <span className="label" style={{ textTransform: 'none' }}>Alto</span>
            <input className="input mono" type="number" value={pxH} onChange={(e) => setPx(undefined, Number(e.target.value))} />
          </label>
        </div>
      </div>
      <p className="dim" style={{ fontSize: '0.78rem' }}>
        Arrastra la selección para moverla y usa las esquinas para redimensionar.
      </p>
      <div className="row gap-2">
        <button type="button" className="btn btn-primary grow" onClick={onApply}>
          <Check size={16} /> Aplicar recorte
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset} aria-label="Cancelar recorte">
          <X size={16} />
        </button>
      </div>
    </>
  );
}
