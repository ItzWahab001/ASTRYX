import { incrWithWindow } from "../../../db/redis.js";
import type { AutomodRule } from "../../../repositories/automodRuleRepository.js";

export interface RuleContext {
  guildId: string;
  authorId: string;
  content: string;
  mentionCount: number;
}

export interface RuleViolation {
  ruleType: string;
  detail: string;
}

const URL_REGEX = /https?:\/\/[^\s]+/gi;

/** Pure, unit-testable — matches raw message content against a configured word list. */
export function checkWordFilter(rule: AutomodRule, content: string): RuleViolation | null {
  if (!rule.enabled) return null;
  const words = (rule.config.words as string[] | undefined) ?? [];
  if (words.length === 0) return null;
  const lower = content.toLowerCase();
  const hit = words.find((w) => lower.includes(w.toLowerCase()));
  return hit ? { ruleType: "word_filter", detail: `matched filtered term` } : null;
}

/** Pure, unit-testable — flags links unless the domain is on the configured allowlist. */
export function checkLinkFilter(rule: AutomodRule, content: string): RuleViolation | null {
  if (!rule.enabled) return null;
  const allowlist = (rule.config.allowedDomains as string[] | undefined) ?? [];
  const matches = content.match(URL_REGEX);
  if (!matches) return null;
  for (const url of matches) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      if (!allowlist.includes(host)) {
        return { ruleType: "link_filter", detail: `unapproved link domain: ${host}` };
      }
    } catch {
      return { ruleType: "link_filter", detail: "malformed URL" };
    }
  }
  return null;
}

/** Pure, unit-testable — flags mass-mention messages (raid/ping-spam pattern). */
export function checkMentionSpam(rule: AutomodRule, mentionCount: number): RuleViolation | null {
  if (!rule.enabled) return null;
  const max = (rule.config.maxMentions as number | undefined) ?? 5;
  return mentionCount > max
    ? { ruleType: "mention_spam", detail: `${mentionCount} mentions exceeds limit of ${max}` }
    : null;
}

/**
 * Stateful (Redis-backed) — sliding-window message rate check. Not pure by nature (it's a rate
 * limiter over time), so it's exercised via integration testing against a real/mock Redis rather
 * than the pure unit tests used for the other three rules.
 */
export async function checkMessageSpam(
  rule: AutomodRule,
  guildId: string,
  authorId: string,
): Promise<RuleViolation | null> {
  if (!rule.enabled) return null;
  const windowSeconds = (rule.config.windowSeconds as number | undefined) ?? 5;
  const maxMessages = (rule.config.maxMessages as number | undefined) ?? 5;
  const key = `automod:spam:${guildId}:${authorId}`;
  const count = await incrWithWindow(key, windowSeconds);
  return count > maxMessages
    ? { ruleType: "message_spam", detail: `${count} messages within ${windowSeconds}s exceeds ${maxMessages}` }
    : null;
}
