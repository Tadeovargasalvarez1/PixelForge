import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useEditor } from '../../store/editorStore';
import { Slider } from '../../components/ui/Slider';
import { ColorField } from '../../components/ui/ColorField';
import { FONT_FAMILIES, TEXT_PRESETS } from '../../services/presets';
import type { ShapeData } from '../../types';

const SHAPES: ShapeData['shape'][] = ['rect', 'ellipse', 'triangle', 'star', 'line', 'arrow'];

export function PropertiesPanel() {
  const tool = useEditor((s) => s.tool);
  const layers = useEditor((s) => s.layers);
  const activeId = useEditor((s) => s.activeId);
  const brush = useEditor((s) => s.brush);
  const setBrush = useEditor((s) => s.setBrush);
  const updateText = useEditor((s) => s.updateText);
  const updateShape = useEditor((s) => s.updateShape);
  const textDefaults = useEditor((s) => s.textDefaults);
  const setTextDefaults = useEditor((s) => s.setTextDefaults);
  const shapeDefaults = useEditor((s) => s.shapeDefaults);
  const setShapeDefaults = useEditor((s) => s.setShapeDefaults);

  const active = layers.find((l) => l.id === activeId);

  const showBrush = tool === 'brush' || tool === 'eraser' || tool === 'clone';

  return (
    <>
      {showBrush && (
        <div className="panel-section">
          <span className="panel-section-title">Pincel</span>
          {tool !== 'eraser' && <ColorField label="Color" value={brush.color} onChange={(c) => setBrush({ color: c })} />}
          <Slider label="Tamaño" value={brush.size} min={1} max={400} suffix="px" onChange={(v) => setBrush({ size: v })} />
          <Slider label="Dureza" value={brush.hardness} min={0} max={100} suffix="%" onChange={(v) => setBrush({ hardness: v })} />
          <Slider label="Opacidad" value={brush.opacity} min={0} max={100} suffix="%" onChange={(v) => setBrush({ opacity: v })} />
        </div>
      )}

      {active?.kind === 'text' && active.text && (
        <>
          <div className="panel-section">
            <span className="panel-section-title">Texto</span>
            <textarea
              className="input"
              style={{ height: 72, padding: 8, resize: 'vertical' }}
              value={active.text.text}
              onChange={(e) => updateText(active.id, { text: e.target.value })}
              aria-label="Contenido de texto"
            />
            <div className="row gap-2">
              <select className="select" value={active.text.fontFamily} onChange={(e) => updateText(active.id, { fontFamily: e.target.value })} aria-label="Fuente">
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <Slider label="Tamaño" value={active.text.fontSize} min={8} max={400} suffix="px" onChange={(v) => updateText(active.id, { fontSize: v })} />
            <div className="row gap-1">
              <button type="button" className={`icon-btn ${active.text.bold ? 'active' : ''}`} onClick={() => updateText(active.id, { bold: !active.text!.bold })} aria-label="Negrita"><Bold size={16} /></button>
              <button type="button" className={`icon-btn ${active.text.italic ? 'active' : ''}`} onClick={() => updateText(active.id, { italic: !active.text!.italic })} aria-label="Cursiva"><Italic size={16} /></button>
              <div style={{ width: 8 }} />
              <button type="button" className={`icon-btn ${active.text.align === 'left' ? 'active' : ''}`} onClick={() => updateText(active.id, { align: 'left' })} aria-label="Alinear izquierda"><AlignLeft size={16} /></button>
              <button type="button" className={`icon-btn ${active.text.align === 'center' ? 'active' : ''}`} onClick={() => updateText(active.id, { align: 'center' })} aria-label="Centrar"><AlignCenter size={16} /></button>
              <button type="button" className={`icon-btn ${active.text.align === 'right' ? 'active' : ''}`} onClick={() => updateText(active.id, { align: 'right' })} aria-label="Alinear derecha"><AlignRight size={16} /></button>
            </div>
            <ColorField label="Color" value={active.text.color} onChange={(c) => updateText(active.id, { color: c })} />
            <Slider label="Interlineado" value={active.text.lineHeight * 100} min={80} max={250} suffix="%" onChange={(v) => updateText(active.id, { lineHeight: v / 100 })} />
          </div>
          <div className="panel-section">
            <span className="panel-section-title">Presets de texto</span>
            <div className="preset-grid">
              {TEXT_PRESETS.map((p) => (
                <button key={p.id} type="button" className="preset-btn" onClick={() => updateText(active.id, { fontSize: p.fontSize, bold: p.bold, color: p.color })}>
                  <div className="p-name">{p.name}</div>
                  <div className="p-dim">{p.fontSize}px</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {active?.kind === 'shape' && active.shape && (
        <>
          <div className="panel-section">
            <span className="panel-section-title">Forma</span>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {SHAPES.map((s) => (
                <button key={s} type="button" className={`btn btn-sm ${active.shape!.shape === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateShape(active.id, { shape: s })}>
                  {s === 'rect' ? 'Rect' : s === 'ellipse' ? 'Círculo' : s === 'triangle' ? 'Triángulo' : s === 'star' ? 'Estrella' : s === 'line' ? 'Línea' : 'Flecha'}
                </button>
              ))}
            </div>
            <ColorField label="Relleno" value={active.shape.fill === 'transparent' ? '#000000' : active.shape.fill} onChange={(c) => updateShape(active.id, { fill: c })} />
            <ColorField label="Borde" value={active.shape.stroke} onChange={(c) => updateShape(active.id, { stroke: c })} />
            <Slider label="Grosor del borde" value={active.shape.strokeWidth} min={0} max={40} suffix="px" onChange={(v) => updateShape(active.id, { strokeWidth: v })} />
            <div className="row gap-2">
              <label className="field grow">
                <span className="label" style={{ textTransform: 'none' }}>Ancho</span>
                <input className="input mono" type="number" value={Math.round(active.shape.width)} onChange={(e) => updateShape(active.id, { width: Number(e.target.value) })} />
              </label>
              <label className="field grow">
                <span className="label" style={{ textTransform: 'none' }}>Alto</span>
                <input className="input mono" type="number" value={Math.round(active.shape.height)} onChange={(e) => updateShape(active.id, { height: Number(e.target.value) })} />
              </label>
            </div>
          </div>
        </>
      )}

      {!showBrush && active?.kind === 'raster' && (
        <div className="panel-section">
          <span className="panel-section-title">Opciones</span>
          <p className="muted" style={{ fontSize: '0.84rem' }}>
            Usa las herramientas de pincel, texto, formas o selección. Ajusta el color, tamaño y
            opacidad en la barra superior y en este panel.
          </p>
          <div className="row gap-2">
            <div className="swatch" style={{ width: 28, height: 28, background: brush.color }} />
            <span className="mono" style={{ fontSize: '0.82rem' }}>{brush.color.toUpperCase()}</span>
          </div>
        </div>
      )}

      {active?.kind === 'text' && (
        <div className="panel-section">
          <span className="panel-section-title">Nuevo texto por defecto</span>
          <Slider label="Tamaño" value={textDefaults.fontSize} min={8} max={200} suffix="px" onChange={(v) => setTextDefaults({ fontSize: v })} />
        </div>
      )}

      {active?.kind === 'shape' && (
        <div className="panel-section">
          <span className="panel-section-title">Nueva forma por defecto</span>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {SHAPES.map((s) => (
              <button key={s} type="button" className={`btn btn-sm ${shapeDefaults.shape === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShapeDefaults({ shape: s })}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
