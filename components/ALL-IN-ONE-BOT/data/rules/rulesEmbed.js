/*
 ██████╗ ██╗      █████╗  ██████╗███████╗██╗   ██╗████████╗
██╔════╝ ██║     ██╔══██╗██╔════╝██╔════╝╚██╗ ██╔╝╚══██╔══╝
██║  ███╗██║     ███████║██║     █████╗   ╚████╔╝    ██║   
██║   ██║██║     ██╔══██║██║     ██╔══╝    ╚██╔╝     ██║   
╚██████╔╝███████╗██║  ██║╚██████╗███████╗   ██║      ██║   
 ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝   ╚═╝      ╚═╝   

-------------------------------------
📡 Discord : https://discord.gg/xQF9f9yUEM
🌐 Website : https://glaceyt.com
🎥 YouTube : https://youtube.com/@GlaceYT
✅ Verified | 🧩 Tested | ⚙️ Stable
-------------------------------------
> © 2025 GlaceYT.com | All rights reserved.
*/

const { EmbedBuilder } = require("discord.js");

const ruleEmbeds = {
    spam: new EmbedBuilder()
        .setColor("Red")
        .setTitle("🚫 Spam Rules")
        .setDescription(
            "**1️⃣ No excessive messages:** Avoid sending too many messages in a short time.\n" +
            "**2️⃣ No emoji spam:** Do not flood chat with emojis or stickers.\n" +
            "**3️⃣ No reaction spam:** Repeatedly adding/removing reactions is disruptive.\n" +
            "**4️⃣ No copy-pasta:** Long, repetitive text blocks are not allowed.\n" +
            "**5️⃣ No self-promotion spam:** Promoting your content excessively is forbidden."
        ),

    nsfw: new EmbedBuilder()
        .setColor("DarkPurple")
        .setTitle("🔞 NSFW Rules")
        .setDescription(
            "**1️⃣ NSFW content is not allowed:** This includes images, text, or links.\n" +
            "**2️⃣ No inappropriate jokes or discussions:** Keep it clean.\n" +
            "**3️⃣ No sexual harassment:** Making explicit or suggestive comments is prohibited.\n" +
            "**4️⃣ No adult roleplay:** This is not an 18+ server."
        ),

    discord_terms: new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📜 Discord Terms & Conditions")
        .setDescription(
            "**1️⃣ Follow Discord's [Terms of Service](https://discord.com/terms)**.\n" +
            "**2️⃣ Follow Discord's [Community Guidelines](https://discord.com/guidelines)**.\n" +
            "**3️⃣ Do not use unauthorized bots, hacks, or exploits.**\n" +
            "**4️⃣ Do not engage in fraud, scamming, or phishing.**"
        ),

    harassment: new EmbedBuilder()
        .setColor("Orange")
        .setTitle("🚷 Harassment Rules")
        .setDescription(
            "**1️⃣ No personal attacks:** Do not insult or target others.\n" +
            "**2️⃣ No hate speech:** Racism, sexism, homophobia, or any form of discrimination is strictly forbidden.\n" +
            "**3️⃣ No threats or doxing:** Threatening or sharing private information is a bannable offense.\n" +
            "**4️⃣ No excessive trolling:** Light jokes are fine, but being disruptive isn't."
        ),

    links: new EmbedBuilder()
        .setColor("Yellow")
        .setTitle("🔗 Link Rules")
        .setDescription(
            "**1️⃣ No posting harmful links:** Malware, scams, or NSFW links are not allowed.\n" +
            "**2️⃣ No self-promotion outside dedicated channels:** Advertising should only be done where permitted.\n" +
            "**3️⃣ No IP grabbers, trackers, or shortened links:** Only share safe, verifiable URLs."
        ),

    images: new EmbedBuilder()
        .setColor("#285cff")
        .setTitle("🖼️ Image Rules")
        .setDescription(
            "**1️⃣ No NSFW or explicit images:** This is a safe space.\n" +
            "**2️⃣ No graphic violence or gore:** Keep content appropriate.\n" +
            "**3️⃣ No meme spam:** Keep meme posts reasonable.\n" +
            "**4️⃣ No offensive or discriminatory images.**"
        ),

    hacking: new EmbedBuilder()
        .setColor("#0a46ff")
        .setTitle("🛑 Hacking Rules")
        .setDescription(
            "**1️⃣ No hacking, cheating, or exploiting:** Do not attempt to hack bots, servers, or users.\n" +
            "**2️⃣ No sharing exploits or scripts:** Unauthorized software is forbidden.\n" +
            "**3️⃣ No social engineering or phishing:** Do not trick users into revealing sensitive information.\n" +
            "**4️⃣ No use of alt accounts to bypass bans or restrictions.**"
        ),

    mic_spam: new EmbedBuilder()
        .setColor("#285cff")
        .setTitle("🎤 Mic Spam Rules")
        .setDescription(
            "**1️⃣ No loud, distorted, or annoying sounds:** Do not intentionally disrupt voice chats.\n" +
            "**2️⃣ No voice changers or soundboards:** Unless allowed in specific channels.\n" +
            "**3️⃣ No playing music through your mic:** Use the designated music bots instead.\n" +
            "**4️⃣ No screaming or shouting excessively.**"
        ),

    bot_usage: new EmbedBuilder()
        .setColor("#008000")
        .setTitle("🤖 Bot Usage Rules")
        .setDescription(
            "**1️⃣ Do not abuse bot commands:** Use them responsibly.\n" +
            "**2️⃣ No spamming bot commands in main channels:** Keep it in bot channels.\n" +
            "**3️⃣ Do not attempt to hack or exploit bots.**"
        ),

    trading_selling: new EmbedBuilder()
        .setColor("#8B4513")
        .setTitle("💰 Trading & Selling Rules")
        .setDescription(
            "**1️⃣ No selling accounts, items, or services:** This is not a marketplace.\n" +
            "**2️⃣ No trading or gambling activities:** Use trusted platforms instead.\n" +
            "**3️⃣ No advertising personal businesses without permission.**"
        ),

    language: new EmbedBuilder()
        .setColor("#4682B4")
        .setTitle("🗣️ Language Rules")
        .setDescription(
            "**1️⃣ English only in general channels:** Use other channels for different languages.\n" +
            "**2️⃣ No excessive swearing:** Keep the chat friendly.\n" +
            "**3️⃣ No slurs, insults, or offensive language.**"
        ),

    spoilers: new EmbedBuilder()
        .setColor("#A52A2A")
        .setTitle("🎥 Spoiler Rules")
        .setDescription(
            "**1️⃣ Use spoiler tags for major spoilers:** Example: `||spoiler here||`.\n" +
            "**2️⃣ No posting spoilers outside designated spoiler channels.**"
        ),

    self_promotion: new EmbedBuilder()
        .setColor("#9370DB")
        .setTitle("📢 Self-Promotion Rules")
        .setDescription(
            "**1️⃣ No self-promotion outside dedicated channels.**\n" +
            "**2️⃣ No DM advertising:** Do not send unsolicited links to members.\n" +
            "**3️⃣ No begging for followers, subscribers, or donations.**"
        ),

    moderation: new EmbedBuilder()
        .setColor("#228B22")
        .setTitle("⚖️ Moderation Rules")
        .setDescription(
            "**1️⃣ Respect moderators and their decisions.**\n" +
            "**2️⃣ Do not backseat moderate:** Let staff handle issues.\n" +
            "**3️⃣ If you have concerns, message staff privately.**"
        )
};

module.exports = ruleEmbeds;
