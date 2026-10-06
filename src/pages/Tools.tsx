import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import { CATEGORY_LABELS, TOOLS, type ToolCategory } from '../features/toolsCatalog';

const ORDER: ToolCategory[] = ['basicas', 'ajustes', 'export'];

export function Tools() {
  const navigate = useNavigate();

  return (
    <div className="page-scroll">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="section-head">
          <h1 className="h1" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
            Herramientas
          </h1>
          <p className="muted">Cada tarjeta abre el estudio con la herramienta lista para usar.</p>
        </div>

        <div
          className="card card-hover tool-card"
          style={{ padding: 20, marginBottom: 32, alignItems: 'center' }}
          onClick={() => navigate('/editor')}
          role="button"
        >
          <span className="tool-ico" style={{ background: 'var(--brand-gradient)', color: '#fff' }}>
            <Layers size={22} />
          </span>
          <span className="grow">
            <span className="tool-name">Editor Pro</span>
            <span className="tool-desc">Capas, pincel, texto, formas y edición avanzada</span>
          </span>
          <ArrowRight size={18} className="dim" />
        </div>

        {ORDER.map((category) => (
          <section key={category} style={{ marginBottom: 40 }}>
            <h2 className="h3" style={{ marginBottom: 14 }}>
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="tool-grid">
              {TOOLS.filter((t) => t.category === category).map((tool, i) => (
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
          </section>
        ))}
      </div>
    </div>
  );
}
