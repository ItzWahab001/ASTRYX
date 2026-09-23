const { ActivityType } = require('discord.js');

module.exports = {
  // Set OWNER_ID in your environment (or paste your own Discord user ID here)
  ownerId: process.env.OWNER_ID || '',
  status: {
    rotateDefault: [
      { name: 'Netflix', type: ActivityType.Watching },
      { name: 'GTA VI', type: ActivityType.Playing },
      { name: 'on YouTube', type: ActivityType.Streaming, url: 'https://www.twitch.tv/glaceytt' },
      { name: 'Spotify', type: ActivityType.Custom },
    ],
    songStatus: true
  },
  // Create your own app at https://developer.spotify.com/dashboard
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
}
