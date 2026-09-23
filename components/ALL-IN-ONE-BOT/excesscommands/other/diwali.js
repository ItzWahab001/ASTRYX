const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'diwali',
    description: '🪔 Countdown to Diwali!',
    execute(message) {
        let today = new Date();
        let diwali = new Date(today.getFullYear(), 10, 1); // **Diwali 2025: October 21**
        
        if (today > diwali) {
            diwali.setFullYear(diwali.getFullYear() + 1);
        }

        let daysLeft = Math.ceil((diwali - today) / (1000 * 60 * 60 * 24));

        const embed = new EmbedBuilder()
            .setTitle('🪔 Diwali Countdown 🎇')
            .setDescription(`✨ **${daysLeft} days left until Diwali!**\n📅 **Next Diwali:** October 21, ${diwali.getFullYear()}`)
            .setColor('#b9caff')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
