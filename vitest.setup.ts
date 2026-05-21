import '@testing-library/jest-dom/vitest';

// happy-dom 20 + Node 24 don't reliably expose window.localStorage.
// Provide a minimal in-memory polyfill so storage tests have a deterministic store.
function makeLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: makeLocalStorage(),
    configurable: true,
    writable: true,
  });
}
