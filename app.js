const { Client, GatewayIntentBits, Partials, 
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

const { registerCommands, handlePotdCommand, handleDebugShinyCommand } = require('./commands');
const dbService = require('./services/dbService');
const { createPokemonEmbed } = require('./utils');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`Initialising client ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {

// Handle slash commands
  if (interaction.isChatInputCommand()) {
    const { commandName, user } = interaction;

    // potd command
    if (commandName === 'potd') {
      try {
        const guildName = interaction.guild ? interaction.guild.name : 'Direct Message';
        const result = await handlePotdCommand(interaction.user, guildName);

        // User has cooldown
        if (result.onCooldown) {
          console.log(`POTD: User ${user.tag} in ${guildName} used /potd command but they still have cooldown of ${result.timeLeft}`)
          return await interaction.reply({
            content: `You already rolled for today. Time remaining until next roll: **${result.timeLeft}**`,
            ephemeral: true
          });
        }

        // User can roll for a new Pokemon
        await interaction.deferReply();
        const embed = createPokemonEmbed(result.pokemon, interaction.user.id);
        await interaction.editReply({ embeds: [embed] });

      } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'Something went wrong. Please contact my creator.', ephemeral: true });
      }
    }

    // potd-debug-shiny command
    if (commandName === 'potd-debug-shiny') {
      console.log(`DEBUG: User ${user.tag} (${user.id}) initiated /potd-debug-shiny`);

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
    await dbService.initialiseDatabase();
    await registerCommands();
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Startup error:', error.message);
    process.exit(1);
  }
}

start();