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
      .setLabel('L')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('R')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === collectionLength - 1),
  );
}

// Password modal for /potd-debug-shiny
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

module.exports = { buildPokedexButtons, buildModal };