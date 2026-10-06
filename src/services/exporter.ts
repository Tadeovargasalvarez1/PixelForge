/**
 * Codifica un canvas a Blob fuera del hilo principal usando un Web Worker +
 * OffscreenCanvas cuando el navegador lo soporta. Si algo no está disponible o
 * falla, devuelve `null` para que el llamador use el camino del hilo principal.
 * Esto mantiene la UI fluida al exportar imágenes grandes sin sacrificar
 * compatibilidad (Safari/Firefox antiguos siguen funcionando vía fallback).
 */
export async function encodeOffThread(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' | 'webp',
  quality: number,
): Promise<Blob | null> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null;
  try {
    const bitmap = await createImageBitmap(canvas);
    const worker = new Worker(new URL('./exportWorker.ts', import.meta.url), { type: 'module' });

    return await new Promise<Blob | null>((resolve) => {
      const finish = (result: Blob | null) => {
        worker.terminate();
        resolve(result);
      };
      const timer = setTimeout(() => finish(null), 25000);
      worker.onmessage = (event: MessageEvent<{ ok: boolean; blob?: Blob }>) => {
        clearTimeout(timer);
        finish(event.data.ok && event.data.blob ? event.data.blob : null);
      };
      worker.onerror = () => {
        clearTimeout(timer);
        finish(null);
      };
      worker.postMessage(
        { bitmap, format, quality, background: format === 'jpeg' ? '#ffffff' : null },
        [bitmap],
      );
    });
  } catch {
    return null;
  }
}
