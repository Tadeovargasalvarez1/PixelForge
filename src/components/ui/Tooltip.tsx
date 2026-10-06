import { useState, type ReactNode } from 'react';

interface TooltipProps {
  label: ReactNode;
  shortcut?: string;
  position?: 'right' | 'top' | 'bottom';
  children: ReactNode;
  disabled?: boolean;
}

export function Tooltip({ label, shortcut, position = 'top', children, disabled }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="tooltip-anchor"
      onMouseEnter={() => !disabled && setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => !disabled && setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && !disabled && (
        <span className="tooltip" data-pos={position} role="tooltip">
          {label}
          {shortcut && <kbd>{shortcut}</kbd>}
        </span>
      )}
    </span>
  );
}
