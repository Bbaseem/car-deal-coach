import type { NextRequest } from 'next/server';
import { buildUserContent } from '@/lib/buildPrompt';
import { getProvider } from '@/lib/llm/provider';
import type { PriorRound } from '@/lib/llm/types';
import { ProviderConfigError } from '@/lib/llm/types';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { coachOutputSchema } from '@/lib/schema';
import { SUBMIT_COACHING_TOOL, SYSTEM_PROMPT } from '@/lib/systemPrompt';
import type { ChatRequest, ChatStreamEvent, Round } from '@/lib/types';

export const runtime = 'nodejs';

const TOOL = {
  name: SUBMIT_COACHING_TOOL.name,
  description: SUBMIT_COACHING_TOOL.description,
  inputSchema: SUBMIT_COACHING_TOOL.input_schema as Record<string, unknown>,
};

function toPriorRounds(rounds: Round[]): PriorRound[] {
  return rounds
    .filter((r) => r.output != null)
    .map((r) => ({
      id: r.id,
      userMessage: buildUserContent({
        message: r.userMessage,
        context: r.context,
        priorRounds: [],
      }),
      toolInput: r.output as unknown,
    }));
}

function ndjsonResponse(): {
  response: Response;
  enqueue: (event: ChatStreamEvent) => void;
  close: () => void;
} {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
  });
  const enqueue = (event: ChatStreamEvent) => {
    if (!controllerRef) return;
    controllerRef.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
  };
  const close = () => {
    if (controllerRef) controllerRef.close();
  };
  const response = new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
  return { response, enqueue, close };
}

function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return jsonError('Invalid JSON body.', 400);
  }

  if (!body || typeof body.message !== 'string' || !body.message.trim()) {
    return jsonError('Message is required.', 400);
  }
  if (!body.context || !Array.isArray(body.context.comps)) {
    return jsonError('Context with comps[] is required.', 400);
  }

  const ip = getClientIp(request.headers);
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    const minutesToReset = Math.max(1, Math.ceil((rl.reset - Date.now()) / 60000));
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Rate limit hit (${minutesToReset} min until reset). Try again in a few minutes.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String((Math.max(60, rl.reset - Date.now()) / 1000) | 0),
        },
      },
    );
  }

  const provider = (() => {
    try {
      return { ok: true as const, value: getProvider() };
    } catch (e) {
      return { ok: false as const, error: e };
    }
  })();
  if (!provider.ok) {
    const status = provider.error instanceof ProviderConfigError ? 500 : 502;
    const msg =
      provider.error instanceof Error ? provider.error.message : 'LLM provider unavailable.';
    return jsonError(msg, status);
  }

  const { response, enqueue, close } = ndjsonResponse();
  const startedAt = Date.now();

  (async () => {
    try {
      enqueue({ type: 'status', text: 'Reading your offer…' });

      const result = await provider.value.stream({
        systemPrompt: SYSTEM_PROMPT,
        tool: TOOL,
        userMessage: buildUserContent(body),
        priorRounds: toPriorRounds(body.priorRounds ?? []),
        onStatus: (text) => enqueue({ type: 'status', text }),
        onProgress: (linesSoFar, bytesSoFar) =>
          enqueue({ type: 'progress', linesSoFar, bytesSoFar }),
      });

      const parsed = coachOutputSchema.safeParse(result.rawToolInput);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        const summary = first
          ? `${first.path.join('.') || 'root'}: ${first.message}`
          : 'unknown shape error';
        enqueue({
          type: 'error',
          message: `Model output failed validation (${summary}). Try regenerating.`,
        });
        close();
        return;
      }

      console.log('[chat]', {
        provider: provider.value.name,
        model: provider.value.model,
        durationMs: Date.now() - startedAt,
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        cache_creation_input_tokens: result.usage.cache_creation_input_tokens,
        cache_read_input_tokens: result.usage.cache_read_input_tokens,
      });

      enqueue({ type: 'final', output: parsed.data });
      close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'LLM request failed.';
      enqueue({ type: 'error', message: msg });
      close();
    }
  })();

  return response;
}
