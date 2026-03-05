// Grant a Shiny Charm to a user and post the item-obtained embed to a channel.
//
// Usage:
//   docker exec pokemon-bot-app node scripts/grantShinyCharm.js <userId> <channelId>
//
// Example:
//   docker exec pokemon-bot-app node scripts/grantShinyCharm.js 123456789012345678 987654321098765432
//
// Find channelId: right-click a channel in Discord → Copy Channel ID
// Find userId:    right-click a user in Discord → Copy User ID
// (Developer Mode must be enabled in Discord settings → Advanced)

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose         = require('mongoose');
const { REST, Routes } = require('discord.js');
const inventoryService = require('../src/services/inventoryService');
const { createItemObtainedEmbed } = require('../src/builders/embeds');

const [userId, channelId] = process.argv.slice(2);

if (!userId || !channelId) {
  console.error('[✗] Missing arguments.');
  console.error('    Usage: node scripts/grantShinyCharm.js <userId> <channelId>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('[✓] Connected to database');

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  // Fetch the Discord user so we can use their display name and avatar in the embed
  const discordUser = await rest.get(Routes.user(userId)).catch(() => null);
  if (!discordUser) {
    console.error(`[✗] Could not fetch Discord user with ID: ${userId}`);
    process.exit(1);
  }

  const { alreadyOwned } = await inventoryService.grantShinyCharm(userId);

  if (alreadyOwned) {
    console.log(`[i] User ${discordUser.username} (${userId}) already has a Shiny Charm. No changes made.`);
    process.exit(0);
  }

  // The embed builder expects a user-like object with displayName and displayAvatarURL()
  const userLike = {
    displayName:       discordUser.global_name ?? discordUser.username,
    displayAvatarURL: () =>
      discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${userId}/${discordUser.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.discriminator ?? 0) % 5}.png`,
  };

  const embed = createItemObtainedEmbed(userLike, 'shiny_charm');

  await rest.post(Routes.channelMessages(channelId), {
    body: { embeds: [embed] },
  });

  console.log(`[✓] Shiny Charm granted to ${discordUser.username} (${userId})`);
  console.log(`[✓] Embed posted to channel ${channelId}`);
  process.exit(0);
}

run().catch(err => {
  console.error('[✗] grantShinyCharm failed:', err.message);
  process.exit(1);
});