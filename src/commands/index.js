const { REST, Routes } = require('discord.js');

const potd       = require('./potd');
const pokedex    = require('./pokedex');
const debugShiny = require('./debugShiny');
const event      = require('./event');

// Map of command name → handler function, used by interactionHandler
const commandHandlers = {
  'potd':             potd.handle,
  'potd-pokedex':     pokedex.handle,
  'potd-debug-shiny': debugShiny.handle,
  'potd-event':       event.handle,
};

// Array of definitions sent to the Discord API on startup
const definitions = [
  potd.definition,
  pokedex.definition,
  debugShiny.definition,
  event.definition,
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  console.log('[i] Registering slash commands...');
  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_APP_ID),
    { body: definitions },
  );
  console.log('[✓] Slash commands registered');
}

module.exports = { registerCommands, commandHandlers };