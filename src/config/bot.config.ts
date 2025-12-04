export const botConfig = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  guildId: process.env.DISCORD_GUILD_ID || '', // Optional - if not provided, uses global commands
};

export const gameConfig = {
  maxDay: 90,
  bossFightDay: 45,
  anomalyChance: 0.25, // 25% chance
  actionsPerDay: {
    easy: 5,
    normal: 4,
    hard: 3,
    another_story: 3,
  },
  loan: {
    verificationTimeMinutes: 30,
    minCredibilityScore: 50,
  },
};

