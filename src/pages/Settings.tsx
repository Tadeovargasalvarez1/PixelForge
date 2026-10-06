import { useState } from 'react';
import { Monitor, Moon, Sun, Trash2, ShieldCheck, Keyboard, Info } from 'lucide-react';
import { useTheme } from '../store/themeStore';
import { listProjects, deleteProject } from '../services/storage';
import { toast } from '../store/toastStore';
import type { ThemeMode } from '../types';

const MODES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'system', label: 'Sistema', icon: Monitor },
];

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Ctrl + Z', action: 'Deshacer' },
  { keys: 'Ctrl + Shift + Z', action: 'Rehacer' },
  { keys: 'Ctrl + Y', action: 'Rehacer' },
  { keys: 'Ctrl + S', action: 'Guardar / Exportar' },
  { keys: 'Ctrl + O', action: 'Abrir imagen' },
  { keys: 'Ctrl + C', action: 'Copiar capa' },
  { keys: 'Ctrl + V', action: 'Pegar capa' },
  { keys: 'Delete', action: 'Eliminar capa seleccionada' },
  { keys: 'Esc', action: 'Cancelar herramienta' },
  { keys: 'Espacio + arrastrar', action: 'Mover vista (pan)' },
  { keys: 'Ctrl + rueda', action: 'Zoom' },
  { keys: '[ / ]', action: 'Tamaño del pincel' },
  { keys: 'V / C / B / E / T / Z', action: 'Mover, Recortar, Pincel, Borrador, Texto, Zoom' },
];

export function SettingsPage() {
  const mode = useTheme((s) => s.mode);
  const setMode = useTheme((s) => s.setMode);
  const [clearing, setClearing] = useState(false);

  const clearData = async () => {
    if (!window.confirm('¿Borrar todos los proyectos guardados en este dispositivo?')) return;
    setClearing(true);
    try {
      const projects = await listProjects();
      await Promise.all(projects.map((p) => deleteProject(p.id)));
      toast.success('Datos borrados', 'Se eliminaron los proyectos locales.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron borrar los datos');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="page-scroll">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 860 }}>
        <h1 className="h1" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: 6 }}>Ajustes</h1>
        <p className="muted" style={{ marginBottom: 32 }}>Personaliza PixelForge y consulta atajos.</p>

        <div className="panel" style={{ padding: 24, marginBottom: 20 }}>
          <h2 className="h3" style={{ marginBottom: 14 }}>Tema</h2>
          <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`card tool-card ${mode === m.id ? 'active' : ''}`}
                style={{
                  maxWidth: 200,
                  padding: 16,
                  borderColor: mode === m.id ? 'var(--accent)' : 'var(--border)',
                  boxShadow: mode === m.id ? '0 0 0 1px var(--accent)' : 'none',
                }}
                onClick={() => setMode(m.id)}
              >
                <span className="tool-ico"><m.icon size={20} /></span>
                <span className="tool-name">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel" style={{ padding: 24, marginBottom: 20 }}>
          <div className="row gap-2" style={{ marginBottom: 14 }}>
            <Keyboard size={18} className="dim" />
            <h2 className="h3">Atajos de teclado</h2>
          </div>
          <div className="kbd-list">
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="kbd-row">
                <span>{s.action}</span>
                <kbd>{s.keys}</kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ padding: 24, marginBottom: 20 }}>
          <div className="row gap-2" style={{ marginBottom: 10 }}>
            <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
            <h2 className="h3">Privacidad</h2>
          </div>
          <p className="muted">
            PixelForge funciona íntegramente en tu navegador. Tus imágenes se procesan en tu
            dispositivo y no se envían a ningún servidor. No hay cuentas, ni rastreo, ni subida
            automática de archivos.
          </p>
        </div>

        <div className="panel" style={{ padding: 24 }}>
          <div className="row gap-2" style={{ marginBottom: 10 }}>
            <Info size={18} className="dim" />
            <h2 className="h3">Almacenamiento</h2>
          </div>
          <p className="muted" style={{ marginBottom: 16 }}>
            Los proyectos se guardan localmente con IndexedDB. Puedes eliminar todo en cualquier
            momento.
          </p>
          <button type="button" className="btn btn-danger" onClick={clearData} disabled={clearing}>
            {clearing ? <span className="spinner" /> : <Trash2 size={16} />} Borrar todos los proyectos
          </button>
        </div>
      </div>
    </div>
  );
}
