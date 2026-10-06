import { create } from 'zustand';
import type { ThemeMode } from '../types';
import { readLocal, writeLocal, THEME_KEY } from '../services/storage';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
  cycle: () => void;
}

const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: light)') : null;

function resolve(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') return media?.matches ? 'light' : 'dark';
  return mode;
}

function apply(resolved: 'dark' | 'light') {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolved;
  }
}

const initialMode = readLocal<ThemeMode>(THEME_KEY, 'dark');
const initialResolved = resolve(initialMode);
apply(initialResolved);

export const useTheme = create<ThemeState>((set, get) => ({
  mode: initialMode,
  resolved: initialResolved,
  setMode: (mode) => {
    const resolved = resolve(mode);
    apply(resolved);
    writeLocal(THEME_KEY, mode);
    set({ mode, resolved });
  },
  cycle: () => {
    const order: ThemeMode[] = ['dark', 'light', 'system'];
    const next = order[(order.indexOf(get().mode) + 1) % order.length];
    get().setMode(next);
  },
}));

media?.addEventListener('change', () => {
  if (useTheme.getState().mode === 'system') {
    const resolved = resolve('system');
    apply(resolved);
    useTheme.setState({ resolved });
  }
});
