import type { ChatStreamEvent } from '@/lib/types';

export async function readNdjsonStream(
  response: Response,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  if (!response.body) {
    throw new Error('Empty response body.');
  }

  const ctype = response.headers.get('content-type') ?? '';
  if (!ctype.includes('application/x-ndjson')) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (data && typeof data.error === 'string') errMsg = data.error;
    } catch {
      // ignore
    }
    onEvent({ type: 'error', message: errMsg });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf('\n');
    while (nl !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) {
        try {
          onEvent(JSON.parse(line) as ChatStreamEvent);
        } catch {
          // skip malformed line
        }
      }
      nl = buffer.indexOf('\n');
    }
  }
  const tail = buffer.trim();
  if (tail) {
    try {
      onEvent(JSON.parse(tail) as ChatStreamEvent);
    } catch {
      // ignore
    }
  }
}
