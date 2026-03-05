// Silently removes the Shiny Charm from a user. No Discord message is sent.
// Use this to correct a mistake or revoke a charm that was granted in error.
//
// Usage:
//   docker exec pokemon-bot-app node scripts/removeShinyCharm.js <userId>
//
// Example:
//   docker exec pokemon-bot-app node scripts/removeShinyCharm.js 123456789012345678

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose         = require('mongoose');
const { REST, Routes } = require('discord.js');
const inventoryService = require('../src/services/inventoryService');

const [userId] = process.argv.slice(2);

if (!userId) {
  console.error('[✗] Missing argument.');
  console.error('    Usage: node scripts/removeShinyCharm.js <userId>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('[✓] Connected to database');

  const inventory = await inventoryService.getUserInventory(userId);
  const before    = inventory.items.length;

  // Remove all shiny_charm entries for this user
  inventory.items = inventory.items.filter(item => item.type !== 'shiny_charm');
  const removed   = before - inventory.items.length;

  if (removed === 0) {
    console.log(`[i] User ${userId} does not have a Shiny Charm. No changes made.`);
    process.exit(0);
  }

  await inventory.save();

  // Fetch username for a clearer log message — best effort, not critical
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const discordUser = await rest.get(Routes.user(userId)).catch(() => null);
  const label = discordUser ? `${discordUser.username} (${userId})` : userId;

  console.log(`[✓] Shiny Charm removed from ${label}`);
  process.exit(0);
}

run().catch(err => {
  console.error('[✗] removeShinyCharm failed:', err.message);
  process.exit(1);
});