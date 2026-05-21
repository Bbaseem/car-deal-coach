import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearSession, emptySession, loadSession, saveSession } from './storage';

const STORAGE_KEY = 'car-deal-coach:session:v1';

function clearStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
}

describe('storage', () => {
  beforeEach(() => {
    clearStorage();
  });

  afterEach(() => {
    clearStorage();
  });

  it('returns emptySession when nothing stored', () => {
    expect(loadSession()).toEqual(emptySession());
  });

  it('round-trips a session via save/load', () => {
    const session = {
      version: 1 as const,
      walkAwayOtd: 42000,
      comps: [{ id: 'c1', text: 'comp text' }],
      rounds: [],
    };
    saveSession(session);
    expect(loadSession()).toEqual(session);
  });

  it('ignores stored values from older schema versions', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, walkAwayOtd: 1, comps: [], rounds: [] }),
    );
    expect(loadSession()).toEqual(emptySession());
  });

  it('survives malformed JSON in storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSession()).toEqual(emptySession());
  });

  it('clearSession removes the key', () => {
    saveSession({ version: 1, walkAwayOtd: 1, comps: [], rounds: [] });
    clearSession();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
