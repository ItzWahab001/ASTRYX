import { describe, it, expect } from "vitest";
import { checkWordFilter, checkLinkFilter, checkMentionSpam } from "../src/modules/moderation/automod/rules.js";
import type { AutomodRule } from "../src/repositories/automodRuleRepository.js";

function rule(overrides: Partial<AutomodRule> = {}): AutomodRule {
  return {
    id: 1,
    guildId: "g1",
    ruleType: "word_filter",
    enabled: true,
    config: {},
    ...overrides,
  };
}

describe("checkWordFilter", () => {
  it("returns null when disabled", () => {
    const r = rule({ enabled: false, config: { words: ["badword"] } });
    expect(checkWordFilter(r, "this has badword in it")).toBeNull();
  });

  it("returns null when no configured words match", () => {
    const r = rule({ config: { words: ["badword"] } });
    expect(checkWordFilter(r, "totally clean message")).toBeNull();
  });

  it("flags a case-insensitive match", () => {
    const r = rule({ config: { words: ["badword"] } });
    const violation = checkWordFilter(r, "this has BADWORD in it");
    expect(violation?.ruleType).toBe("word_filter");
  });
});

describe("checkLinkFilter", () => {
  it("allows a link on the domain allowlist", () => {
    const r = rule({ ruleType: "link_filter", config: { allowedDomains: ["discord.com"] } });
    expect(checkLinkFilter(r, "join here https://discord.com/invite/abc")).toBeNull();
  });

  it("flags a link not on the allowlist", () => {
    const r = rule({ ruleType: "link_filter", config: { allowedDomains: ["discord.com"] } });
    const violation = checkLinkFilter(r, "check this out https://shady-site.example/x");
    expect(violation?.ruleType).toBe("link_filter");
  });

  it("returns null when the message has no links", () => {
    const r = rule({ ruleType: "link_filter", config: { allowedDomains: [] } });
    expect(checkLinkFilter(r, "no links here at all")).toBeNull();
  });
});

describe("checkMentionSpam", () => {
  it("allows mention counts at or below the configured max", () => {
    const r = rule({ ruleType: "mention_spam", config: { maxMentions: 5 } });
    expect(checkMentionSpam(r, 5)).toBeNull();
  });

  it("flags mention counts over the configured max", () => {
    const r = rule({ ruleType: "mention_spam", config: { maxMentions: 5 } });
    const violation = checkMentionSpam(r, 12);
    expect(violation?.ruleType).toBe("mention_spam");
  });
});
