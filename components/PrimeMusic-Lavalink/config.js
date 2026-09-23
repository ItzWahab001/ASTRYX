

module.exports = {
  TOKEN: process.env.TOKEN || "",
  language: "en",
  ownerID: [process.env.OWNER_ID || ""],
  mongodbUri : process.env.MONGODB_URI || "",
  spotifyClientId : process.env.SPOTIFY_CLIENT_ID || "",
  spotifyClientSecret : process.env.SPOTIFY_CLIENT_SECRET || "",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',  
  embedColor: "#e11d2e",
  customEmoji: true,  // true = use custom emoji IDs from emoji.js, false = use default unicode
  emojiTheme: "redwhite", // active custom emoji theme key in emoji.js
  helpBannerUrl: "https://i.ibb.co/GfTxbJfC/7-edited.png", // Optional: set a direct image URL to show an inline banner in /help
  activityName: "YouTube Music", 
  activityType: "LISTENING",  // Available activity types : LISTENING , PLAYING
  SupportServer: "https://discord.gg/xQF9f9yUEM",
  embedTimeout: 5,
  showProgressBar: false,  // Show progress bar in track embed
  showVisualizer: false,  // Show visualizer on music card (disabled for low-memory optimization)
  generateSongCard: true,  // custom song card image, if false uses thumbnail
  metadataTag: true,  // If true, always show Song Details even when the card image is present
  lowMemoryMode: true,   // Performance optimizations for low-memory environments (512MB RAM)
  errorLog: "", 
  nodes: [
      {
      name: process.env.LAVALINK_NAME || "MainNode",
      password: process.env.LAVALINK_PASSWORD || "",
      host: process.env.LAVALINK_HOST || "localhost",
      port: Number(process.env.LAVALINK_PORT) || 2333,
      secure: process.env.LAVALINK_SECURE === "true"
    }
  ]
}
