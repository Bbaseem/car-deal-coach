import type { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, getModel } from '@/lib/anthropic';
import { coachOutputSchema } from '@/lib/schema';
import { SUBMIT_COACHING_TOOL, SYSTEM_PROMPT } from '@/lib/systemPrompt';
import type { ChatRequest, ChatResponse, Round } from '@/lib/types';

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

function jsonResponse(body: ChatResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  if (!body || typeof body.message !== 'string' || !body.message.trim()) {
    return jsonResponse({ ok: false, error: 'Message is required.' }, 400);
  }
  if (!body.context || !Array.isArray(body.context.comps)) {
    return jsonResponse({ ok: false, error: 'Context with comps[] is required.' }, 400);
  }

  let client: Anthropic;
  try {
    client = getAnthropicClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Anthropic client unavailable.';
    return jsonResponse({ ok: false, error: msg }, 500);
  }

  const messages: Anthropic.MessageParam[] = [
    ...buildPriorMessages(body.priorRounds ?? []),
    { role: 'user', content: buildUserContent(body) },
  ];

  try {
    const response = await client.messages.create({
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

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (!toolUse) {
      return jsonResponse(
        { ok: false, error: 'Model did not return a structured coaching output.' },
        502,
      );
    }
    const parsed = coachOutputSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const summary = first
        ? `${first.path.join('.') || 'root'}: ${first.message}`
        : 'unknown shape error';
      return jsonResponse(
        { ok: false, error: `Model output failed validation (${summary}). Try regenerating.` },
        502,
      );
    }
    return jsonResponse({ ok: true, output: parsed.data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Anthropic request failed.';
    return jsonResponse({ ok: false, error: msg }, 502);
  }
}
