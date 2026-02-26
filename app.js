const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require('discord.js');
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

const updateStatus = async () => {
        const total = await dbService.getTotalCatchCount();
        client.user.setActivity(`${total} Pokémons caught`, { type: 3 }); // 3 = Watching
        console.log(`[i] Status updated: ${total} catches`);
    };

    // Initial update when starting
    updateStatus();

    // Update every hour (3600000 milliseconds)
    setInterval(updateStatus, 3600000);

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

        // === Event START ===

        if (result.isEvent) {
          console.log(`=== EVENT ===: User ${user.tag} in ${guildName} used /potd command and got ${result.pokemon.name}. They have ${result.eventRemaining} pulls left.`);
            await interaction.reply({
              content: `✨ Special Event to compensate for 2 weeks of previous version! ✨ Your remaining pull amount: **${result.eventRemaining}**.`,
              ephemeral: true
            });
            const embed = createPotdEmbed(result.pokemon, user.id);
            return await interaction.followUp({ embeds: [embed] });
        }

        // === Event END ===

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
    const collection = await handlePokedexCommand(user);
    if (collection.length === 0) return interaction.reply({ content: 'Your collection is empty.', ephemeral: true });

    let currentPage = 0;

    // Create navigation buttons
const getButtons = (page) => new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('L') // Representing the L1 shoulder button
        .setStyle(ButtonStyle.Secondary) // Grey color like a Game Boy button
        .setDisabled(page === 0),
    new ButtonBuilder()
        .setCustomId('next')
        .setLabel('R') // Representing the R1 shoulder button
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === collection.length - 1)
);

    const response = await interaction.reply({
        embeds: [createPokedexEmbed(user, collection, currentPage)],
        components: [getButtons(currentPage)],
        fetchReply: true
    });

    // Create a collector to listen for button clicks for 5 minutes
    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 
    });

    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: "Only the owner can change pages.", ephemeral: true });

        if (i.customId === 'prev') currentPage--;
        if (i.customId === 'next') currentPage++;

        await i.update({
            embeds: [createPokedexEmbed(user, collection, currentPage)],
            components: [getButtons(currentPage)]
        });
    });
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