const { Client, GatewayIntentBits, EmbedBuilder, Partials } = require('discord.js');
require('dotenv').config();

const { registerCommands, handlePotdCommand } = require('./commands');
const cacheService = require('./services/cacheService');
const { createPokemonEmbed } = require('./utils');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages // Allows the bot to work in DMs
  ],
  partials: [Partials.Channel] // Necessary for DM support in v14
});

client.once('ready', () => {
  console.log(`Initialising client ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  if (commandName === 'potd') {
    try {
      await interaction.deferReply();

      const pokemon = await handlePotdCommand(user.id);
      const embed = createPokemonEmbed(pokemon, user.id);
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error:', error.message);
      
      const errorPayload = { 
        content: 'An error occurred while fetching Pokémon.',
        ephemeral: true 
      };

      if (interaction.deferred) {
        await interaction.editReply(errorPayload);
      } else {
        await interaction.reply(errorPayload);
      }
    }
  }
});

async function start() {
  try {
    console.log('Starting Pokemon of the Day Discord Bot');
    await cacheService.initializeRedis();
    await registerCommands();
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Startup error:', error.message);
    process.exit(1);
  }
}

start();