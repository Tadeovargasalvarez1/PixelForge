import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Trash2, Upload, Clock, Image as ImageIcon } from 'lucide-react';
import { listProjects, getProject, deleteProject } from '../services/storage';
import { loadImageFromDataUrl } from '../services/imageService';
import { useImageStore } from '../store/imageStore';
import { FileDropzone } from '../components/FileDropzone';
import { useImageLoader } from '../hooks/useImageLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../store/toastStore';
import type { ProjectMeta } from '../types';

export function Projects() {
  const navigate = useNavigate();
  const setImage = useImageStore((s) => s.setImage);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadFiles } = useImageLoader({ onLoad: (img) => { setImage(img); navigate('/studio'); } });

  const refresh = async () => {
    setLoading(true);
    setProjects(await listProjects());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const openProject = async (id: string) => {
    try {
      const stored = await getProject(id);
      if (!stored?.original) {
        toast.warning('Proyecto sin datos', 'Vuelve a subir la imagen original.');
        return;
      }
      const image = await loadImageFromDataUrl(stored.original, stored.meta.name);
      setImage(image);
      navigate('/studio');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo abrir el proyecto');
    }
  };

  const remove = async (id: string) => {
    await deleteProject(id);
    toast.info('Proyecto eliminado');
    refresh();
  };

  return (
    <div className="page-scroll">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 className="h1" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>Proyectos</h1>
            <p className="muted">Tus ediciones guardadas en este dispositivo. Nunca se suben a ningún servidor.</p>
          </div>
          <FileDropzone onFiles={loadFiles} className="btn btn-primary">
            <Upload size={16} /> Nueva imagen
          </FileDropzone>
        </div>

        {loading ? (
          <div className="center" style={{ padding: 60 }}><span className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon={<FolderOpen size={26} />}
              title="Aún no hay proyectos"
              description="Sube una imagen y pulsa Guardar para verla aquí."
            />
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => (
              <div key={p.id} className="card card-hover project-card">
                <img className="project-thumb" src={p.thumbnail} alt={p.name} loading="lazy" />
                <div className="project-info">
                  <div className="truncate" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                  <div className="row gap-1 dim" style={{ fontSize: '0.74rem', marginTop: 2 }}>
                    <ImageIcon size={11} /> {p.width}×{p.height}
                    <span style={{ marginLeft: 6 }}><Clock size={11} style={{ verticalAlign: -1 }} /> {new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="row gap-2" style={{ marginTop: 10 }}>
                    <button type="button" className="btn btn-primary btn-sm grow" onClick={() => openProject(p.id)}>
                      Abrir
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(p.id)} aria-label={`Eliminar ${p.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
