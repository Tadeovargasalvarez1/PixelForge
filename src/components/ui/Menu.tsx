import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface MenuProps {
  trigger: (props: { onClick: () => void; open: boolean }) => ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
  direction?: 'down' | 'up';
}

export function Menu({ trigger, items, align = 'left', direction = 'down' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="tooltip-anchor" ref={ref} style={{ position: 'relative' }}>
      {trigger({ onClick: () => setOpen((v) => !v), open })}
      {open && (
        <div
          className="dropdown"
          style={
            direction === 'up'
              ? { bottom: 'calc(100% + 6px)', ...(align === 'right' ? { right: 0 } : { left: 0 }) }
              : { top: 'calc(100% + 6px)', ...(align === 'right' ? { right: 0 } : { left: 0 }) }
          }
        >
          {items.map((item, i) =>
            item.separator ? (
              <div key={i} className="dropdown-sep" />
            ) : (
              <button
                key={i}
                type="button"
                className={`dropdown-item ${item.danger ? 'danger' : ''}`}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.icon}
                <span className="grow">{item.label}</span>
                {item.shortcut && <kbd>{item.shortcut}</kbd>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
