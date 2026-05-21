import { test, expect } from '@playwright/test';

test.describe('Car Deal Coach happy path', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('loads, sets walk-away, fills the deal, gets a streamed verdict', async ({ page }) => {
    // Stub the streaming API with a canned NDJSON response so the test
    // doesn't need a real ANTHROPIC_API_KEY.
    await page.route('**/api/chat', async (route) => {
      const events = [
        { type: 'status', text: 'Reading your offer…' },
        { type: 'status', text: 'Drafting verdict and script…' },
        { type: 'progress', linesSoFar: 1, bytesSoFar: 120 },
        { type: 'progress', linesSoFar: 2, bytesSoFar: 240 },
        {
          type: 'final',
          output: {
            verdict: {
              headline: 'Verdict: deal is ~6% above target. Push to $42,000 OTD.',
              summary: 'Your comps average ~$40,400; their OTD is closer to $42,800.',
            },
            lowConfidence: false,
            walkAwayAnchor: "I'd set myself at around $42,000 OTD.",
            scriptLines: [
              {
                line: 'Based on the three listings I pasted averaging ~$40,400, can we land closer to that on the OTD?',
                reasoning: 'Anchors the discussion to user-pasted comps.',
              },
              {
                line: 'I noticed the $1,800 paint-protection line — could we drop that to make the OTD work?',
                reasoning: 'Targets the highest-margin add-on without escalating tone.',
              },
            ],
            manipulationCallouts: [
              {
                pattern: 'Padded add-ons',
                explanation:
                  'Paint protection at $1,800 is a high-margin dealer add. Often dropped without resistance.',
              },
            ],
          },
        },
      ];
      const body = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
        body,
      });
    });

    await page.goto('/');

    // Loading state vanishes after hydration.
    await expect(page.getByRole('heading', { name: 'Car Deal Coach' })).toBeVisible();

    // Sample-deal CTA on empty state.
    await page.getByRole('button', { name: 'Load sample' }).click();

    // Walk-away saved.
    await expect(page.getByText('$42,000')).toBeVisible();

    // Comps populated.
    await expect(page.getByText('Comparable listings (3/5)')).toBeVisible();

    // Fill the deal input.
    await page.getByLabel('Dealer offer / your message').fill('Sample offer for an e2e test.');
    await page.getByRole('button', { name: /Generate counter-offer script/i }).click();

    // Streaming status appears.
    await expect(page.getByText(/Drafting|Writing script line/)).toBeVisible({ timeout: 5_000 });

    // Final output rendered.
    await expect(
      page.getByText('Verdict: deal is ~6% above target. Push to $42,000 OTD.'),
    ).toBeVisible();
    await expect(page.getByText(/Based on the three listings I pasted averaging/)).toBeVisible();

    // Manipulation callout shown.
    await expect(page.getByText('Padded add-ons:')).toBeVisible();
  });
});
