const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const { registerCommands, handlePotdCommand } = require('./commands');
const cacheService = require('./services/cacheService');
const { createPokemonEmbed } = require('./utils');

// Initialising client
const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] 
});

client.once('ready', () => {
  console.log(`Initialising client ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  // Interactions type - chat commands
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user, token } = interaction;

  if (commandName === 'potd') {
    try {
      // 1. Instantly acknowledge the command to prevent the 3s timeout
      await interaction.deferReply();

      // 2. Process logic
      const pokemon = await handlePotdCommand(user.id);
      
      // 3. Update the response with the actual Pokemon
      const embed = createPokemonEmbed(pokemon, user.id);
      your
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error:', error.message);
      
      // If the interaction was already deferred, we must edit the reply
      const errorPayload = { 
        content: 'An error occured while fetching Pokémon.',
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
    
    // Initialize Redis and register commands
    await cacheService.initializeRedis();
    await registerCommands();

    // Log in using your DISCORD_TOKEN
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Startup error:', error.message);
    process.exit(1);
  }
}

start();