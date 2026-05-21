import type { Session } from './types';

const STORAGE_KEY = 'car-deal-coach:session:v1';

export function emptySession(): Session {
  return {
    version: 1,
    walkAwayOtd: null,
    comps: [],
    rounds: [],
  };
}

export function loadSession(): Session {
  if (typeof window === 'undefined') return emptySession();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as Session;
    if (parsed.version !== 1) return emptySession();
    return parsed;
  } catch {
    return emptySession();
  }
}

export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Quota exceeded or storage disabled — silently drop.
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
