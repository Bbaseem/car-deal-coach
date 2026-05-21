import { z } from 'zod';

export const scriptLineSchema = z.object({
  line: z.string().min(1),
  reasoning: z.string().min(1),
});

export const manipulationCalloutSchema = z.object({
  pattern: z.string().min(1),
  explanation: z.string().min(1),
});

export const noCompsCoachingSchema = z.object({
  stallScript: z.string().min(1),
  searchUrls: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .min(1),
});

export const coachOutputSchema = z
  .object({
    verdict: z.object({
      headline: z.string().min(1),
      summary: z.string().min(1),
    }),
    lowConfidence: z.boolean(),
    lowConfidenceReason: z.string().optional(),
    walkAwayAnchor: z.string(),
    scriptLines: z.array(scriptLineSchema).min(1).max(10),
    manipulationCallouts: z.array(manipulationCalloutSchema),
    noCompsCoaching: noCompsCoachingSchema.optional(),
  })
  .refine(
    (v) => (v.lowConfidence ? v.noCompsCoaching != null : v.noCompsCoaching == null),
    {
      message:
        'noCompsCoaching must be present iff lowConfidence is true.',
      path: ['noCompsCoaching'],
    },
  );

export type CoachOutputParsed = z.infer<typeof coachOutputSchema>;
