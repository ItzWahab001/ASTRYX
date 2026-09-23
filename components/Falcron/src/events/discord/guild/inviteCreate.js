// Falcron | AeroX Development
// Author: itsfizys
export default {
        name: 'inviteCreate',
        async execute({ eventArgs, client }) {
                const [invite] = eventArgs;
                if (!invite.guild) return;

                if (!client.inviteCache) client.inviteCache = new Map();

                const guildCache = client.inviteCache.get(invite.guild.id) ?? new Map();
                guildCache.set(invite.code, invite.uses ?? 0);
                client.inviteCache.set(invite.guild.id, guildCache);
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