// Falcron | AeroX Development
// Author: itsfizys
export default {
        name: 'inviteDelete',
        async execute({ eventArgs, client }) {
                const [invite] = eventArgs;
                if (!invite.guild) return;

                const guildCache = client.inviteCache?.get(invite.guild.id);
                if (guildCache) guildCache.delete(invite.code);
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