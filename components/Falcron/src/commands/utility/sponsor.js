// Falcron | AeroX Development
// Author: itsfizys
import { Command } from '#command';
import { logger } from '#utils';

class SponsorCommand extends Command {
        constructor() {
                super({
                        name: 'sponsor',
                        description: 'Displays the information about the sponsors of the bot',
                        usage: 'sponsor',
                        aliases: ['sponsors'],
                        cooldown: 10,
                        enabledSlash: true,
                        slashData: {
                                name: 'sponsor',
                                description: 'Displays the information about the sponsors of the bot',
                        },
                });
        }

        async execute({ ctx }) {
                await ctx.reply({ content: 'We have no sponsor at the moment !!' });
        }
}

export default new SponsorCommand();

/**
 * Project: Falcron
 * Author: itsfizys (Aegis)
 * Organization: AeroX Development
 * GitHub: https://github.com/AeroXDevs
 * License: Custom
 *
 * © 2026 AeroX Development. All rights reserved.
 */