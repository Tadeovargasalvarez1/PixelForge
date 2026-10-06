import { create } from 'zustand';
import type { Toast, ToastType } from '../types';

interface ToastState {
  toasts: Toast[];
  push: (type: ToastType, title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (type, title, description) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, title, description }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) => useToast.getState().push('success', title, description),
  error: (title: string, description?: string) => useToast.getState().push('error', title, description),
  warning: (title: string, description?: string) => useToast.getState().push('warning', title, description),
  info: (title: string, description?: string) => useToast.getState().push('info', title, description),
};
