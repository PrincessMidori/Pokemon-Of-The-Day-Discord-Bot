const { Client, GatewayIntentBits, Partials, 
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

const { registerCommands, handlePotdCommand, handleDebugShinyCommand, handlePokedexCommand } = require('./commands');
const dbService = require('./services/dbService');
const { createPotdEmbed, createPokedexEmbed } = require('./utils');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

client.once('clientReady', (c) => {
  console.log(`Initialising client ${c.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  const { commandName, user } = interaction;

  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    
    // potd command
    if (commandName === 'potd') {
      try {
        const guildName = interaction.guild ? interaction.guild.name : 'Direct Message';
        const result = await handlePotdCommand(user, guildName);

        if (result.onCooldown) {
          console.log(`POTD: User ${user.tag} in ${guildName} used /potd command but they still have cooldown of ${result.timeLeft}`);
          return await interaction.reply({
            content: `You already rolled for today. Time remaining until next roll: **${result.timeLeft}**`,
            ephemeral: true
          });
        }

        console.log(`POTD: User ${user.tag} in ${guildName} used /potd command and got ${result.pokemon.name}`);
        await interaction.deferReply();
        const embed = createPotdEmbed(result.pokemon, user.id);
        await interaction.editReply({ embeds: [embed] });

      } catch (error) {
        console.error('[✗] Command error: potd - ',error);
        if (interaction.deferred) await interaction.editReply('Something went wrong. Please contact my creator.');
        else await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
      }
    }

    // potd-debug-shiny command
    if (commandName === 'potd-debug-shiny') {
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

    // potd-pokedex command
    if (commandName === 'potd-pokedex') {
      try {
        const collection = await handlePokedexCommand(user);

        if (collection.length === 0) {
          return await interaction.reply({ 
            content: 'Your Pokédex is empty. You can expand it by using /potd command', 
            ephemeral: true 
          });
        }

        await interaction.deferReply();
        const embed = createPokedexEmbed(user, collection);
        await interaction.editReply({ embeds: [embed] });

      } catch (error) {
        console.error('[✗] Command error: potd-pokedex - ',error);
        if (interaction.deferred) await interaction.editReply('Something went wrong.');
        else await interaction.reply({ content: 'An error occurred.', ephemeral: true });
      }
    }
  }

  // Handle modal submission
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'debug_modal') {
      const input = interaction.fields.getTextInputValue('password_field');
      
      if (input !== process.env.DEBUG_PASSWORD) {
        console.warn(`DEBUG: User ${user.tag} tried password: "${input}"`);
        return await interaction.reply({ content: 'Access denied.', ephemeral: true });
      }

      try {
        await interaction.deferReply(); 
        const pokemon = await handleDebugShinyCommand();
        const embed = createPotdEmbed(pokemon, user.id);
        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('[✗] Debug Error:', error.message);
        await interaction.editReply('potd-debug-shiny failed.');
      }
    }
  }
});

async function start() {
  try {
    console.log('Starting Pokemon of the Day Discord Bot');
    await dbService.initializeDatabase(); 
    console.log('[✓] Database connected')
    await registerCommands();
    console.log('[✓] Registering commands')
    await client.login(process.env.DISCORD_TOKEN);
    console.log('[✓] CLient login successful')
  } catch (error) {
    console.error('[✗] Startup error:', error.message);
    process.exit(1);
  }
}

start();