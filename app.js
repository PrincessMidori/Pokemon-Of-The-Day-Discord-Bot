require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const { registerCommands }    = require('./src/commands');
const { handleInteraction }   = require('./src/handlers/interactionHandler');
const dbService               = require('./src/services/dbService');
const { STATUS_UPDATE_INTERVAL_MS } = require('./src/constants');

const client = new Client({
  intents:  [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
});

client.once('clientReady', async (c) => {
  console.log(`[✓] Logged in as ${c.user.tag}`);

  const updateStatus = async () => {
    const total = await dbService.getTotalCatchCount();
    client.user.setActivity(`${total} Pokémons caught`, { type: 3 }); // 3 = Watching
    console.log(`[i] Status updated: ${total} catches`);
  };

  await updateStatus();
  setInterval(updateStatus, STATUS_UPDATE_INTERVAL_MS);
});

client.on('interactionCreate', handleInteraction);

async function start() {
  try {
    console.log('[i] Starting Pokémon of the Day bot...');
    await dbService.initializeDatabase();
    console.log('[✓] Database connected');
    await registerCommands();
    await client.login(process.env.DISCORD_TOKEN);
    console.log('[✓] Client login successful');
  } catch (error) {
    console.error('[✗] Startup error:', error.message);
    process.exit(1);
  }
}

start();