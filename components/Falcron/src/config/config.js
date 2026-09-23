// Falcron | AeroX Development
// Author: itsfizys
export const config = {
        token: process.env.DISCORD_TOKEN || '',
        clientId: process.env.DISCORD_CLIENT_ID || '',
        prefix: '-',
        ownerIds: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [],
        ownerOnly: false,

        links: {
                supportServer: 'https://discord.gg/Ez4gCJQDxB',
                invite: '',
        },

        cache: {
                maxSize: process.env.NODE_ENV === 'production' ? 100000 : 50000,
                flushOnStart: false,
                flushOnShutdown: false,
        },

        database: {
                uri: process.env.MONGODB_URI || '',
        },

        presence: {
                status: 'idle',
                activity: {
                        name: '-help || AeroX Development',
                        type: 'Custom',
                },
        },

        watermark: '',
        version: '1.0.0',
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
