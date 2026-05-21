import Anthropic from '@anthropic-ai/sdk';

export const DEFAULT_MODEL = 'claude-sonnet-4-5';

let cached: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Copy .env.local.example to .env.local and add your key.',
    );
  }
  if (!cached) {
    cached = new Anthropic({ apiKey });
  }
  return cached;
}

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
}
