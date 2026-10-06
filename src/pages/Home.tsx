import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Layers,
  ShieldCheck,
  Zap,
  Cpu,
  WifiOff,
  Github,
  ArrowRight,
  Sparkles,
  Lock,
  SlidersHorizontal,
  FileDown,
  FileImage,
  Scaling,
  Crop,
  Palette,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { id: 'edit', name: 'Editar', desc: 'Ajustes y filtros', icon: SlidersHorizontal, to: '/studio?tool=adjust' },
  { id: 'compress', name: 'Comprimir', desc: 'Menos peso', icon: FileDown, to: '/studio?tool=compress' },
  { id: 'convert', name: 'Convertir', desc: 'PNG · JPG · WEBP', icon: FileImage, to: '/studio?tool=convert' },
  { id: 'resize', name: 'Redimensionar', desc: 'Tamaños y presets', icon: Scaling, to: '/studio?tool=resize' },
  { id: 'crop', name: 'Recortar', desc: 'Proporciones', icon: Crop, to: '/studio?tool=crop' },
  { id: 'filters', name: 'Filtros', desc: '16 looks', icon: Palette, to: '/studio?tool=filters' },
  { id: 'pro', name: 'Editor Pro', desc: 'Capas y dibujo', icon: Layers, to: '/editor' },
];
import { useImageLoader } from '../hooks/useImageLoader';
import { useImageStore } from '../store/imageStore';
import { FileDropzone } from '../components/FileDropzone';
import { ParticleOrb } from '../components/ParticleOrb';
import { TOOLS } from '../features/toolsCatalog';

export function Home() {
  const navigate = useNavigate();
  const setImage = useImageStore((s) => s.setImage);

  const { loadFiles, loading } = useImageLoader({
    onLoad: (image) => {
      setImage(image);
      navigate('/studio');
    },
  });

  const quickTools = TOOLS.filter((t) =>
    ['crop', 'resize', 'compress', 'convert', 'filters', 'rotate', 'flip'].includes(t.id),
  );

  return (
    <div className="page-scroll">
      <section className="hero">
        <div className="hero-glow" />
        <ParticleOrb />
        <div className="hero-vignette" />
        <div className="container">
          <div className="badge badge-accent animate-in" style={{ marginBottom: 20 }}>
            <Sparkles size={13} /> 100% en tu navegador · Sin subir archivos
          </div>
          <h1 className="h1 animate-in delay-1">
            Edita imágenes. <span className="gradient-text">Sin complicaciones.</span>
          </h1>
          <p className="lead animate-in delay-2">
            Potentes herramientas de edición directamente en tu dispositivo. Rápido para tareas
            simples, potente cuando necesitas más.
          </p>
          <div className="hero-cta animate-in delay-3">
            <FileDropzone onFiles={loadFiles} className="btn btn-gradient btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : <Upload size={18} />}
              {loading ? 'Procesando…' : 'Subir imagen'}
            </FileDropzone>
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate('/editor')}>
              <Layers size={18} /> Abrir Editor Pro
            </button>
          </div>
          <div className="hero-note animate-in delay-4">
            <Lock size={13} /> Tus imágenes se procesan directamente en tu dispositivo.
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">¿Qué quieres hacer?</h2>
            <p className="muted">Elige una acción y empieza en segundos.</p>
          </div>
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={action.id}
                type="button"
                className={`card card-hover quick-action animate-in delay-${(i % 4) + 1}`}
                onClick={() => navigate(action.to)}
              >
                <span className="tool-ico">
                  <action.icon size={20} />
                </span>
                <span className="tool-name">{action.name}</span>
                <span className="tool-desc">{action.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Herramientas rápidas</h2>
            <p className="muted">Haz el trabajo en segundos. Sin registro, sin esperas.</p>
          </div>
          <div className="tool-grid">
            {quickTools.map((tool, i) => (
              <button
                key={tool.id}
                type="button"
                className={`card card-hover tool-card animate-in delay-${(i % 4) + 1}`}
                onClick={() => navigate(`/studio?tool=${tool.studioTab}`)}
              >
                <span className="tool-ico">
                  <tool.icon size={20} />
                </span>
                <span>
                  <span className="tool-name">{tool.name}</span>
                  <span className="tool-desc">{tool.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', alignItems: 'center' }}>
              <div style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
                <div className="badge" style={{ marginBottom: 14 }}>
                  <Layers size={13} /> Editor Pro
                </div>
                <h2 className="h2" style={{ marginBottom: 10 }}>
                  Edición avanzada con capas
                </h2>
                <p className="muted" style={{ marginBottom: 20 }}>
                  Capas ilimitadas, pincel, borrador, texto, formas, cuentagotas, zoom y
                  deshacer/rehacer. Todo el control de un editor profesional.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/editor')}>
                  Abrir Editor Pro <ArrowRight size={16} />
                </button>
              </div>
              <div className="checker" style={{ minHeight: 260, padding: 28 }}>
                <div
                  className="panel"
                  style={{
                    padding: 20,
                    background: 'var(--surface)',
                    boxShadow: 'var(--shadow-lg)',
                    transform: 'rotate(-1.5deg)',
                  }}
                >
                  <div className="row gap-2" style={{ marginBottom: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--danger)' }} />
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--warning)' }} />
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--success)' }} />
                  </div>
                  <div className="col gap-2">
                    {['Capa 3 · Texto', 'Capa 2 · Forma', 'Fondo'].map((name, i) => (
                      <div key={i} className={`layer-item ${i === 0 ? 'active' : ''}`}>
                        <div className="layer-thumb" />
                        <div className="layer-meta">
                          <div className="layer-name">{name}</div>
                          <div className="layer-sub">Normal · 100%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="privacy-band">
            <ShieldCheck size={40} style={{ color: 'var(--success)', flex: '0 0 auto' }} />
            <div className="grow">
              <h3 className="h3">Tu privacidad, primero</h3>
              <p className="muted">
                PixelForge procesa todo localmente en tu navegador. No subimos tus imágenes a
                ningún servidor, no usamos analíticas invasivas y no necesitas cuenta.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2 className="h2">¿Por qué PixelForge?</h2>
          </div>
          <div className="feature-grid">
            <div className="card feature">
              <div className="f-ico"><Zap size={20} /></div>
              <h3 className="h3">Rápido</h3>
              <p>Procesamiento por GPU y Canvas. Sin colas, sin servidores.</p>
            </div>
            <div className="card feature">
              <div className="f-ico"><Cpu size={20} /></div>
              <h3 className="h3">Potente</h3>
              <p>Capas, pincel, formas, texto y ajustes en tiempo real.</p>
            </div>
            <div className="card feature">
              <div className="f-ico"><WifiOff size={20} /></div>
              <h3 className="h3">Sin conexión</h3>
              <p>Instálalo como app y sigue editando aunque pierdas la conexión.</p>
            </div>
            <div className="card feature">
              <div className="f-ico"><Github size={20} /></div>
              <h3 className="h3">Gratis y abierto</h3>
              <p>Sin registro, sin marca de agua y sin límites artificiales.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="container" style={{ padding: '32px 20px 48px' }}>
        <div className="divider" style={{ marginBottom: 20 }} />
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            PixelForge — Editor de imágenes online
          </span>
          <span className="dim" style={{ fontSize: '0.8rem' }}>
            Hecho con React, TypeScript y Canvas · Tus imágenes nunca salen de tu dispositivo.
          </span>
        </div>
      </footer>
    </div>
  );
}
