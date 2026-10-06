interface EncodeRequest {
  bitmap: ImageBitmap;
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  background: string | null;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<EncodeRequest>) => {
  const { bitmap, format, quality, background } = event.data;
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const c = canvas.getContext('2d');
    if (!c) throw new Error('no-2d-context');
    if (background) {
      c.fillStyle = background;
      c.fillRect(0, 0, bitmap.width, bitmap.height);
    }
    c.drawImage(bitmap, 0, 0);
    const blob = await canvas.convertToBlob({ type: `image/${format}`, quality });
    bitmap.close();
    if (blob.type !== `image/${format}`) throw new Error('format-unsupported');
    ctx.postMessage({ ok: true, blob });
  } catch (error) {
    bitmap.close();
    ctx.postMessage({ ok: false, error: String(error) });
  }
};
