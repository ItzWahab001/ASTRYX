/**
 * Pure heat-scoring function — no Discord/DB/Redis calls, so it's directly unit-testable.
 * Scores 0-100; higher = more likely to be a raid join. Modeled on Wick's "statistical/behavioral
 * beats static thresholds" pattern (see research doc, Extracted Lessons #1).
 */
export interface HeatInput {
  accountAgeMs: number;
  hasAvatar: boolean;
  recentJoinsInWindow: number; // joins to this guild within the configured window, including this one
  usernameLooksGenerated: boolean; // e.g. random-suffix pattern typical of bot-farmed accounts
}

export interface HeatResult {
  score: number;
  verdict: "allow" | "flag" | "quarantine";
  reasons: string[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface HeatThresholds {
  quarantine: number;
  flag: number;
}

// Defaults match the previous hardcoded values, so existing callers/tests that don't pass
// thresholds keep the same behavior. `evaluateJoin` now passes the guild's real configured
// threshold (env.antiRaid.heatThreshold) instead of relying on this default silently.
export const DEFAULT_HEAT_THRESHOLDS: HeatThresholds = { quarantine: 70, flag: 40 };

export function scoreJoin(input: HeatInput, thresholds: HeatThresholds = DEFAULT_HEAT_THRESHOLDS): HeatResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.accountAgeMs < ONE_DAY_MS) {
    score += 35;
    reasons.push("account created within the last 24h");
  } else if (input.accountAgeMs < 7 * ONE_DAY_MS) {
    score += 15;
    reasons.push("account created within the last 7 days");
  }

  if (!input.hasAvatar) {
    score += 15;
    reasons.push("no custom avatar");
  }

  if (input.usernameLooksGenerated) {
    score += 15;
    reasons.push("username matches a generated/random pattern");
  }

  // Join velocity is the strongest signal — weighted highest, and scales with how far over
  // a "normal" trickle (treated as ~3 joins/window) the current window is.
  if (input.recentJoinsInWindow > 3) {
    const over = input.recentJoinsInWindow - 3;
    const velocityScore = Math.min(50, over * 8);
    score += velocityScore;
    reasons.push(`${input.recentJoinsInWindow} joins in the current window`);
  }

  score = Math.min(100, score);

  let verdict: HeatResult["verdict"] = "allow";
  if (score >= thresholds.quarantine) verdict = "quarantine";
  else if (score >= thresholds.flag) verdict = "flag";

  return { score, verdict, reasons };
}

/** Detects generated-looking usernames: trailing digit runs, or random-looking consonant clusters. */
export function looksGenerated(username: string): boolean {
  return /\d{4,}$/.test(username) || /^[a-z]{2,4}\d{2,}$/i.test(username);
}
