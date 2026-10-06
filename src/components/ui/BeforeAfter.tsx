import { useCallback, useEffect, useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface BeforeAfterProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfter({ before, after, beforeLabel = 'ANTES', afterLabel = 'DESPUÉS' }: BeforeAfterProps) {
  const [position, setPosition] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => dragging.current && update(e.clientX);
    const up = () => (dragging.current = false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [update]);

  return (
    <div
      className="before-after checker"
      ref={ref}
      onPointerDown={(e) => {
        dragging.current = true;
        update(e.clientX);
      }}
    >
      <img src={after} alt={afterLabel} draggable={false} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={before} alt={beforeLabel} draggable={false} />
      </div>
      <span className="ba-label left">{beforeLabel}</span>
      <span className="ba-label right">{afterLabel}</span>
      <div className="ba-handle" style={{ left: `${position}%` }}>
        <div className="ba-knob">
          <MoveHorizontal size={16} />
        </div>
      </div>
    </div>
  );
}
