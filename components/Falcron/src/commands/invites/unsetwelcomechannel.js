// Falcron | AeroX Development
// Author: itsfizys
import { Command } from '#command';
import {
        MessageFlags,
        PermissionFlagsBits,
        ContainerBuilder,
        TextDisplayBuilder,
        SeparatorBuilder,
        SeparatorSpacingSize,
} from 'discord.js';
import { db } from '#dbManager';

class UnsetWelcomeChannelCommand extends Command {
        constructor() {
                super({
                        name: 'unsetwelcomechannel',
                        description: 'Unset the welcome channel and disable invite welcome messages',
                        usage: 'unsetwelcomechannel',
                        cooldown: 5,
                        userPermissions: [PermissionFlagsBits.ManageGuild],
                        permissions: [PermissionFlagsBits.SendMessages],
                        enabledSlash: true,
                        slashData: {
                                name: 'unsetwelcomechannel',
                                description: 'Unset the welcome channel and disable invite welcome messages',
                        },
                });
        }

        async execute({ ctx }) {
                await db.guild?.setJoinChannel(ctx.guild.id, null);

                const now = new Date().toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Kolkata',
                });

                const container = new ContainerBuilder().setAccentColor(0xffffff);

                container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('### Falcron invite logger'),
                );

                container.addSeparatorComponents(
                        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
                );

                container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('Successfully deleted the channel from my database'),
                );

                container.addSeparatorComponents(
                        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
                );

                container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`-# Today at ${now}`),
                );

                await ctx.reply({
                        components: [container],
                        flags: MessageFlags.IsComponentsV2,
                });
        }
}

export default new UnsetWelcomeChannelCommand();

/**
 * Project: Falcron
 * Author: itsfizys (Aegis)
 * Organization: AeroX Development
 * GitHub: https://github.com/AeroXDevs
 * License: Custom
 *
 * © 2026 AeroX Development. All rights reserved.
 */