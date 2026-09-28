import type { Message } from "discord.js";
import { getRulesForGuild } from "../../../repositories/automodRuleRepository.js";
import { checkWordFilter, checkLinkFilter, checkMentionSpam, checkMessageSpam } from "./rules.js";
import { childLogger } from "../../../utils/logger.js";
import { applyEscalation } from "../escalation.js";
import { logModerationEvent } from "../logging.js";

const log = childLogger("automod-engine");

/**
 * Entry point wired to the messageCreate event. Runs enabled rules for the guild against the
 * message, and on the first violation, hands off to the escalation module (which persists the
 * case and calls the real Discord moderation API — see escalation.ts).
 */
export async function runAutomod(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;

  try {
    const rules = await getRulesForGuild(message.guild.id);
    const byType = new Map(rules.map((r) => [r.ruleType, r]));

    const wordRule = byType.get("word_filter");
    const linkRule = byType.get("link_filter");
    const mentionRule = byType.get("mention_spam");
    const spamRule = byType.get("message_spam");

    const violation =
      (wordRule && checkWordFilter(wordRule, message.content)) ||
      (linkRule && checkLinkFilter(linkRule, message.content)) ||
      (mentionRule && checkMentionSpam(mentionRule, message.mentions.users.size)) ||
      (spamRule && (await checkMessageSpam(spamRule, message.guild.id, message.author.id)));

    if (!violation) return;

    log.info({ guildId: message.guild.id, userId: message.author.id, violation }, "automod violation");

    await message.delete().catch((err) => log.warn({ err }, "failed to delete violating message"));

    const result = await applyEscalation({
      guild: message.guild,
      targetId: message.author.id,
      reason: `AutoMod: ${violation.detail}`,
      source: "automod",
    });

    await logModerationEvent(message.guild, {
      type: "automod",
      title: `AutoMod action: ${result.actionTaken}`,
      description: `<@${message.author.id}> triggered **${violation.ruleType}** — ${violation.detail}`,
      caseNumber: result.caseNumber,
    });
  } catch (err) {
    // Error handling per acceptance criterion #5: automod must never crash the message pipeline.
    log.error({ err, guildId: message.guild?.id }, "automod engine failed");
  }
}
