const { Client, GatewayIntentBits, Partials, 
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

const { registerCommands, handlePotdCommand, handleDebugShinyCommand } = require('./commands');
const cacheService = require('./services/cacheService');
const { createPokemonEmbed } = require('./utils');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel] // Necessary for DM support in v14
});

client.once('ready', () => {
  console.log(`Initialising client ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {

// Handle slash commands
  if (interaction.isChatInputCommand()) {
    const { commandName, user } = interaction;

    if (commandName === 'potd') {
      try {
        await interaction.deferReply();
        const pokemon = await handlePotdCommand(user.id);
        const embed = createPokemonEmbed(pokemon, user.id);
        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error:', error.message);
        await interaction.editReply({ content: 'An error occurred.', ephemeral: true });
      }
    }

    if (commandName === 'potd-debug-shiny') {
      console.log(`User ${user.tag} (${user.id}) initiated /potd-debug-shiny`);

      const modal = new ModalBuilder()
        .setCustomId('debug_modal')
        .setTitle('Debug Access');

      const passwordInput = new TextInputBuilder()
        .setCustomId('password_field')
        .setLabel("Enter Debug Password")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(passwordInput));
      return await interaction.showModal(modal);
    }
  }

  // Handle modal submission
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'debug_modal') {
      const { user } = interaction;
      const input = interaction.fields.getTextInputValue('password_field');
      
      // Check the password first
      if (input !== process.env.DEBUG_PASSWORD) {
        // Log the failure and the attempted password
        console.warn(`DEBUG: User ${user.tag} tried password: "${input}"`);
        
        return await interaction.reply({ 
          content: 'Access denied. Nice try.', 
          ephemeral: true 
        });
      }

      console.log(`DEBUG: User ${user.tag} successfully accessed potd-debug-shiny command.`);

      try {
        await interaction.deferReply(); 
        const pokemon = await handleDebugShinyCommand();
        const embed = createPokemonEmbed(pokemon, user.id);
        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Debug Error:', error.message);
        await interaction.editReply('potd-debug-shiny failed.');
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