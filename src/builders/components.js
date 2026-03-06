const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { MAX_TEAM_SIZE } = require('../constants');

// Pokédex navigation row — L | SELECT | START | R
// pokemonId and favourites drive the SELECT button state.
function buildPokedexButtons(page, collectionLength, pokemonId, favourites = []) {
  const isFavourited = favourites.includes(pokemonId);
  const isFull       = favourites.length >= MAX_TEAM_SIZE;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('L')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('select_pokemon')
      .setLabel('SELECT')
      // Green = already in team (click removes), grey = not in team (click adds)
      .setStyle(isFavourited ? ButtonStyle.Success : ButtonStyle.Secondary)
      // Disabled only when team is full and this pokemon is not already in it
      .setDisabled(isFull && !isFavourited),
    new ButtonBuilder()
      .setCustomId('profile')
      .setLabel('START')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('R')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === collectionLength - 1),
  );
}

// Profile screen buttons — driven by egg state from inventoryService.getEggState()
function buildProfileButtons(eggState) {
  const buttons = [];

  if (eggState === 'ready') {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('hatch_egg')
        .setLabel('🥚 Hatch Egg!')
        .setStyle(ButtonStyle.Success),
    );
  } else if (eggState === 'unincubated') {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('incubate_egg')
        .setLabel('🌡️ Incubate Egg')
        .setStyle(ButtonStyle.Secondary),
    );
  }
  // 'waiting' and 'none' show no egg button — timer is visible in the embed text

  buttons.push(
    new ButtonBuilder()
      .setCustomId('back_to_pokedex')
      .setLabel('← Back')
      .setStyle(ButtonStyle.Secondary),
  );

  return new ActionRowBuilder().addComponents(buttons);
}

// Password modal — shared by all password-protected commands.
// Each command passes a unique customId so the modal submit handler can
// identify which command triggered it. Defaults to 'modal' for debug-shiny.
function buildModal(customId = 'modal') {
  const passwordInput = new TextInputBuilder()
    .setCustomId('password_field')
    .setLabel('Enter Password')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle('Command Access')
    .addComponents(new ActionRowBuilder().addComponents(passwordInput));
}

module.exports = { buildPokedexButtons, buildProfileButtons, buildModal };