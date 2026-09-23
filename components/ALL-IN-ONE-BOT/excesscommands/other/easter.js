const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'easter',
    description: '🐣 Countdown to Easter 2025!',
    execute(message) {
        let today = new Date();
        let easter = new Date(2025, 3, 20); 

        let daysLeft = Math.ceil((easter - today) / (1000 * 60 * 60 * 24));

        const embed = new EmbedBuilder()
            .setTitle('🐣 Easter Countdown 🐰')
            .setDescription(`🌸 **${daysLeft} days left until Easter Sunday 2025!** 🥚`)
            .setColor('#b9caff')
            .setFooter({ text: 'Get ready for Easter eggs and celebrations! 🎊' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
