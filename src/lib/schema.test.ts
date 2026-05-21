import { describe, expect, it } from 'vitest';
import { coachOutputSchema } from './schema';

const validBase = {
  verdict: { headline: 'Verdict: deal is ~8% above target.', summary: 'Push to $42k OTD.' },
  lowConfidence: false,
  walkAwayAnchor: "I'd set myself at $42,000 OTD.",
  scriptLines: [
    { line: 'Could we get closer to the average of my comps?', reasoning: 'matches comp #2' },
  ],
  manipulationCallouts: [],
};

describe('coachOutputSchema', () => {
  it('accepts a valid full-confidence payload', () => {
    const r = coachOutputSchema.safeParse(validBase);
    expect(r.success).toBe(true);
  });

  it('accepts a low-confidence payload with noCompsCoaching', () => {
    const r = coachOutputSchema.safeParse({
      ...validBase,
      lowConfidence: true,
      lowConfidenceReason: 'No comps pasted.',
      noCompsCoaching: {
        stallScript: 'Let me check one thing on my phone.',
        searchUrls: [{ label: 'Cars.com', url: 'https://www.cars.com/' }],
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejects lowConfidence true without noCompsCoaching', () => {
    const r = coachOutputSchema.safeParse({ ...validBase, lowConfidence: true });
    expect(r.success).toBe(false);
  });

  it('rejects noCompsCoaching when lowConfidence is false', () => {
    const r = coachOutputSchema.safeParse({
      ...validBase,
      noCompsCoaching: {
        stallScript: 'x',
        searchUrls: [{ label: 'Cars.com', url: 'https://www.cars.com/' }],
      },
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty scriptLines', () => {
    const r = coachOutputSchema.safeParse({ ...validBase, scriptLines: [] });
    expect(r.success).toBe(false);
  });

  it('rejects bad search URLs', () => {
    const r = coachOutputSchema.safeParse({
      ...validBase,
      lowConfidence: true,
      noCompsCoaching: {
        stallScript: 'x',
        searchUrls: [{ label: 'Cars.com', url: 'not-a-url' }],
      },
    });
    expect(r.success).toBe(false);
  });
});
