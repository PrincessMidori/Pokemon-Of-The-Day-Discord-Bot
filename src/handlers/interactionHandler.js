const { ComponentType, MessageFlags }   = require('discord.js');
const { commandHandlers } = require('../commands');
const { createPotdEmbed, createPokedexEmbed }  = require('../builders/embeds');
const { buildPokedexButtons, buildDebugModal } = require('../builders/components');

// Main entry point — routes all incoming interactions
async function handleInteraction(interaction) {
  try {
    if (interaction.isChatInputCommand()) return handleSlashCommand(interaction);
    if (interaction.isModalSubmit())      return handleModalSubmit(interaction);
  } catch (error) {
    console.error('[✗] Unhandled interaction error:', error);
  }
}

// ─── Slash commands ────────────────────────────────────────────────────────────

async function handleSlashCommand(interaction) {
  const { commandName, user } = interaction;
  const guildName = interaction.guild?.name ?? 'Direct Message';

  if (commandName === 'potd')             return handlePotd(interaction, user, guildName);
  if (commandName === 'potd-pokedex')     return handlePokedex(interaction, user);
  if (commandName === 'potd-debug-shiny') return handleDebugShiny(interaction);
}

async function handlePotd(interaction, user, guildName) {
  try {
    const result = await commandHandlers['potd'](user, guildName);

    if (result.onCooldown) {
      console.log(`POTD: ${user.tag} in ${guildName} is on cooldown — ${result.timeLeft} remaining`);
      return interaction.reply({
        content:   `You already rolled today. Next roll in: **${result.timeLeft}**`,
        flags: MessageFlags.Ephemeral
      });
    }

    console.log(`POTD: ${user.tag} in ${guildName} got ${result.pokemon.name}`);
    await interaction.deferReply();
    return interaction.editReply({ embeds: [createPotdEmbed(result.pokemon, user.id)] });

  } catch (error) {
    console.error('[✗] /potd error:', error);
    const msg = 'Something went wrong. Please contact my creator.';
    return interaction.deferred
      ? interaction.editReply(msg)
      : interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
  }
}

async function handlePokedex(interaction, user) {
  try {
    const collection = await commandHandlers['potd-pokedex'](user);

    if (collection.length === 0) {
      return interaction.reply({ content: 'Your collection is empty.', flags: MessageFlags.Ephemeral });
    }

    let page = 0;

    const { resource } = await interaction.reply({
      embeds:     [createPokedexEmbed(user, collection, page)],
      components: [buildPokedexButtons(page, collection.length)],
      withResponse: true,
    });
    const response = resource.message;

    // Listen for button clicks for 5 minutes
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300_000,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Only the owner can flip pages.', flags: MessageFlags.Ephemeral });
      }

      if (i.customId === 'prev') page--;
      if (i.customId === 'next') page++;

      return i.update({
        embeds:     [createPokedexEmbed(user, collection, page)],
        components: [buildPokedexButtons(page, collection.length)],
      });
    });

  } catch (error) {
    console.error('[✗] /potd-pokedex error:', error);
    return interaction.reply({ content: 'Something went wrong.', flags: MessageFlags.Ephemeral });
  }
}

async function handleDebugShiny(interaction) {
  return interaction.showModal(buildDebugModal());
}

// ─── Modal submissions ─────────────────────────────────────────────────────────

async function handleModalSubmit(interaction) {
  const { user } = interaction;

  if (interaction.customId === 'debug_modal') {
    const input = interaction.fields.getTextInputValue('password_field');

    if (input !== process.env.DEBUG_PASSWORD) {
      console.warn(`[DEBUG] ${user.tag} failed password attempt`);
      return interaction.reply({ content: 'Access denied.', flags: MessageFlags.Ephemeral });
    }

    try {
      await interaction.deferReply();
      const pokemon = await commandHandlers['potd-debug-shiny']();
      return interaction.editReply({ embeds: [createPotdEmbed(pokemon, user.id)] });
    } catch (error) {
      console.error('[✗] Debug shiny error:', error.message);
      return interaction.editReply('potd-debug-shiny failed.');
    }
  }
}

module.exports = { handleInteraction };