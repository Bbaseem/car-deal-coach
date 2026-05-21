import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Car Deal Coach — hedged buyer coach for first-time car shoppers';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: 'linear-gradient(135deg, #0a0a0a 0%, #162456 100%)',
        color: '#ededed',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#3080ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 32,
            color: '#fff',
          }}
        >
          C
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>Car Deal Coach</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          Hedged counter-offer scripts
        </div>
        <div style={{ fontSize: 32, color: '#90c5ff', maxWidth: 900 }}>
          Paste a dealer offer mid-negotiation. Get a script you can read out loud.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {['Verdict card', 'Per-line reasoning', 'Pattern callouts'].map((tag) => (
          <div
            key={tag}
            style={{
              fontSize: 22,
              padding: '10px 20px',
              borderRadius: 999,
              border: '2px solid #3080ff',
              color: '#bedbff',
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
