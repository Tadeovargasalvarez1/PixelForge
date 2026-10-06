import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useEditor } from '../../store/editorStore';
import { exportCanvas, downloadBlob, formatBytes, supportsWebp } from '../../services/imageService';
import { toast } from '../../store/toastStore';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const doc = useEditor((s) => s.doc);
  const flatten = useEditor((s) => s.flatten);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(1);
  const [filename, setFilename] = useState(doc.name || 'imagen-editada');
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const webp = supportsWebp();

  useEffect(() => {
    if (!open) return;
    setEstimating(true);
    const timer = setTimeout(async () => {
      try {
        const result = await exportCanvas(flatten(), { format, quality, scale, filename: 'est' });
        setEstimate(result.size);
      } catch (error) {
        console.error(error);
        setEstimate(null);
      } finally {
        setEstimating(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [open, format, quality, scale, flatten]);

  const exportNow = async () => {
    setBusy(true);
    try {
      const canvas = flatten();
      const result = await exportCanvas(canvas, { format, quality, scale, filename: filename || 'imagen-editada' });
      downloadBlob(result.blob, result.filename);
      toast.success('Imagen exportada', `${result.filename} · ${formatBytes(result.size)}`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo exportar', 'Prueba con otro formato.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Exportar imagen"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={exportNow} disabled={busy}>
            {busy ? <span className="spinner" /> : <Download size={16} />} Exportar
          </button>
        </>
      }
    >
      <div className="col gap-4">
        <label className="field">
          <span className="panel-section-title">Formato</span>
          <select className="select" value={format} onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg' | 'webp')}>
            <option value="png">PNG · transparencia</option>
            <option value="jpeg">JPG · universal</option>
            <option value="webp" disabled={!webp}>WEBP {webp ? '· moderno' : '(no soportado)'}</option>
          </select>
        </label>
        {format !== 'png' && (
          <div className="panel-section">
            <span className="panel-section-title">Calidad · {Math.round(quality * 100)}</span>
            <input className="range" type="range" min={10} max={100} value={Math.round(quality * 100)} onChange={(e) => setQuality(Number(e.target.value) / 100)} />
          </div>
        )}
        <div className="panel-section">
          <span className="panel-section-title">Escala · {Math.round(scale * 100)}% · {Math.round(doc.width * scale)}×{Math.round(doc.height * scale)}</span>
          <input className="range" type="range" min={10} max={200} value={Math.round(scale * 100)} onChange={(e) => setScale(Number(e.target.value) / 100)} />
        </div>
        <label className="field">
          <span className="panel-section-title">Nombre</span>
          <input className="input" value={filename} onChange={(e) => setFilename(e.target.value)} />
        </label>
        <div className="panel" style={{ padding: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: '0.82rem' }}>Tamaño aproximado</span>
            <span className="mono" style={{ fontWeight: 700 }}>
              {estimating ? 'Calculando…' : estimate !== null ? formatBytes(estimate) : '—'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
