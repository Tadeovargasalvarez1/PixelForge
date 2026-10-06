import { get, set, del, keys, createStore } from 'idb-keyval';
import type { ProjectMeta } from '../types';

const store = createStore('pixelforge', 'projects');
const KEY_PREFIX = 'project:';

interface StoredProject {
  meta: ProjectMeta;
  preview: string;
  original?: string;
}

export async function saveProject(project: StoredProject): Promise<void> {
  try {
    await set(KEY_PREFIX + project.meta.id, project, store);
  } catch (error) {
    console.error('No se pudo guardar el proyecto', error);
    throw error;
  }
}

export async function listProjects(): Promise<ProjectMeta[]> {
  try {
    const all = await keys(store);
    const metas: ProjectMeta[] = [];
    for (const key of all) {
      if (typeof key === 'string' && key.startsWith(KEY_PREFIX)) {
        const value = (await get(key, store)) as StoredProject | undefined;
        if (value?.meta) metas.push(value.meta);
      }
    }
    return metas.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('No se pudieron listar los proyectos', error);
    return [];
  }
}

export async function getProject(id: string): Promise<StoredProject | undefined> {
  return get(KEY_PREFIX + id, store) as Promise<StoredProject | undefined>;
}

export async function deleteProject(id: string): Promise<void> {
  await del(KEY_PREFIX + id, store);
}

export const THEME_KEY = 'pixelforge:theme';
export const SETTINGS_KEY = 'pixelforge:settings';

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
