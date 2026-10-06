import { useEffect } from 'react';

export interface ShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onBrushSize?: (delta: number) => void;
  tools?: Record<string, () => void>;
  enabled?: boolean;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (handlers.enabled === false) return;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handlers.onRedo?.();
        else handlers.onUndo?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handlers.onOpen?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'c') {
        handlers.onCopy?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'v') {
        handlers.onPaste?.();
        return;
      }
      if (isTyping(e.target)) {
        if (e.key === 'Escape') handlers.onEscape?.();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handlers.onDelete?.();
        return;
      }
      if (e.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }
      if (e.key === '[') handlers.onBrushSize?.(-1);
      if (e.key === ']') handlers.onBrushSize?.(1);
      if (handlers.tools && !mod) {
        const key = e.key.toLowerCase();
        const handler = handlers.tools[key];
        if (handler) handler();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
