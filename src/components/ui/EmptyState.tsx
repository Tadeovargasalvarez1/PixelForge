import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="dropzone-ico" style={{ margin: 0 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 650, color: 'var(--text)' }}>{title}</div>
        {description && <div style={{ fontSize: '0.85rem', marginTop: 4 }}>{description}</div>}
      </div>
      {action}
    </div>
  );
}
