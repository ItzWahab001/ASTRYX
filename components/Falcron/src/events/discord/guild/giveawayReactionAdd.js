// Falcron | AeroX Development
  // Author: itsfizys
  import { giveawayStore, GWAY_EMOJI_RAW_ID } from '#giveawayUtils';

  export default {
          name: 'messageReactionAdd',
          async execute({ eventArgs }) {
                  const [reaction, user] = eventArgs;

                  if (reaction.partial) {
                          await reaction.fetch().catch(() => null);
                  }

                  if (user.partial) {
                          await user.fetch().catch(() => null);
                  }

                  if (reaction.emoji.id !== GWAY_EMOJI_RAW_ID) return;

                  if (user.bot) return;

                  const messageId = reaction.message.id;
                  const giveaway = giveawayStore.get(messageId);

                  if (!giveaway || giveaway.status !== 'active') return;

                  giveaway.participants.add(user.id);
                  giveawayStore.set(messageId, giveaway);
          },
  };

  /**
   * Project: Falcron
   * Author: itsfizys (Aegis)
   * Organization: AeroX Development
   * GitHub: https://github.com/AeroXDevs
   * License: Custom
   *
   * © 2026 AeroX Development. All rights reserved.
   */
  