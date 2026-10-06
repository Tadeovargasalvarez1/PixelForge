import { useEffect, useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { useImageStore } from '../../../store/imageStore';
import { exportCanvas, downloadBlob, formatBytes, supportsWebp } from '../../../services/imageService';
import { renderQuickFull } from '../renderQuick';
import { toast } from '../../../store/toastStore';

interface ExportPanelProps {
  mode: 'export' | 'compress';
}

export function ExportPanel({ mode }: ExportPanelProps) {
  const image = useImageStore((s) => s.image);
  const adjustments = useImageStore((s) => s.adjustments);
  const rotation = useImageStore((s) => s.rotation);
  const flipH = useImageStore((s) => s.flipH);
  const flipV = useImageStore((s) => s.flipV);
  const crop = useImageStore((s) => s.crop);
  const resize = useImageStore((s) => s.resize);
  const format = useImageStore((s) => s.exportFormat);
  const setFormat = useImageStore((s) => s.setExportFormat);
  const quality = useImageStore((s) => s.quality);
  const setQuality = useImageStore((s) => s.setQuality);
  const filename = useImageStore((s) => s.filename);
  const setFilename = useImageStore((s) => s.setFilename);

  const [scale, setScale] = useState(1);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [busy, setBusy] = useState(false);

  const webp = supportsWebp();

  useEffect(() => {
    if (!image) return;
    setEstimating(true);
    const timer = setTimeout(async () => {
      try {
        const full = renderQuickFull({ image, adjustments, rotation, flipH, flipV, crop, resize });
        const result = await exportCanvas(full, { format, quality, scale, filename: 'est' });
        setEstimate(result.size);
      } catch (error) {
        console.error(error);
        setEstimate(null);
      } finally {
        setEstimating(false);
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [image, adjustments, rotation, flipH, flipV, crop, resize, format, quality, scale]);

  if (!image) return null;

  const exportNow = async () => {
    setBusy(true);
    try {
      const full = renderQuickFull({ image, adjustments, rotation, flipH, flipV, crop, resize });
      const result = await exportCanvas(full, { format, quality, scale, filename });
      downloadBlob(result.blob, result.filename);
      toast.success('Imagen exportada', `${result.filename} · ${formatBytes(result.size)}`);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo exportar', 'Prueba con otro formato o una imagen más pequeña.');
    } finally {
      setBusy(false);
    }
  };

  const originalSize = image.size;
  const savings = estimate !== null && originalSize ? Math.round((1 - estimate / originalSize) * 100) : null;

  return (
    <>
      {mode === 'compress' && (
        <div className="panel-section">
          <span className="panel-section-title">Tamaño</span>
          <div className="row gap-3" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="dim" style={{ fontSize: '0.72rem' }}>Original</div>
              <div className="mono" style={{ fontWeight: 700 }}>{formatBytes(originalSize)}</div>
            </div>
            <div style={{ color: 'var(--accent)' }}>→</div>
            <div style={{ textAlign: 'right' }}>
              <div className="dim" style={{ fontSize: '0.72rem' }}>Comprimida</div>
              <div className="mono" style={{ fontWeight: 700, color: 'var(--success)' }}>
                {estimating ? '…' : estimate !== null ? formatBytes(estimate) : '—'}
              </div>
            </div>
          </div>
          {savings !== null && savings > 0 && (
            <span className="badge badge-success">−{Math.min(99, savings)}% de peso</span>
          )}
        </div>
      )}

      <div className="panel-section">
        <span className="panel-section-title">Formato</span>
        <select className="select" value={format} onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg' | 'webp')} aria-label="Formato de salida">
          <option value="png">PNG · sin pérdida</option>
          <option value="jpeg">JPG · universal</option>
          <option value="webp" disabled={!webp}>WEBP · moderno{!webp ? ' (no soportado)' : ''}</option>
        </select>
      </div>

      {format !== 'png' && (
        <div className="panel-section">
          <span className="panel-section-title">Calidad · {Math.round(quality * 100)}</span>
          <input
            className="range"
            type="range"
            min={10}
            max={100}
            value={Math.round(quality * 100)}
            onChange={(e) => setQuality(Number(e.target.value) / 100)}
            aria-label="Calidad"
          />
        </div>
      )}

      <div className="panel-section">
        <span className="panel-section-title">Escala · {Math.round(scale * 100)}%</span>
        <input
          className="range"
          type="range"
          min={10}
          max={200}
          value={Math.round(scale * 100)}
          onChange={(e) => setScale(Number(e.target.value) / 100)}
          aria-label="Escala de salida"
        />
      </div>

      <label className="field">
        <span className="panel-section-title">Nombre del archivo</span>
        <input className="input" value={filename} onChange={(e) => setFilename(e.target.value)} aria-label="Nombre del archivo" />
      </label>

      <div className="panel" style={{ padding: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted" style={{ fontSize: '0.82rem' }}>Tamaño estimado</span>
          <span className="mono" style={{ fontWeight: 700 }}>
            {estimating ? 'Calculando…' : estimate !== null ? formatBytes(estimate) : '—'}
          </span>
        </div>
      </div>

      <button type="button" className="btn btn-gradient btn-lg" onClick={exportNow} disabled={busy}>
        {busy ? <span className="spinner" /> : mode === 'compress' ? <FileDown size={18} /> : <Download size={18} />}
        {busy ? 'Exportando…' : mode === 'compress' ? 'Comprimir y descargar' : 'Exportar imagen'}
      </button>
    </>
  );
}
