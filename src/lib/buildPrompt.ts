import type { ChatRequest } from '@/lib/types';

export function buildUserContent(req: ChatRequest): string {
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
