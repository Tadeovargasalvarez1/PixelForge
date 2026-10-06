import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Move3d,
  Layers as LayersIcon,
  SlidersHorizontal,
  Palette,
  Settings2,
  Upload,
  FilePlus2,
  Download,
  Trash2,
  Copy,
  Merge,
  PanelRight,
  ChevronDown,
} from 'lucide-react';
import { useEditor } from '../store/editorStore';
import { useImageLoader } from '../hooks/useImageLoader';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { FileDropzone } from '../components/FileDropzone';
import { Tabs } from '../components/ui/Tabs';
import { Drawer } from '../components/ui/Drawer';
import { Menu, type MenuItem } from '../components/ui/Menu';
import { Toolbar, TOOL_DEFS } from '../features/pro/Toolbar';
import { EditorCanvas } from '../features/pro/EditorCanvas';
import { LayersPanel } from '../features/pro/LayersPanel';
import { PropertiesPanel } from '../features/pro/PropertiesPanel';
import { AdjustPanelPro } from '../features/pro/AdjustPanelPro';
import { FiltersPanelPro } from '../features/pro/FiltersPanelPro';
import { ExportDialog } from '../features/pro/ExportDialog';
import { drawToCanvas, createCanvas, getContext } from '../services/imageEngine';
import { releaseImage } from '../services/imageService';
import { toast } from '../store/toastStore';
import { saveProject, uid } from '../services/storage';
import { SIZE_PRESETS, FILTERS } from '../services/presets';

type PanelTab = 'layers' | 'props' | 'adjust' | 'filters';

export function EditorPro() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<PanelTab>('layers');
  const [exportOpen, setExportOpen] = useState(false);
  const [mobilePanels, setMobilePanels] = useState(false);
  const isCompact = useMediaQuery('(max-width: 960px)');

  const doc = useEditor((s) => s.doc);
  const layers = useEditor((s) => s.layers);
  const activeId = useEditor((s) => s.activeId);
  const tool = useEditor((s) => s.tool);
  const viewport = useEditor((s) => s.viewport);
  const initDocument = useEditor((s) => s.initDocument);
  const setDocName = useEditor((s) => s.setDocName);
  const setTool = useEditor((s) => s.setTool);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const removeLayer = useEditor((s) => s.removeLayer);
  const duplicateLayer = useEditor((s) => s.duplicateLayer);
  const setViewport = useEditor((s) => s.setViewport);
  const setBrush = useEditor((s) => s.setBrush);
  const applyAdjustmentsToActive = useEditor((s) => s.applyAdjustmentsToActive);

  const { loadFiles } = useImageLoader({
    onLoad: (image) => {
      const base = drawToCanvas(image.bitmap, image.width, image.height);
      initDocument(image.width, image.height, image.name, base);
      setPanel('layers');
      // El Editor Pro trabaja con canvas propios; liberamos el Object URL temporal.
      releaseImage(image);
    },
  });

  const fit = useCallback(() => {
    const stage = document.querySelector('.editor-stage') as HTMLElement | null;
    if (!stage) return;
    const scale = Math.min((stage.clientWidth - 80) / doc.width, (stage.clientHeight - 80) / doc.height, 1);
    setViewport({ scale: Math.max(0.05, scale), x: 0, y: 0 });
  }, [doc.width, doc.height, setViewport]);

  const mergeDown = () => {
    const state = useEditor.getState();
    const index = state.layers.findIndex((l) => l.id === state.activeId);
    if (index <= 0) {
      toast.warning('No hay capa inferior para combinar');
      return;
    }
    state.commit();
    const upper = state.layers[index];
    const lower = state.layers[index - 1];
    const mergedCanvas = createCanvas(state.doc.width, state.doc.height);
    const ctx = getContext(mergedCanvas);
    ctx.drawImage(lower.canvas, lower.x, lower.y);
    ctx.globalAlpha = upper.opacity;
    ctx.drawImage(upper.canvas, upper.x, upper.y);
    const layers = state.layers
      .map((l) => (l.id === lower.id ? { ...l, canvas: mergedCanvas, x: 0, y: 0, opacity: 1 } : l))
      .filter((l) => l.id !== upper.id);
    useEditor.setState((s) => ({
      layers,
      activeId: lower.id,
      renderVersion: s.renderVersion + 1,
    }));
    toast.success('Capas combinadas');
  };

  const saveProjectLocal = async () => {
    try {
      const canvas = useEditor.getState().flatten();
      const scale = Math.min(1, 320 / Math.max(canvas.width, canvas.height));
      const thumbnail = drawToCanvas(
        canvas,
        Math.round(canvas.width * scale),
        Math.round(canvas.height * scale),
      ).toDataURL('image/jpeg', 0.6);
      const data = canvas.toDataURL('image/jpeg', 0.85);
      await saveProject({
        meta: {
          id: uid('proj'),
          name: doc.name,
          width: canvas.width,
          height: canvas.height,
          thumbnail,
          updatedAt: Date.now(),
          createdAt: Date.now(),
        },
        preview: thumbnail,
        original: data,
      });
      toast.success('Proyecto guardado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar');
    }
  };

  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onSave: () => setExportOpen(true),
    onOpen: () => fileRef.current?.click(),
    onDelete: () => {
      // Si hay una selección activa en el lienzo, Delete limpia esa región (no borra la capa).
      if (useEditor.getState().selectionActive) return;
      if (activeId) removeLayer(activeId);
    },
    onEscape: () => setTool('move'),
    onBrushSize: (delta) => setBrush({ size: Math.max(1, useEditor.getState().brush.size + delta * 4) }),
    tools: Object.fromEntries(TOOL_DEFS.map((t) => [t.shortcut.toLowerCase(), () => setTool(t.id)])),
  });

  const fileItems: MenuItem[] = [
    { label: 'Nueva imagen', icon: <Upload size={15} />, onClick: () => fileRef.current?.click() },
    { label: 'Lienzo en blanco 1920×1080', icon: <FilePlus2 size={15} />, onClick: () => initDocument(1920, 1080, 'Sin título', createCanvas(1920, 1080)) },
    { label: 'Lienzo en blanco 1080×1080', icon: <FilePlus2 size={15} />, onClick: () => initDocument(1080, 1080, 'Sin título', createCanvas(1080, 1080)) },
    { separator: true, label: '' },
    { label: 'Guardar en Proyectos', shortcut: 'Ctrl+S', icon: <Download size={15} />, onClick: saveProjectLocal },
    { label: 'Exportar…', icon: <Download size={15} />, onClick: () => setExportOpen(true) },
    { separator: true, label: '' },
    { label: 'Ir al inicio', onClick: () => navigate('/') },
  ];

  const editItems: MenuItem[] = [
    { label: 'Deshacer', shortcut: 'Ctrl+Z', icon: <Move3d size={15} />, onClick: undo },
    { label: 'Rehacer', shortcut: 'Ctrl+Shift+Z', onClick: redo },
    { separator: true, label: '' },
    { label: 'Duplicar capa', shortcut: 'Ctrl+C', icon: <Copy size={15} />, onClick: () => activeId && duplicateLayer(activeId) },
    { label: 'Eliminar capa', shortcut: 'Del', icon: <Trash2 size={15} />, danger: true, onClick: () => activeId && removeLayer(activeId) },
    { label: 'Combinar hacia abajo', icon: <Merge size={15} />, onClick: mergeDown },
  ];

  const layerItems: MenuItem[] = [
    { label: 'Nueva capa', onClick: () => useEditor.getState().addRasterLayer() },
    { label: 'Nueva capa de texto', onClick: () => useEditor.getState().addTextLayer() },
    { label: 'Nueva forma', onClick: () => useEditor.getState().addShapeLayer() },
    { separator: true, label: '' },
    { label: 'Combinar hacia abajo', onClick: mergeDown },
  ];

  const imageItems: MenuItem[] = [
    { label: 'Ajustes de color', icon: <SlidersHorizontal size={15} />, onClick: () => setPanel('adjust') },
    { label: 'Filtros', icon: <Palette size={15} />, onClick: () => setPanel('filters') },
    { separator: true, label: '' },
    ...SIZE_PRESETS.slice(0, 5).map((p) => ({
      label: `Redimensionar a ${p.name} (${p.width}×${p.height})`,
      onClick: () => {
        useEditor.getState().commit();
        useEditor.setState((s) => ({ doc: { ...s.doc, width: p.width, height: p.height }, renderVersion: s.renderVersion + 1 }));
        toast.info('Lienzo redimensionado', `${p.width}×${p.height}`);
      },
    })),
  ];

  const filterItems: MenuItem[] = [
    { label: 'Abrir panel de filtros', icon: <Palette size={15} />, onClick: () => setPanel('filters') },
    { separator: true, label: '' },
    ...FILTERS.filter((f) => f.id !== 'original').map((f) => ({
      label: `Aplicar ${f.name}`,
      onClick: () => {
        if (applyAdjustmentsToActive(f.adjustments)) toast.success(`Filtro ${f.name} aplicado`);
        else toast.warning('Selecciona una capa de imagen');
      },
    })),
  ];

  const viewItems: MenuItem[] = [
    { label: 'Ajustar a pantalla', icon: <Maximize size={15} />, onClick: fit },
    { separator: true, label: '' },
    { label: '25%', onClick: () => setViewport({ scale: 0.25 }) },
    { label: '50%', onClick: () => setViewport({ scale: 0.5 }) },
    { label: '100%', onClick: () => setViewport({ scale: 1 }) },
    { label: '200%', onClick: () => setViewport({ scale: 2 }) },
    { label: '400%', onClick: () => setViewport({ scale: 4 }) },
    { separator: true, label: '' },
    { label: 'Zoom +', shortcut: 'Ctrl+rueda', onClick: () => setViewport({ scale: Math.min(16, viewport.scale * 1.25) }) },
    { label: 'Zoom −', onClick: () => setViewport({ scale: Math.max(0.05, viewport.scale / 1.25) }) },
  ];

  const zoomItems: MenuItem[] = [
    { label: 'Ajustar a pantalla', icon: <Maximize size={15} />, onClick: fit },
    { separator: true, label: '' },
    { label: '25%', onClick: () => setViewport({ scale: 0.25 }) },
    { label: '50%', onClick: () => setViewport({ scale: 0.5 }) },
    { label: '100%', onClick: () => setViewport({ scale: 1 }) },
    { label: '200%', onClick: () => setViewport({ scale: 2 }) },
    { label: '400%', onClick: () => setViewport({ scale: 4 }) },
  ];

  const empty = layers.length === 0;

  return (
    <div className="editor" style={{ flex: 1, minHeight: 0 }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.avif"
        hidden
        onChange={(e) => {
          if (e.target.files?.length) loadFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="editor-menubar">
        {[
          { label: 'Archivo', items: fileItems },
          { label: 'Editar', items: editItems },
          { label: 'Imagen', items: imageItems },
          { label: 'Capa', items: layerItems },
          { label: 'Filtro', items: filterItems },
          { label: 'Vista', items: viewItems },
        ].map((menu) => (
          <Menu
            key={menu.label}
            items={menu.items}
            trigger={({ onClick }) => (
              <button type="button" className="menu-btn" onClick={onClick}>{menu.label}</button>
            )}
          />
        ))}
        {!empty && (
          <input
            className="input"
            style={{ marginLeft: 8, maxWidth: 200, height: 28 }}
            value={doc.name}
            onChange={(e) => setDocName(e.target.value)}
            aria-label="Nombre del documento"
          />
        )}
        <div style={{ marginLeft: 'auto' }} className="row gap-2">
          {!empty && (
            <button
              type="button"
              className="btn btn-ghost btn-sm panels-toggle"
              onClick={() => setMobilePanels(true)}
            >
              <PanelRight size={15} /> Paneles
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={saveProjectLocal} disabled={empty}>
            Guardar
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setExportOpen(true)} disabled={empty}>
            Exportar
          </button>
        </div>
      </div>

      <div className="editor-main">
        <Toolbar />

        {empty ? (
          <div className="editor-stage center">
            <div style={{ maxWidth: 480, width: '100%', padding: 24 }}>
              <FileDropzone onFiles={loadFiles} className="dropzone">
                <div className="dropzone-ico"><Upload size={26} /></div>
                <h2 className="h3" style={{ marginBottom: 6 }}>Abre una imagen</h2>
                <p className="muted">Arrastra y suelta o haz clic para empezar a editar con capas.</p>
              </FileDropzone>
              <div style={{ marginTop: 16 }}>
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  {[{ w: 1920, h: 1080 }, { w: 1080, h: 1080 }, { w: 1200, h: 800 }].map((s) => (
                    <button key={`${s.w}x${s.h}`} type="button" className="btn btn-ghost btn-sm" onClick={() => initDocument(s.w, s.h, 'Sin título', createCanvas(s.w, s.h))}>
                      <FilePlus2 size={14} /> {s.w}×{s.h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EditorCanvas />
        )}

        <div className="editor-panels">
          <div className="panel-tabs">
            <Tabs
              value={panel}
              onChange={(v) => setPanel(v)}
              tabs={[
                { value: 'layers', label: 'Capas', icon: <LayersIcon size={14} /> },
                { value: 'props', label: 'Propiedades', icon: <Settings2 size={14} /> },
                { value: 'adjust', label: 'Ajustes', icon: <SlidersHorizontal size={14} /> },
                { value: 'filters', label: 'Filtros', icon: <Palette size={14} /> },
              ]}
            />
          </div>
          <div className="panel-body">
            {panel === 'layers' && <LayersPanel />}
            {panel === 'props' && <PropertiesPanel />}
            {panel === 'adjust' && <AdjustPanelPro />}
            {panel === 'filters' && <FiltersPanelPro />}
          </div>
        </div>
      </div>

      <div className="editor-statusbar">
        <span className="status-item">
          <button type="button" className="icon-btn icon-btn-sm" onClick={() => setViewport({ scale: Math.max(0.05, viewport.scale / 1.25) })} aria-label="Alejar"><ZoomOut size={14} /></button>
          <Menu
            direction="up"
            items={zoomItems}
            trigger={({ onClick }) => (
              <button type="button" className="zoom-preset-btn mono" onClick={onClick} aria-label="Nivel de zoom">
                {Math.round(viewport.scale * 100)}% <ChevronDown size={12} />
              </button>
            )}
          />
          <button type="button" className="icon-btn icon-btn-sm" onClick={() => setViewport({ scale: Math.min(16, viewport.scale * 1.25) })} aria-label="Acercar"><ZoomIn size={14} /></button>
          <button type="button" className="icon-btn icon-btn-sm" onClick={fit} aria-label="Ajustar a pantalla"><Maximize size={14} /></button>
        </span>
        <span className="status-item mono">{doc.width} × {doc.height}px</span>
        <span className="status-item">{layers.length} capa{layers.length === 1 ? '' : 's'}</span>
        <span className="status-item">
          {TOOL_DEFS.find((t) => t.id === tool)?.label}
        </span>
        <span className="status-item" style={{ marginLeft: 'auto' }}>Gestos: Espacio + arrastrar · Ctrl + rueda = zoom</span>
      </div>

      <Drawer
        open={mobilePanels && isCompact}
        onClose={() => setMobilePanels(false)}
        title="Paneles"
        side="right"
      >
        <div className="panel-tabs" style={{ marginBottom: 16 }}>
          <Tabs
            value={panel}
            onChange={(v) => setPanel(v)}
            tabs={[
              { value: 'layers', label: 'Capas', icon: <LayersIcon size={14} /> },
              { value: 'props', label: 'Propiedades', icon: <Settings2 size={14} /> },
              { value: 'adjust', label: 'Ajustes', icon: <SlidersHorizontal size={14} /> },
              { value: 'filters', label: 'Filtros', icon: <Palette size={14} /> },
            ]}
          />
        </div>
        <div className="col gap-4">
          {panel === 'layers' && <LayersPanel />}
          {panel === 'props' && <PropertiesPanel />}
          {panel === 'adjust' && <AdjustPanelPro />}
          {panel === 'filters' && <FiltersPanelPro />}
        </div>
      </Drawer>

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
