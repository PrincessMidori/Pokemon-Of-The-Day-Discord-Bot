const { COLORS, TOTAL_POKEMON_COUNT, EGG_SPRITE_URL, SHINY_CHARM_SPRITE_URL } = require('../constants');

// ─── /potd result ─────────────────────────────────────────────────────────────

function createPotdEmbed(pokemon, userId) {
  const trainer     = `<@${userId}>`;
  const displayName = pokemon.isShiny ? `✨ ${pokemon.name} ✨` : pokemon.name;

  return {
    color:       pokemon.isShiny ? COLORS.POTD_SHINY : COLORS.POTD_NORMAL,
    title:       `Pokémon of the Day: ${displayName}`,
    description: `**Trainer:** ${trainer}`,
    image:       { url: pokemon.imageUrl },
    fields: [
      { name: '🔢 ID',          value: `#${pokemon.id}`,           inline: true },
      { name: '🧬 Type',        value: pokemon.types,               inline: true },
      { name: '📏 Height',      value: pokemon.height,              inline: true },
      { name: '⚖️ Weight',      value: pokemon.weight,              inline: true },
      { name: '❤️ HP',          value: String(pokemon.hp),          inline: true },
      { name: '⚔️ Attack',      value: String(pokemon.attack),      inline: true },
      { name: '🛡️ Defense',     value: String(pokemon.defense),     inline: true },
      { name: '🔮 Sp. Attack',  value: String(pokemon.spAtk),       inline: true },
      { name: '🔰 Sp. Defense', value: String(pokemon.spDef),       inline: true },
      { name: '⚡ Speed',       value: String(pokemon.speed),       inline: true },
      { name: '📜 Moves',       value: pokemon.moves || 'N/A',      inline: false },
    ],
    footer:    { text: 'Come back tomorrow for a new Pokémon!' },
    timestamp: new Date().toISOString(),
  };
}

// ─── /potd-pokedex result ─────────────────────────────────────────────────────

function createPokedexEmbed(user, collection, page = 0) {
  const entry          = collection[page];
  const pokemon        = entry.pokemon;
  const dateCaught     = new Date(entry.timestamp).toLocaleDateString('en-GB');
  const bulbapediaLink = `https://bulbapedia.bulbagarden.net/wiki/${pokemon.name}_(Pok%C3%A9mon)`;

  return {
    color:       COLORS.POKEDEX,
    title:       `${user.displayName}'s Pokédex`,
    description: `**Entry #${page + 1} of ${collection.length}**`,
    thumbnail:   { url: pokemon.spriteUrl },
    fields: [
      { name: 'Name',        value: pokemon.name,                            inline: true },
      { name: 'Date Caught', value: dateCaught,                              inline: true },
      { name: 'Wiki Entry',  value: `[Bulbapedia Page](${bulbapediaLink})`,  inline: false },
    ],
    footer:    { text: `${TOTAL_POKEMON_COUNT - collection.length} left to catch.` },
    timestamp: new Date().toISOString(),
  };
}

// ─── /potd-event result ───────────────────────────────────────────────────────

function createEventEmbed(user, pokemons) {
  const list = pokemons
    .map((p, i) => `**${i + 1}.** #${p.id} — ${p.name}`)
    .join('\n');

  return {
    color:       COLORS.EVENT,
    title:       '[REDACTED]',
    description: list,
    thumbnail:   { url: user.displayAvatarURL() },
    footer:      { text: `Rolled by ${user.displayName}` },
    timestamp:   new Date().toISOString(),
  };
}

// ─── Profile embed ────────────────────────────────────────────────────────────
// Receives a pre-computed stats object from computeProfileStats() in
// src/utils/profileStats.js — does not perform any calculations itself.

function createProfileEmbed(user, stats) {
  return {
    color:       COLORS.PROFILE,
    title:       `${user.displayName}'s Trainer Profile`,
    thumbnail:   { url: user.displayAvatarURL() },
    fields: [
      { name: '📦 Total Caught',    value: String(stats.totalCaught), inline: true  },
      { name: '✨ Shinies',         value: String(stats.shinyCount),  inline: true  },
      { name: '🧬 Most Common Type',value: stats.topType,             inline: true  },
      { name: '🌍 Top Region',      value: stats.topRegion,           inline: true  },
      { name: '🎒 Inventory',       value: stats.inventorySummary,    inline: false },
    ],
    footer:    { text: 'Use the buttons below to manage your eggs.' },
    timestamp: new Date().toISOString(),
  };
}

// ─── Item obtained embed ──────────────────────────────────────────────────────
// Used when the user earns an egg or an admin grants a shiny charm.

function createItemObtainedEmbed(user, itemType) {
  const items = {
    odd_egg: {
      name:        'Odd Egg',
      sprite:      EGG_SPRITE_URL,
      description: [
        'An Odd Egg obtained as a reward for catching Pokémon!',
        '',
        '* Must be **incubated for 24 hours** before it can hatch.',
        '* Has a **1 in 7** chance of hatching into a Shiny Pokémon.',
        '* Hatching grants a **bonus Pokémon**, bypassing the 12h cooldown.',
        '',
        'Manage your egg via the **START** button in `/potd-pokedex`.',
      ].join('\n'),
    },
    shiny_charm: {
      name:        'Shiny Charm',
      sprite:      SHINY_CHARM_SPRITE_URL,
      description: [
        'A glittering charm said to improve the odds of finding Shiny Pokémon.',
        '',
        '**Doubles your Shiny odds permanently** — now 2 in 300.',
        '🏆 Awarded for special events.',
        '',
        'View it in your profile via the **START** button in `/potd-pokedex`.',
      ].join('\n'),
    },
  };

  const item = items[itemType];

  return {
    color:       COLORS.ITEM_OBTAINED,
    title:       `${user.displayName} obtains: ${item.name}!`,
    thumbnail:   { url: item.sprite },
    description: item.description,
    timestamp:   new Date().toISOString(),
  };
}

module.exports = {
  createPotdEmbed,
  createPokedexEmbed,
  createEventEmbed,
  createProfileEmbed,
  createItemObtainedEmbed,
};