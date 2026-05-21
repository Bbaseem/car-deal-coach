import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

type ClientError = {
  message?: string;
  stack?: string;
  digest?: string;
  url?: string;
  ua?: string;
};

export async function POST(request: NextRequest): Promise<Response> {
  let body: ClientError = {};
  try {
    body = (await request.json()) as ClientError;
  } catch {
    return new Response('{"ok":false}', { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  console.error('[client-error]', {
    ts: new Date().toISOString(),
    ip,
    url: body.url,
    ua: body.ua,
    digest: body.digest,
    message: body.message?.slice(0, 500),
    stack: body.stack?.slice(0, 2000),
  });

  return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } });
}
