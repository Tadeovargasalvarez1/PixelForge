import { RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2, RefreshCw } from 'lucide-react';
import { useImageStore } from '../../../store/imageStore';
import { Slider } from '../../../components/ui/Slider';

export function TransformPanel() {
  const rotation = useImageStore((s) => s.rotation);
  const flipH = useImageStore((s) => s.flipH);
  const flipV = useImageStore((s) => s.flipV);
  const rotate = useImageStore((s) => s.rotate);
  const setRotation = useImageStore((s) => s.setRotation);
  const flip = useImageStore((s) => s.flip);
  const clearTransforms = useImageStore((s) => s.clearTransforms);
  const commit = useImageStore((s) => s.commit);

  return (
    <>
      <div className="panel-section">
        <span className="panel-section-title">Giro</span>
        <div className="row gap-2">
          <button type="button" className="btn btn-ghost grow" onClick={() => rotate(-90)}>
            <RotateCcw size={16} /> 90°
          </button>
          <button type="button" className="btn btn-ghost grow" onClick={() => rotate(180)}>
            <RefreshCw size={16} /> 180°
          </button>
          <button type="button" className="btn btn-ghost grow" onClick={() => rotate(90)}>
            <RotateCw size={16} /> 90°
          </button>
        </div>
        <Slider
          label="Ángulo libre"
          value={Math.round(rotation)}
          min={0}
          max={360}
          step={1}
          suffix="°"
          onChange={(v) => setRotation(v)}
          onCommit={commit}
        />
      </div>

      <div className="panel-section">
        <span className="panel-section-title">Espejo</span>
        <div className="row gap-2">
          <button type="button" className={`btn grow ${flipH ? 'btn-primary' : 'btn-ghost'}`} onClick={() => flip('horizontal')}>
            <FlipHorizontal2 size={16} /> Horizontal
          </button>
          <button type="button" className={`btn grow ${flipV ? 'btn-primary' : 'btn-ghost'}`} onClick={() => flip('vertical')}>
            <FlipVertical2 size={16} /> Vertical
          </button>
        </div>
      </div>

      <button type="button" className="btn btn-ghost" onClick={() => { commit(); clearTransforms(); }}>
        <RefreshCw size={14} /> Restablecer transformación
      </button>
    </>
  );
}
