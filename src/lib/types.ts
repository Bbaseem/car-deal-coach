export type Comp = {
  id: string;
  text: string;
};

export type DealContext = {
  walkAwayOtd: number | null;
  dealText: string;
  comps: Comp[];
};

export type ScriptLine = {
  line: string;
  reasoning: string;
};

export type ManipulationCallout = {
  pattern: string;
  explanation: string;
};

export type NoCompsCoaching = {
  stallScript: string;
  searchUrls: { label: string; url: string }[];
};

export type CoachOutput = {
  verdict: {
    headline: string;
    summary: string;
  };
  lowConfidence: boolean;
  lowConfidenceReason?: string;
  walkAwayAnchor: string;
  scriptLines: ScriptLine[];
  manipulationCallouts: ManipulationCallout[];
  noCompsCoaching?: NoCompsCoaching;
};

export type Round = {
  id: string;
  createdAt: number;
  userMessage: string;
  context: DealContext;
  output: CoachOutput | null;
  error?: string;
};

export type Session = {
  version: 1;
  walkAwayOtd: number | null;
  comps: Comp[];
  rounds: Round[];
};

export type ChatRequest = {
  message: string;
  context: DealContext;
  priorRounds: Round[];
};

export type ChatResponse =
  | { ok: true; output: CoachOutput }
  | { ok: false; error: string };
