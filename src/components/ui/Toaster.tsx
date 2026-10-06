import { Check, AlertTriangle, X, Info } from 'lucide-react';
import { useToast } from '../../store/toastStore';
import type { ToastType } from '../../types';

const ICONS: Record<ToastType, typeof Check> = {
  success: Check,
  warning: AlertTriangle,
  error: X,
  info: Info,
};

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div key={t.id} className={`toast ${t.type}`} role="status">
            <span className={`toast-icon ${t.type}`}>
              <Icon size={18} />
            </span>
            <div className="grow">
              <div className="toast-title">{t.title}</div>
              {t.description && <div className="toast-desc">{t.description}</div>}
            </div>
            <button type="button" className="icon-btn icon-btn-sm" onClick={() => dismiss(t.id)} aria-label="Cerrar">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
