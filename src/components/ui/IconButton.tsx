import type { LucideIcon } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  tooltipPosition?: 'right' | 'top' | 'bottom';
  size?: number;
  onClick?: () => void;
  className?: string;
  ariaPressed?: boolean;
}

export function IconButton({
  icon: Icon,
  label,
  shortcut,
  active,
  disabled,
  tooltipPosition = 'top',
  size = 18,
  onClick,
  className = '',
  ariaPressed,
}: IconButtonProps) {
  return (
    <Tooltip label={label} shortcut={shortcut} position={tooltipPosition} disabled={disabled}>
      <button
        type="button"
        className={`icon-btn ${active ? 'active' : ''} ${className}`}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={ariaPressed ?? active}
      >
        <Icon size={size} strokeWidth={2} />
      </button>
    </Tooltip>
  );
}
