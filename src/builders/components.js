const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

// Navigation buttons for /potd-pokedex pagination
function buildPokedexButtons(page, collectionLength) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('◀ L')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('R ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === collectionLength - 1),
  );
}

// Password modal for /potd-debug-shiny
function buildDebugModal() {
  const passwordInput = new TextInputBuilder()
    .setCustomId('password_field')
    .setLabel('Enter Debug Password')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId('debug_modal')
    .setTitle('Debug Access')
    .addComponents(new ActionRowBuilder().addComponents(passwordInput));
}

module.exports = { buildPokedexButtons, buildDebugModal };