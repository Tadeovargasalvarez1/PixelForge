import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Type as TypeIcon,
  Shapes,
  Image as ImageIcon,
  GripVertical,
} from 'lucide-react';
import { useEditor } from '../../store/editorStore';
import { Slider } from '../../components/ui/Slider';
import { toast } from '../../store/toastStore';
import type { Layer } from '../../types';

function LayerThumb({ layer, version }: { layer: Layer; version: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / layer.canvas.width, canvas.height / layer.canvas.height);
    const w = layer.canvas.width * scale;
    const h = layer.canvas.height * scale;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(layer.canvas, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }, [layer, version]);
  return <canvas ref={ref} className="layer-thumb" width={34} height={34} />;
}

export function LayersPanel() {
  const layers = useEditor((s) => s.layers);
  const activeId = useEditor((s) => s.activeId);
  const setActive = useEditor((s) => s.setActive);
  const addRasterLayer = useEditor((s) => s.addRasterLayer);
  const addTextLayer = useEditor((s) => s.addTextLayer);
  const addShapeLayer = useEditor((s) => s.addShapeLayer);
  const removeLayer = useEditor((s) => s.removeLayer);
  const duplicateLayer = useEditor((s) => s.duplicateLayer);
  const moveLayer = useEditor((s) => s.moveLayer);
  const updateLayer = useEditor((s) => s.updateLayer);
  const reorderLayer = useEditor((s) => s.reorderLayer);
  const version = useEditor((s) => s.renderVersion);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const active = layers.find((l) => l.id === activeId);
  const display = [...layers].reverse();

  const kindIcon = (kind: string) =>
    kind === 'text' ? <TypeIcon size={12} /> : kind === 'shape' ? <Shapes size={12} /> : <ImageIcon size={12} />;

  const handleDrop = (displayIndex: number) => {
    if (dragIndex === null || dragIndex === displayIndex) return;
    const from = layers.length - 1 - dragIndex;
    const to = layers.length - 1 - displayIndex;
    reorderLayer(from, to);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <>
      <div className="row gap-1">
        <button type="button" className="btn btn-ghost btn-sm grow" onClick={() => addRasterLayer()} title="Nueva capa">
          <Plus size={14} /> Capa
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addTextLayer()} title="Texto">
          <TypeIcon size={14} />
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addShapeLayer()} title="Forma">
          <Shapes size={14} />
        </button>
      </div>

      <div className="layer-list">
        {display.map((layer, i) => (
          <div
            key={layer.id}
            className={`layer-item ${layer.id === activeId ? 'active' : ''} ${overIndex === i ? 'layer-drop' : ''} ${dragIndex === i ? 'layer-dragging' : ''}`}
            onClick={() => setActive(layer.id)}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(i);
            }}
            onDragLeave={() => setOverIndex(null)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
          >
            <GripVertical size={13} className="dim" style={{ cursor: 'grab', flex: '0 0 auto' }} />
            <LayerThumb layer={layer} version={version} />
            <div className="layer-meta">
              <div className="layer-name truncate" title={layer.name}>
                {layer.name}
              </div>
              <div className="layer-sub row gap-1">
                {kindIcon(layer.kind)} {Math.round(layer.opacity * 100)}%
              </div>
            </div>
            <button
              type="button"
              className="icon-btn icon-btn-sm"
              aria-label={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
              onClick={(e) => {
                e.stopPropagation();
                updateLayer(layer.id, { visible: !layer.visible });
              }}
            >
              {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              type="button"
              className="icon-btn icon-btn-sm"
              aria-label={layer.locked ? 'Desbloquear capa' : 'Bloquear capa'}
              onClick={(e) => {
                e.stopPropagation();
                updateLayer(layer.id, { locked: !layer.locked });
              }}
            >
              {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          </div>
        ))}
      </div>

      {active && (
        <div className="panel-section">
          <span className="panel-section-title">Capa activa</span>
          <input
            className="input"
            value={active.name}
            onChange={(e) => updateLayer(active.id, { name: e.target.value })}
            aria-label="Nombre de la capa"
          />
          <Slider
            label="Opacidad"
            value={Math.round(active.opacity * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) => updateLayer(active.id, { opacity: v / 100 })}
            onCommit={() => useEditor.getState().commit()}
          />
          <div className="row gap-1">
            <button type="button" className="btn btn-ghost btn-sm grow" onClick={() => duplicateLayer(active.id)}>
              <Copy size={13} /> Duplicar
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveLayer(active.id, 'up')} aria-label="Subir capa">
              <ChevronUp size={15} />
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveLayer(active.id, 'down')} aria-label="Bajar capa">
              <ChevronDown size={15} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-label="Eliminar capa"
              onClick={() => {
                if (layers.length <= 1) {
                  toast.warning('Debe quedar al menos una capa');
                  return;
                }
                removeLayer(active.id);
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
