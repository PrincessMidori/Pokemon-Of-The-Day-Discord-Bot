const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const { MAX_TEAM_SIZE } = require('../constants');

// Pokédex navigation row — L | SELECT | START | R | 📋
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
    new ButtonBuilder()
      .setCustomId('list_view')
      .setLabel('📋')
      .setStyle(ButtonStyle.Secondary),
  );
}

// Pokémon list view — a select-menu showing up to 25 entries at a time,
// plus Prev / Next / Back buttons to navigate within the list.
// listOffset is the index of the first entry currently shown.
function buildPokemonListComponents(collection, listOffset) {
  const slice = collection.slice(listOffset, listOffset + 25);

  const options = slice.map((entry, i) => {
    const shinyMark = entry.pokemon.isShiny ? '✨ ' : '';
    const label     = `#${listOffset + i + 1} — ${shinyMark}${entry.pokemon.name}`.substring(0, 100);
    return new StringSelectMenuOptionBuilder()
      .setLabel(label)
      .setValue(String(listOffset + i));
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('jump_to_pokemon')
    .setPlaceholder(
      `Entries ${listOffset + 1}–${Math.min(listOffset + 25, collection.length)} of ${collection.length} — pick one to jump`,
    )
    .addOptions(options);

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('list_prev')
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(listOffset === 0),
    new ButtonBuilder()
      .setCustomId('list_next')
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(listOffset + 25 >= collection.length),
    new ButtonBuilder()
      .setCustomId('back_from_list')
      .setLabel('← Back')
      .setStyle(ButtonStyle.Secondary),
  );

  return [
    new ActionRowBuilder().addComponents(selectMenu),
    navRow,
  ];
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

// Standalone egg button row — same appearance as the egg button inside
// buildProfileButtons but without the Back button.
// Used on the /potd reply so the user can manage their egg without opening
// the Pokédex.  Returns null when no button is needed for this egg state
// ('waiting' and 'none' have nothing actionable to show).
function buildEggButtons(eggState) {
  if (eggState === 'ready') {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('hatch_egg')
        .setLabel('🥚 Hatch Egg!')
        .setStyle(ButtonStyle.Success),
    );
  }
  if (eggState === 'unincubated') {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('incubate_egg')
        .setLabel('🌡️ Incubate Egg')
        .setStyle(ButtonStyle.Secondary),
    );
  }
  return null; // 'waiting' and 'none' — no actionable button
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

module.exports = {
  buildPokedexButtons,
  buildPokemonListComponents,
  buildProfileButtons,
  buildEggButtons,
  buildModal,
};