'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  applyThemeClass,
  isTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from '@/lib/theme';

function readStored(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setThemeState(stored);
    setResolved(resolveTheme(stored, systemPrefersDark()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setResolved(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    applyThemeClass(resolved);
  }, [resolved, hydrated]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setResolved(resolveTheme(next, systemPrefersDark()));
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return { theme, resolved, setTheme, hydrated };
}
