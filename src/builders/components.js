const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

// Navigation buttons for /potd-pokedex — L | START | R
function buildPokedexButtons(page, collectionLength) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('L')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
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

// Profile screen buttons — driven by the user's current egg state.
// eggState is produced by inventoryService.getEggState().
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
  // 'waiting' and 'none' show no egg button — timer is visible in the embed itself

  buttons.push(
    new ButtonBuilder()
      .setCustomId('back_to_pokedex')
      .setLabel('← Back')
      .setStyle(ButtonStyle.Secondary),
  );

  return new ActionRowBuilder().addComponents(buttons);
}

// Password modal — reusable for all password-protected commands.
// Pass a unique customId per command so the modal submit handler can identify
// which command triggered it. Defaults to 'modal' for /potd-debug-shiny.
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