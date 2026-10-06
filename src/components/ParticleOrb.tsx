import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  z: number;
  pink: boolean;
}

/**
 * Esfera de partículas bioluminiscente (elemento signature de Auros).
 * Primitiva generada por código: puntos sobre una esfera que rota, en
 * teal-cyan y mist con unos pocos acentos lavanda.
 */
export function ParticleOrb({ density = 620 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = density;
    const points: Point[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const phi = Math.acos(1 - 2 * t);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      points.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        pink: i % 14 === 0,
      });
    }

    let raf = 0;
    let angle = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.42;
      ctx.clearRect(0, 0, w, h);

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (const p of points) {
        const rx = p.x * cos - p.z * sin;
        const rz = p.x * sin + p.z * cos;
        const persp = 1 / (2.2 - rz);
        const px = cx + rx * radius * persp * 1.6;
        const py = cy + p.y * radius * persp * 1.6;
        const size = Math.max(0.5, persp * 3.6);
        const alpha = Math.min(1, persp * 1.6);
        ctx.fillStyle = p.pink
          ? `rgba(253, 233, 255, ${alpha})`
          : `rgba(203, 255, 252, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      angle += 0.0022;
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const onResize = () => {
      resize();
      if (reduce) draw();
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [density]);

  return <canvas ref={canvasRef} className="orb-canvas" aria-hidden="true" />;
}
