import { useRef, useState, type ReactNode } from 'react';
import { ACCEPTED_TYPES } from '../services/imageService';

const ACCEPT_ATTR = ACCEPTED_TYPES.join(',') + ',.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.avif';

interface FileDropzoneProps {
  onFiles: (files: FileList) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FileDropzone({ onFiles, children, className = '', disabled }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);

  const open = () => !disabled && inputRef.current?.click();

  return (
    <div
      className={`${className} ${dragover ? 'dragover' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragover(true);
      }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragover(false);
        if (!disabled && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Subir imagen"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {children}
    </div>
  );
}
