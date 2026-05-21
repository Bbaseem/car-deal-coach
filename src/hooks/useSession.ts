'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { emptySession, loadSession, saveSession } from '@/lib/storage';
import type { Comp, Round, Session } from '@/lib/types';

export function useSession() {
  const [session, setSession] = useState<Session>(emptySession);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveSession(session);
  }, [session, hydrated]);

  const setWalkAway = useCallback((value: number | null) => {
    setSession((s) => ({ ...s, walkAwayOtd: value }));
  }, []);

  const setComps = useCallback((comps: Comp[]) => {
    setSession((s) => ({ ...s, comps }));
  }, []);

  const appendRound = useCallback((round: Round) => {
    setSession((s) => ({ ...s, rounds: [...s.rounds, round] }));
  }, []);

  const updateRound = useCallback((id: string, patch: Partial<Round>) => {
    setSession((s) => ({
      ...s,
      rounds: s.rounds.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const reset = useCallback(() => {
    setSession(emptySession());
  }, []);

  return {
    session,
    hydrated,
    setWalkAway,
    setComps,
    appendRound,
    updateRound,
    reset,
  };
}
