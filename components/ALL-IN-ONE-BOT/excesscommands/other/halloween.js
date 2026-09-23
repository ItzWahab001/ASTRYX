const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'halloween',
    description: '🎃 Countdown to Halloween!',
    execute(message) {
        let today = new Date();
        let halloween = new Date(today.getFullYear(), 9, 31); 

        if (today > halloween) {
            halloween.setFullYear(halloween.getFullYear() + 1);
        }

        let daysLeft = Math.ceil((halloween - today) / (1000 * 60 * 60 * 24));

        const embed = new EmbedBuilder()
            .setTitle('🎃 Halloween Countdown 👻')
            .setDescription(`🕸️ **${daysLeft} days left until Halloween!**`)
            .setColor('#1557ff')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
