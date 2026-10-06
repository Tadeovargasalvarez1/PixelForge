import {
  Move,
  SquareDashed,
  Crop as CropIcon,
  Brush,
  Eraser,
  Type,
  Shapes,
  Stamp,
  Pipette,
  ZoomIn,
  Hand,
  Undo2,
  Redo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEditor } from '../../store/editorStore';
import { IconButton } from '../../components/ui/IconButton';
import type { ToolId } from '../../types';

export const TOOL_DEFS: { id: ToolId; icon: LucideIcon; label: string; shortcut: string }[] = [
  { id: 'move', icon: Move, label: 'Mover', shortcut: 'V' },
  { id: 'select', icon: SquareDashed, label: 'Selección', shortcut: 'M' },
  { id: 'crop', icon: CropIcon, label: 'Recortar', shortcut: 'C' },
  { id: 'brush', icon: Brush, label: 'Pincel', shortcut: 'B' },
  { id: 'eraser', icon: Eraser, label: 'Borrador', shortcut: 'E' },
  { id: 'text', icon: Type, label: 'Texto', shortcut: 'T' },
  { id: 'shape', icon: Shapes, label: 'Formas', shortcut: 'U' },
  { id: 'clone', icon: Stamp, label: 'Clonar', shortcut: 'S' },
  { id: 'eyedropper', icon: Pipette, label: 'Cuentagotas', shortcut: 'I' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom', shortcut: 'Z' },
  { id: 'hand', icon: Hand, label: 'Mano', shortcut: 'H' },
];

export function Toolbar() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const brush = useEditor((s) => s.brush);
  const setBrush = useEditor((s) => s.setBrush);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Herramientas">
      <IconButton icon={Undo2} label="Deshacer" shortcut="Ctrl+Z" tooltipPosition="right" disabled={!canUndo} onClick={undo} />
      <IconButton icon={Redo2} label="Rehacer" shortcut="Ctrl+Shift+Z" tooltipPosition="right" disabled={!canRedo} onClick={redo} />
      <div className="tool-sep" />
      {TOOL_DEFS.map((t) => (
        <IconButton
          key={t.id}
          icon={t.icon}
          label={t.label}
          shortcut={t.shortcut}
          tooltipPosition="right"
          active={tool === t.id}
          onClick={() => setTool(t.id)}
        />
      ))}
      <div className="tool-sep" />
      <label className="swatch" style={{ width: 32, height: 32, background: brush.color }} title="Color del pincel">
        <input type="color" value={brush.color} onChange={(e) => setBrush({ color: e.target.value })} aria-label="Color del pincel" />
      </label>
    </div>
  );
}
