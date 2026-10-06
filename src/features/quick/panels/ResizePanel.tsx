import { useEffect, useState } from 'react';
import { Link2, Link2Off, Check } from 'lucide-react';
import { useImageStore } from '../../../store/imageStore';
import { SIZE_PRESETS } from '../../../services/presets';
import { outputSize } from '../renderQuick';

export function ResizePanel() {
  const image = useImageStore((s) => s.image);
  const rotation = useImageStore((s) => s.rotation);
  const flipH = useImageStore((s) => s.flipH);
  const flipV = useImageStore((s) => s.flipV);
  const crop = useImageStore((s) => s.crop);
  const resize = useImageStore((s) => s.resize);
  const setResize = useImageStore((s) => s.setResize);
  const commit = useImageStore((s) => s.commit);

  const base = image
    ? outputSize(image, rotation, flipH, flipV, crop, null)
    : { width: 0, height: 0 };

  const [width, setWidth] = useState(base.width);
  const [height, setHeight] = useState(base.height);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    if (resize) {
      setWidth(resize.width);
      setHeight(resize.height);
    } else {
      setWidth(base.width);
      setHeight(base.height);
    }
  }, [resize, base.width, base.height]);

  if (!image) return null;

  const aspect = base.width / base.height;

  const changeWidth = (w: number) => {
    setWidth(w);
    if (locked) setHeight(Math.round(w / aspect));
  };
  const changeHeight = (h: number) => {
    setHeight(h);
    if (locked) setWidth(Math.round(h * aspect));
  };
  const setPercent = (pct: number) => {
    setWidth(Math.round((base.width * pct) / 100));
    setHeight(Math.round((base.height * pct) / 100));
  };

  const apply = () => {
    commit();
    setResize({ width: Math.max(1, width), height: Math.max(1, height) });
  };

  return (
    <>
      <div className="panel-section">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="panel-section-title">Dimensiones</span>
          <button
            type="button"
            className={`icon-btn icon-btn-sm ${locked ? 'active' : ''}`}
            onClick={() => setLocked((v) => !v)}
            aria-label={locked ? 'Desbloquear proporción' : 'Bloquear proporción'}
            title="Mantener proporción"
          >
            {locked ? <Link2 size={15} /> : <Link2Off size={15} />}
          </button>
        </div>
        <div className="row gap-2">
          <label className="field grow">
            <span className="label" style={{ textTransform: 'none' }}>Ancho</span>
            <input className="input mono" type="number" min={1} value={width} onChange={(e) => changeWidth(Number(e.target.value))} />
          </label>
          <label className="field grow">
            <span className="label" style={{ textTransform: 'none' }}>Alto</span>
            <input className="input mono" type="number" min={1} value={height} onChange={(e) => changeHeight(Number(e.target.value))} />
          </label>
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {[25, 50, 75, 100, 150, 200].map((pct) => (
            <button key={pct} type="button" className="btn btn-ghost btn-sm" onClick={() => setPercent(pct)}>
              {pct}%
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={apply}>
          <Check size={16} /> Aplicar tamaño
        </button>
      </div>

      <div className="panel-section">
        <span className="panel-section-title">Presets</span>
        <div className="preset-grid">
          {SIZE_PRESETS.map((p) => (
            <button key={p.id} type="button" className="preset-btn" onClick={() => { setWidth(p.width); setHeight(p.height); setLocked(false); }}>
              <div className="p-name">{p.name}</div>
              <div className="p-dim">{p.width} × {p.height}</div>
            </button>
          ))}
        </div>
      </div>

      {resize ? (
        <button type="button" className="btn btn-ghost" onClick={() => { commit(); setResize(null); }}>
          Restablecer tamaño original
        </button>
      ) : (
        <p className="dim" style={{ fontSize: '0.78rem' }}>Salida actual: {base.width} × {base.height}px</p>
      )}
    </>
  );
}
