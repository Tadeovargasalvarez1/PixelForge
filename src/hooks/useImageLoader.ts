import { useCallback, useState } from 'react';
import type { LoadedImage } from '../types';
import {
  loadImageFile,
  MAX_FILE_BYTES,
  TooLargeError,
  UnsupportedImageError,
  formatBytes,
} from '../services/imageService';
import { toast } from '../store/toastStore';

interface LoaderOptions {
  onLoad: (image: LoadedImage) => void;
  silent?: boolean;
}

export function useImageLoader({ onLoad, silent }: LoaderOptions) {
  const [loading, setLoading] = useState(false);

  const loadFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const image = await loadImageFile(file);
        onLoad(image);
        if (!silent) toast.success('Imagen cargada', `${image.name} · ${image.width}×${image.height}`);
        return image;
      } catch (error) {
        console.error('[PixelForge] Error al cargar imagen:', error);
        if (error instanceof TooLargeError) {
          toast.error('Archivo demasiado grande', `El límite es ${formatBytes(MAX_FILE_BYTES)}.`);
        } else if (error instanceof UnsupportedImageError) {
          toast.error('Formato no compatible', 'Prueba con PNG, JPG, WEBP, GIF o BMP.');
        } else {
          toast.error('No se pudo procesar la imagen', 'Prueba con PNG, JPG o WEBP.');
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onLoad, silent],
  );

  const loadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(f.name));
      if (!list.length) {
        toast.warning('No se detectó ninguna imagen', 'Arrastra un archivo de imagen válido.');
        return;
      }
      await loadFile(list[0]);
    },
    [loadFile],
  );

  return { loadFile, loadFiles, loading };
}
