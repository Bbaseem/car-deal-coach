import Anthropic from '@anthropic-ai/sdk';
import type {
  CoachingProvider,
  CoachingStreamOptions,
  PriorRound,
  ProviderName,
  StreamResult,
} from './types';
import { ProviderConfigError } from './types';

export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5';

function buildPriorMessages(rounds: PriorRound[], toolName: string): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const r of rounds) {
    out.push({ role: 'user', content: r.userMessage });
    out.push({
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: `prior_${r.id}`,
          name: toolName,
          input: r.toolInput as Record<string, unknown>,
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
  return out;
}

export function createAnthropicProvider(): CoachingProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ProviderConfigError(
      'ANTHROPIC_API_KEY is not set. Copy .env.local.example to .env.local and add your key.',
    );
  }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL;

  const name: ProviderName = 'anthropic';
  return {
    name,
    model,
    async stream(opts: CoachingStreamOptions): Promise<StreamResult> {
      const messages: Anthropic.MessageParam[] = [
        ...buildPriorMessages(opts.priorRounds, opts.tool.name),
        { role: 'user', content: opts.userMessage },
      ];

      const stream = client.messages.stream({
        model,
        max_tokens: 2048,
        system: [
          {
            type: 'text',
            text: opts.systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: [
          {
            name: opts.tool.name,
            description: opts.tool.description,
            input_schema: opts.tool.inputSchema as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: 'tool', name: opts.tool.name },
        messages,
      });

      let linesSoFar = 0;
      let bytesSoFar = 0;
      let announcedDrafting = false;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
          const chunk = event.delta.partial_json;
          bytesSoFar += chunk.length;
          if (!announcedDrafting) {
            announcedDrafting = true;
            opts.onStatus('Drafting verdict and script…');
          }
          const newLines = (chunk.match(/"line"\s*:/g) ?? []).length;
          if (newLines > 0) {
            linesSoFar += newLines;
            opts.onProgress(linesSoFar, bytesSoFar);
          }
        }
      }

      const final = await stream.finalMessage();
      const toolUse = final.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );
      if (!toolUse) {
        throw new Error('Anthropic did not return a tool_use block.');
      }

      return {
        rawToolInput: toolUse.input,
        usage: {
          input_tokens: final.usage.input_tokens,
          output_tokens: final.usage.output_tokens,
          cache_creation_input_tokens: final.usage.cache_creation_input_tokens ?? undefined,
          cache_read_input_tokens: final.usage.cache_read_input_tokens ?? undefined,
        },
      };
    },
  };
}
