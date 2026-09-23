const { EmbedBuilder } = require('discord.js');
const { images } = require('mediacord');

module.exports = {
    name: 'neko',
    description: 'Fetches a random neko image.',
    async execute(message, args) {
        if (!message.channel.nsfw) {
            return message.reply('This command can only be used in NSFW channels.');
        }

        try {
            const imageUrl = await images.nsfw.neko();

            const embed = new EmbedBuilder()
                .setTitle('Neko Image')
                .setImage(imageUrl)
                .setColor('#4b76ff');

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('Something went wrong while fetching the image. Please try again later.');
        }
    },
};
