import { describe, expect, it } from 'vitest';
import { buildUserContent } from './buildPrompt';

describe('buildUserContent', () => {
  it('includes the walk-away ceiling when set', () => {
    const out = buildUserContent({
      message: 'their offer is $43,500',
      context: { walkAwayOtd: 42000, dealText: '', comps: [] },
      priorRounds: [],
    });
    expect(out).toContain('Walk-away OTD ceiling (buyer pre-committed): $42,000.');
    expect(out).toContain('their offer is $43,500');
  });

  it('flags missing walk-away ceiling explicitly', () => {
    const out = buildUserContent({
      message: 'x',
      context: { walkAwayOtd: null, dealText: '', comps: [] },
      priorRounds: [],
    });
    expect(out).toContain('Walk-away OTD ceiling: NOT SET');
  });

  it('switches to no-comps fallback path when comps array is empty', () => {
    const out = buildUserContent({
      message: 'x',
      context: { walkAwayOtd: 1, dealText: '', comps: [] },
      priorRounds: [],
    });
    expect(out).toContain('Comparable listings pasted: NONE');
    expect(out).toContain('no-comps fallback');
  });

  it('numbers and trims pasted comps', () => {
    const out = buildUserContent({
      message: 'x',
      context: {
        walkAwayOtd: 1,
        dealText: '',
        comps: [
          { id: 'a', text: '  comp A  ' },
          { id: 'b', text: 'comp B' },
        ],
      },
      priorRounds: [],
    });
    expect(out).toContain('Comparable listings pasted (2):');
    expect(out).toContain('--- Comp #1 ---');
    expect(out).toContain('comp A');
    expect(out).not.toMatch(/Comp #1 ---\n  comp A/);
    expect(out).toContain('--- Comp #2 ---');
  });
});
