import OpenAI from 'openai';
import type {
  CoachingProvider,
  CoachingStreamOptions,
  PriorRound,
  ProviderName,
  StreamResult,
} from './types';
import { ProviderConfigError } from './types';

export const DEFAULT_OPENAI_MODEL = 'gpt-4o-2024-08-06';

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

function buildPriorMessages(rounds: PriorRound[], toolName: string): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const r of rounds) {
    out.push({ role: 'user', content: r.userMessage });
    const argString = JSON.stringify(r.toolInput);
    const callId = `prior_${r.id}`;
    out.push({
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: callId,
          type: 'function',
          function: {
            name: toolName,
            arguments: argString,
          },
        },
      ],
    });
    out.push({
      role: 'tool',
      tool_call_id: callId,
      content: 'ok',
    });
  }
  return out;
}

export function createOpenAIProvider(): CoachingProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ProviderConfigError(
      'OPENAI_API_KEY is not set. Copy .env.local.example to .env.local and add your key.',
    );
  }
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;

  const name: ProviderName = 'openai';
  return {
    name,
    model,
    async stream(opts: CoachingStreamOptions): Promise<StreamResult> {
      const messages: ChatMessage[] = [
        { role: 'system', content: opts.systemPrompt },
        ...buildPriorMessages(opts.priorRounds, opts.tool.name),
        { role: 'user', content: opts.userMessage },
      ];

      const stream = await client.chat.completions.create({
        model,
        messages,
        tools: [
          {
            type: 'function',
            function: {
              name: opts.tool.name,
              description: opts.tool.description,
              parameters: opts.tool.inputSchema,
              strict: false,
            },
          },
        ],
        tool_choice: {
          type: 'function',
          function: { name: opts.tool.name },
        },
        stream: true,
        stream_options: { include_usage: true },
      });

      let argsBuf = '';
      let linesSoFar = 0;
      let announcedDrafting = false;
      let inputTokens = 0;
      let outputTokens = 0;
      let cachedInputTokens: number | undefined;

      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        const toolCalls = choice?.delta?.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          const args = toolCalls[0]?.function?.arguments;
          if (typeof args === 'string' && args.length > 0) {
            argsBuf += args;
            if (!announcedDrafting) {
              announcedDrafting = true;
              opts.onStatus('Drafting verdict and script…');
            }
            const newLines = (args.match(/"line"\s*:/g) ?? []).length;
            if (newLines > 0) {
              linesSoFar += newLines;
              opts.onProgress(linesSoFar, argsBuf.length);
            }
          }
        }
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens;
          outputTokens = chunk.usage.completion_tokens;
          const cached = chunk.usage.prompt_tokens_details?.cached_tokens;
          if (typeof cached === 'number') cachedInputTokens = cached;
        }
      }

      if (!argsBuf) {
        throw new Error('OpenAI did not return tool-call arguments.');
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(argsBuf);
      } catch {
        throw new Error('OpenAI returned tool-call arguments that are not valid JSON.');
      }

      return {
        rawToolInput: parsed,
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cache_read_input_tokens: cachedInputTokens,
        },
      };
    },
  };
}
