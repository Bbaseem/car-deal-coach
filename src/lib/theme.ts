export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'car-deal-coach:theme:v1';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveTheme(theme: Theme, systemPrefersDark: boolean): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light';
  return theme;
}

export function applyThemeClass(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const THEME_INIT_SCRIPT = `
(function(){try{
  var k=${JSON.stringify(THEME_STORAGE_KEY)};
  var t=localStorage.getItem(k);
  if(t!=='light'&&t!=='dark'&&t!=='system') t='system';
  var sysDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  var dark=(t==='dark')||(t==='system'&&sysDark);
  var root=document.documentElement;
  if(dark) root.classList.add('dark'); else root.classList.remove('dark');
}catch(e){}})();
`.trim();
