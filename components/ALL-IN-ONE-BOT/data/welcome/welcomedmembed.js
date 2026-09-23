const { EmbedBuilder } = require('discord.js');

module.exports = function createWelcomeDMEmbed(member) {
    const username = member.user.username;
    const serverName = member.guild.name;
    const avatar = member.user.displayAvatarURL({ dynamic: true });

    return new EmbedBuilder()
        .setTitle(`👋 Welcome to ${serverName}!`)
        .setDescription(`Hey ${username}, we're thrilled to have you join us!`)
        .setColor('#3d7cff')
        .setThumbnail(avatar)
        .addFields(
            { name: '📅 Joined', value: new Date().toDateString(), inline: true },
            { name: '📝 Info', value: 'Explore channels, follow rules, and say hi!' }
        )
        .setFooter({ text: `${serverName} Community` })
        .setTimestamp();
};
