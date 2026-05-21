import { describe, expect, it } from 'vitest';
import { resolveProviderChoice } from './provider';

describe('resolveProviderChoice', () => {
  it('returns none when no keys + no LLM_PROVIDER', () => {
    expect(resolveProviderChoice({})).toEqual({ kind: 'none' });
  });

  it('auto-prefers anthropic when both keys present', () => {
    expect(resolveProviderChoice({ ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'b' })).toEqual({
      kind: 'auto',
      name: 'anthropic',
    });
  });

  it('falls back to openai when only OPENAI_API_KEY set', () => {
    expect(resolveProviderChoice({ OPENAI_API_KEY: 'b' })).toEqual({
      kind: 'auto',
      name: 'openai',
    });
  });

  it('respects explicit LLM_PROVIDER=openai', () => {
    expect(
      resolveProviderChoice({
        LLM_PROVIDER: 'openai',
        ANTHROPIC_API_KEY: 'a',
        OPENAI_API_KEY: 'b',
      }),
    ).toEqual({ kind: 'explicit', name: 'openai' });
  });

  it('respects explicit LLM_PROVIDER=anthropic', () => {
    expect(
      resolveProviderChoice({
        LLM_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'a',
        OPENAI_API_KEY: 'b',
      }),
    ).toEqual({ kind: 'explicit', name: 'anthropic' });
  });

  it('treats LLM_PROVIDER=auto same as unset (prefer anthropic)', () => {
    expect(resolveProviderChoice({ LLM_PROVIDER: 'auto', ANTHROPIC_API_KEY: 'a' })).toEqual({
      kind: 'auto',
      name: 'anthropic',
    });
  });

  it('flags unknown LLM_PROVIDER values', () => {
    expect(resolveProviderChoice({ LLM_PROVIDER: 'claude', OPENAI_API_KEY: 'b' })).toEqual({
      kind: 'invalid',
      raw: 'claude',
    });
  });

  it('is case-insensitive on LLM_PROVIDER', () => {
    expect(resolveProviderChoice({ LLM_PROVIDER: 'OpenAI', OPENAI_API_KEY: 'b' })).toEqual({
      kind: 'explicit',
      name: 'openai',
    });
  });
});
