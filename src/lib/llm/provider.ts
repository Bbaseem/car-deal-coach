import { createAnthropicProvider } from './anthropic';
import { createOpenAIProvider } from './openai';
import type { CoachingProvider, ProviderName } from './types';
import { ProviderConfigError } from './types';

export type ProviderResolution =
  | { kind: 'explicit'; name: ProviderName }
  | { kind: 'auto'; name: ProviderName }
  | { kind: 'invalid'; raw: string }
  | { kind: 'none' };

export function resolveProviderChoice(env: {
  LLM_PROVIDER?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
}): ProviderResolution {
  const raw = (env.LLM_PROVIDER ?? '').trim().toLowerCase();
  const hasAnthropic = !!env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!env.OPENAI_API_KEY;

  if (raw === 'anthropic' || raw === 'openai') {
    return { kind: 'explicit', name: raw };
  }
  if (raw && raw !== 'auto') {
    return { kind: 'invalid', raw };
  }
  if (hasAnthropic) return { kind: 'auto', name: 'anthropic' };
  if (hasOpenAI) return { kind: 'auto', name: 'openai' };
  return { kind: 'none' };
}

export function getProvider(): CoachingProvider {
  const resolution = resolveProviderChoice({
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });

  if (resolution.kind === 'invalid') {
    throw new ProviderConfigError(
      `Unknown LLM_PROVIDER "${resolution.raw}". Use "anthropic", "openai", or leave unset for auto-detect.`,
    );
  }
  if (resolution.kind === 'none') {
    throw new ProviderConfigError(
      'No LLM provider key set. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local (and optionally set LLM_PROVIDER).',
    );
  }

  if (resolution.name === 'openai') return createOpenAIProvider();
  return createAnthropicProvider();
}
