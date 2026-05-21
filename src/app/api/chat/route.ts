import type { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, getModel } from '@/lib/anthropic';
import { coachOutputSchema } from '@/lib/schema';
import { SUBMIT_COACHING_TOOL, SYSTEM_PROMPT } from '@/lib/systemPrompt';
import type { ChatRequest, ChatStreamEvent, Round } from '@/lib/types';

export const runtime = 'nodejs';

function buildUserContent(req: ChatRequest): string {
  const lines: string[] = [];
  const walk = req.context.walkAwayOtd;
  lines.push(
    walk != null && !Number.isNaN(walk)
      ? `Walk-away OTD ceiling (buyer pre-committed): $${walk.toLocaleString()}.`
      : `Walk-away OTD ceiling: NOT SET. Note this in your verdict.`,
  );
  if (req.context.comps.length === 0) {
    lines.push('Comparable listings pasted: NONE. Use the no-comps fallback path.');
  } else {
    lines.push(`Comparable listings pasted (${req.context.comps.length}):`);
    req.context.comps.forEach((c, i) => {
      lines.push(`--- Comp #${i + 1} ---`);
      lines.push(c.text.trim());
    });
  }
  lines.push('--- Dealer offer / buyer message ---');
  lines.push(req.message.trim());
  return lines.join('\n');
}

function buildPriorMessages(rounds: Round[]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const r of rounds) {
    out.push({
      role: 'user',
      content: buildUserContent({
        message: r.userMessage,
        context: r.context,
        priorRounds: [],
      }),
    });
    if (r.output) {
      out.push({
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: `prior_${r.id}`,
            name: SUBMIT_COACHING_TOOL.name,
            input: r.output as unknown as Record<string, unknown>,
          },
        ],
      });
      out.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: `prior_${r.id}`,
            content: 'ok',
          },
        ],
      });
    }
  }
  return out;
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

  let client: Anthropic;
  try {
    client = getAnthropicClient();
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Anthropic client unavailable.', 500);
  }

  const messages: Anthropic.MessageParam[] = [
    ...buildPriorMessages(body.priorRounds ?? []),
    { role: 'user', content: buildUserContent(body) },
  ];

  const { response, enqueue, close } = ndjsonResponse();
  const startedAt = Date.now();

  (async () => {
    try {
      enqueue({ type: 'status', text: 'Reading your offer…' });

      const stream = client.messages.stream({
        model: getModel(),
        max_tokens: 2048,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: [SUBMIT_COACHING_TOOL],
        tool_choice: { type: 'tool', name: SUBMIT_COACHING_TOOL.name },
        messages,
      });

      let bytesSoFar = 0;
      let linesSoFar = 0;
      let announcedDrafting = false;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
          const chunk = event.delta.partial_json;
          bytesSoFar += chunk.length;
          if (!announcedDrafting) {
            announcedDrafting = true;
            enqueue({ type: 'status', text: 'Drafting verdict and script…' });
          }
          const newLines = (chunk.match(/"line"\s*:/g) ?? []).length;
          if (newLines > 0) {
            linesSoFar += newLines;
            enqueue({ type: 'progress', linesSoFar, bytesSoFar });
          }
        }
      }

      const final = await stream.finalMessage();
      const toolUse = final.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );
      if (!toolUse) {
        enqueue({
          type: 'error',
          message: 'Model did not return a structured coaching output.',
        });
        close();
        return;
      }
      const parsed = coachOutputSchema.safeParse(toolUse.input);
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

      const usage = final.usage;
      console.log('[chat]', {
        model: getModel(),
        durationMs: Date.now() - startedAt,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_creation_input_tokens: usage.cache_creation_input_tokens,
        cache_read_input_tokens: usage.cache_read_input_tokens,
      });

      enqueue({ type: 'final', output: parsed.data });
      close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Anthropic request failed.';
      enqueue({ type: 'error', message: msg });
      close();
    }
  })();

  return response;
}
