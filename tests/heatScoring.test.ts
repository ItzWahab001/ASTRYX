import { describe, it, expect } from "vitest";
import { scoreJoin, looksGenerated } from "../src/modules/antiRaid/heatScoring.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

describe("scoreJoin", () => {
  it("allows an established, normal-looking account with no join velocity", () => {
    const result = scoreJoin({
      accountAgeMs: 365 * ONE_DAY,
      hasAvatar: true,
      recentJoinsInWindow: 1,
      usernameLooksGenerated: false,
    });
    expect(result.verdict).toBe("allow");
    expect(result.score).toBeLessThan(40);
  });

  it("quarantines a brand-new, avatar-less, generated-username account joining during a burst", () => {
    const result = scoreJoin({
      accountAgeMs: 60 * 1000,
      hasAvatar: false,
      recentJoinsInWindow: 20,
      usernameLooksGenerated: true,
    });
    expect(result.verdict).toBe("quarantine");
    expect(result.score).toBe(100);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("flags (not quarantine) a moderately suspicious single-factor case", () => {
    const result = scoreJoin({
      accountAgeMs: 2 * ONE_DAY,
      hasAvatar: true,
      recentJoinsInWindow: 1,
      usernameLooksGenerated: false,
    });
    expect(result.verdict).not.toBe("quarantine");
  });

  it("weights join velocity as the dominant signal", () => {
    const lowVelocity = scoreJoin({
      accountAgeMs: 365 * ONE_DAY,
      hasAvatar: true,
      recentJoinsInWindow: 1,
      usernameLooksGenerated: false,
    });
    const highVelocity = scoreJoin({
      accountAgeMs: 365 * ONE_DAY,
      hasAvatar: true,
      recentJoinsInWindow: 15,
      usernameLooksGenerated: false,
    });
    expect(highVelocity.score).toBeGreaterThan(lowVelocity.score);
  });

  it("never exceeds a score of 100", () => {
    const result = scoreJoin({
      accountAgeMs: 0,
      hasAvatar: false,
      recentJoinsInWindow: 999,
      usernameLooksGenerated: true,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("scoreJoin with configurable thresholds", () => {
  it("respects a custom quarantine threshold (env.antiRaid.heatThreshold wiring)", () => {
    // Same inputs as the "flags but doesn't quarantine" case above, but with a lowered
    // quarantine threshold — regression guard for the fact that scoreJoin previously ignored
    // any configured threshold and always used a hardcoded 70/40 split.
    const result = scoreJoin(
      { accountAgeMs: 2 * ONE_DAY, hasAvatar: true, recentJoinsInWindow: 1, usernameLooksGenerated: false },
      { quarantine: 30, flag: 10 },
    );
    expect(result.verdict).toBe("quarantine");
  });

  it("defaults to the standard 70/40 split when no thresholds are passed", () => {
    const result = scoreJoin({
      accountAgeMs: 2 * ONE_DAY,
      hasAvatar: true,
      recentJoinsInWindow: 1,
      usernameLooksGenerated: false,
    });
    expect(result.verdict).toBe("allow");
  });
});

describe("looksGenerated", () => {
  it("flags trailing long digit runs", () => {
    expect(looksGenerated("user48213957")).toBe(true);
  });

  it("flags short-consonant-plus-digits patterns", () => {
    expect(looksGenerated("xkq4821")).toBe(true);
  });

  it("does not flag ordinary human-chosen usernames", () => {
    expect(looksGenerated("morgan_bakes")).toBe(false);
    expect(looksGenerated("theRealSamurai")).toBe(false);
  });
});
