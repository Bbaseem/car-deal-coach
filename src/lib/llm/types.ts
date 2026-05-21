export type ProviderName = 'anthropic' | 'openai';

export type PriorRound = {
  id: string;
  userMessage: string;
  toolInput: unknown;
};

export type CoachingToolSchema = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type CoachingStreamOptions = {
  systemPrompt: string;
  tool: CoachingToolSchema;
  userMessage: string;
  priorRounds: PriorRound[];
  onStatus: (text: string) => void;
  onProgress: (linesSoFar: number, bytesSoFar: number) => void;
};

export type StreamUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

export type StreamResult = {
  rawToolInput: unknown;
  usage: StreamUsage;
};

export interface CoachingProvider {
  readonly name: ProviderName;
  readonly model: string;
  stream(opts: CoachingStreamOptions): Promise<StreamResult>;
}

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigError';
  }
}
