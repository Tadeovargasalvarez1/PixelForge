import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  Palette,
  Crop as CropIcon,
  Scaling,
  RotateCw,
  FileDown,
  FileImage,
  Undo2,
  Redo2,
  Layers,
  ImagePlus,
  Save,
  Eye,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import { useImageStore } from '../store/imageStore';
import { useEditor } from '../store/editorStore';
import { useQuickPreview } from '../hooks/useQuickPreview';
import { useImageLoader } from '../hooks/useImageLoader';
import { FileDropzone } from '../components/FileDropzone';
import { CropOverlay, type NormRect } from '../components/CropOverlay';
import { BeforeAfter } from '../components/ui/BeforeAfter';
import { AdjustPanel } from '../features/quick/panels/AdjustPanel';
import { FiltersPanel } from '../features/quick/panels/FiltersPanel';
import { CropPanel } from '../features/quick/panels/CropPanel';
import { ResizePanel } from '../features/quick/panels/ResizePanel';
import { TransformPanel } from '../features/quick/panels/TransformPanel';
import { ExportPanel } from '../features/quick/panels/ExportPanel';
import { outputSize, renderQuickFull } from '../features/quick/renderQuick';
import { supportsWebp } from '../services/imageService';
import { saveProject } from '../services/storage';
import { toast } from '../store/toastStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const TABS = [
  { id: 'adjust', label: 'Ajustar', icon: SlidersHorizontal },
  { id: 'filters', label: 'Filtros', icon: Palette },
  { id: 'crop', label: 'Recortar', icon: CropIcon },
  { id: 'resize', label: 'Tamaño', icon: Scaling },
  { id: 'transform', label: 'Girar', icon: RotateCw },
  { id: 'compress', label: 'Comprimir', icon: FileDown },
  { id: 'convert', label: 'Convertir', icon: FileImage },
] as const;

type TabId = (typeof TABS)[number]['id'];

function CanvasHost({ canvas, className }: { canvas: HTMLCanvasElement | null; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.replaceChildren();
    if (canvas) {
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.display = 'block';
      host.appendChild(canvas);
    }
  }, [canvas]);
  return <div ref={ref} className={className} />;
}

export function Studio() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const image = useImageStore((s) => s.image);
  const setImage = useImageStore((s) => s.setImage);
  const rotation = useImageStore((s) => s.rotation);
  const crop = useImageStore((s) => s.crop);
  const setCrop = useImageStore((s) => s.setCrop);
  const undo = useImageStore((s) => s.undo);
  const redo = useImageStore((s) => s.redo);
  const canUndo = useImageStore((s) => s.past.length > 0);
  const canRedo = useImageStore((s) => s.future.length > 0);

  const initialTab = (params.get('tool') as TabId) || 'adjust';
  const [tab, setTab] = useState<TabId>(TABS.some((t) => t.id === initialTab) ? initialTab : 'adjust');
  const [compare, setCompare] = useState(false);
  const [cropRatio, setCropRatio] = useState(0);
  const [cropRect, setCropRect] = useState<NormRect>({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });

  const { canvas, outputWidth, outputHeight, processing } = useQuickPreview(1600, tab === 'crop');
  const { loadFiles } = useImageLoader({ onLoad: setImage });

  const baseSize = useMemo(() => {
    if (!image) return { width: 0, height: 0 };
    return outputSize(image, rotation, false, false, null, null);
  }, [image, rotation]);

  useEffect(() => {
    const tool = params.get('tool');
    if (tool && TABS.some((t) => t.id === tool)) setTab(tool as TabId);
  }, [params]);

  useEffect(() => {
    if (tab !== 'crop' || !image) return;
    if (crop) {
      setCropRect({
        x: crop.x / baseSize.width,
        y: crop.y / baseSize.height,
        w: crop.width / baseSize.width,
        h: crop.height / baseSize.height,
      });
    } else {
      setCropRect({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const selectTab = (id: TabId) => {
    setTab(id);
    setParams({ tool: id }, { replace: true });
  };

  const applyCrop = () => {
    setCrop({
      x: Math.round(cropRect.x * baseSize.width),
      y: Math.round(cropRect.y * baseSize.height),
      width: Math.round(cropRect.w * baseSize.width),
      height: Math.round(cropRect.h * baseSize.height),
    });
    toast.success('Recorte aplicado');
    selectTab('adjust');
  };

  const openPro = () => {
    if (!image) {
      navigate('/editor');
      return;
    }
    try {
      const s = useImageStore.getState();
      const full = renderQuickFull({
        image,
        adjustments: s.adjustments,
        rotation: s.rotation,
        flipH: s.flipH,
        flipV: s.flipV,
        crop: s.crop,
        resize: s.resize,
      });
      useEditor.getState().initDocument(full.width, full.height, image.name, full);
    } catch (error) {
      console.error(error);
    }
    navigate('/editor');
  };

  const changeRatio = (ratio: number) => {
    setCropRatio(ratio);
    if (ratio > 0) {
      let w = cropRect.w;
      let h = (w * baseSize.width) / ratio / baseSize.height;
      if (h > 1) {
        h = 1;
        w = (h * baseSize.height * ratio) / baseSize.width;
      }
      setCropRect({ x: Math.max(0, (1 - w) / 2), y: Math.max(0, (1 - h) / 2), w, h });
    }
  };

  const save = async () => {
    if (!image) return;
    try {
      const preview = canvas ? canvas.toDataURL('image/jpeg', 0.6) : image.url;
      const full = renderQuickFull({
        image,
        adjustments: useImageStore.getState().adjustments,
        rotation,
        flipH: useImageStore.getState().flipH,
        flipV: useImageStore.getState().flipV,
        crop,
        resize: useImageStore.getState().resize,
      });
      const data = supportsWebp()
        ? full.toDataURL('image/webp', 0.92)
        : full.toDataURL('image/jpeg', 0.92);
      await saveProject({
        meta: {
          id: image.id,
          name: image.name,
          width: full.width,
          height: full.height,
          thumbnail: preview,
          updatedAt: Date.now(),
          createdAt: Date.now(),
        },
        preview,
        original: data,
      });
      toast.success('Proyecto guardado', 'Encuéntralo en Proyectos.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar el proyecto');
    }
  };

  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onEscape: () => compare && setCompare(false),
  });

  if (!image) {
    return (
      <div className="page-scroll">
        <div className="container" style={{ paddingTop: 48, paddingBottom: 48, maxWidth: 720 }}>
          <FileDropzone onFiles={loadFiles} className="dropzone">
            <div className="dropzone-ico">
              <Upload size={28} />
            </div>
            <h2 className="h3" style={{ marginBottom: 6 }}>Sube una imagen para empezar</h2>
            <p className="muted">Arrastra y suelta aquí, o haz clic para seleccionar.</p>
            <p className="dim" style={{ fontSize: '0.8rem', marginTop: 10 }}>
              PNG · JPG · WEBP · GIF · BMP · SVG · AVIF
            </p>
          </FileDropzone>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={openPro}>
              <Layers size={16} /> Ir al Editor Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="workspace" style={{ flex: 1, minHeight: 0 }}>
        <div className="workspace-canvas">
          <div className="row gap-2" style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
              <ArrowLeft size={15} /> Inicio
            </button>
          </div>
          <div className="row gap-2" style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
            <button type="button" className="icon-btn" onClick={undo} disabled={!canUndo} aria-label="Deshacer">
              <Undo2 size={18} />
            </button>
            <button type="button" className="icon-btn" onClick={redo} disabled={!canRedo} aria-label="Rehacer">
              <Redo2 size={18} />
            </button>
            <button
              type="button"
              className={`icon-btn ${compare ? 'active' : ''}`}
              onClick={() => setCompare((v) => !v)}
              aria-label="Comparar antes y después"
            >
              <Eye size={18} />
            </button>
          </div>

          {compare ? (
            <div style={{ width: '100%', height: '100%', padding: 24 }}>
              <BeforeAfter before={image.url} after={canvas ? canvas.toDataURL('image/jpeg', 0.85) : image.url} />
            </div>
          ) : (
            <div
              className="checker"
              style={{
                position: 'relative',
                display: 'inline-block',
                maxWidth: '100%',
                maxHeight: '100%',
                lineHeight: 0,
                borderRadius: 8,
                boxShadow: 'var(--shadow)',
              }}
            >
              <CanvasHost canvas={canvas} />
              {tab === 'crop' && (
                <CropOverlay value={cropRect} ratio={cropRatio} onChange={setCropRect} />
              )}
              {processing && (
                <div className="busy-overlay" style={{ borderRadius: 8 }}>
                  <span className="spinner" />
                  <span className="muted" style={{ fontSize: '0.82rem' }}>Procesando…</span>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="workspace-side">
          <div className="side-head">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="row gap-2" style={{ minWidth: 0 }}>
                <ImagePlus size={16} className="dim" />
                <span className="truncate" style={{ fontWeight: 600, maxWidth: 150 }}>{image.name}</span>
              </div>
              <span className="badge">{outputWidth} × {outputHeight}</span>
            </div>
            <div className="row gap-2">
              <FileDropzone onFiles={loadFiles} className="btn btn-ghost btn-sm grow">
                Cambiar imagen
              </FileDropzone>
              <button type="button" className="btn btn-ghost btn-sm" onClick={save} aria-label="Guardar proyecto">
                <Save size={14} />
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={openPro} aria-label="Abrir Editor Pro">
                <Layers size={14} />
              </button>
            </div>
          </div>

          <div style={{ padding: '10px 16px 0' }}>
            <div className="row" style={{ flexWrap: 'wrap', gap: 4 }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => selectTab(t.id)}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="side-body" style={{ paddingTop: 14 }}>
            {tab === 'adjust' && <AdjustPanel />}
            {tab === 'filters' && <FiltersPanel />}
            {tab === 'crop' && (
              <CropPanel
                rect={cropRect}
                onRect={setCropRect}
                ratio={cropRatio}
                onRatio={changeRatio}
                baseSize={baseSize}
                onApply={applyCrop}
                onReset={() => {
                  setCrop(null);
                  toast.info('Recorte cancelado');
                  selectTab('adjust');
                }}
              />
            )}
            {tab === 'resize' && <ResizePanel />}
            {tab === 'transform' && <TransformPanel />}
            {(tab === 'compress' || tab === 'convert') && <ExportPanel mode={tab === 'compress' ? 'compress' : 'export'} />}
          </div>
        </aside>
      </div>
    </div>
  );
}
