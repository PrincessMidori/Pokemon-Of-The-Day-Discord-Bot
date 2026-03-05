const dbService        = require('../services/dbService');
const pokemonService   = require('../services/pokemonService');
const inventoryService = require('../services/inventoryService');
const { EGG_CATCH_THRESHOLD, TIMEZONE } = require('../constants');

const definition = {
  name:        'potd',
  description: 'Get your Pokémon of the day!',
};

// Returns the calendar date string (YYYY-MM-DD) for a given Date object
// in the Vienna timezone. DST is handled automatically by Intl.
function toViennaDateString(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(date);
}

// Returns milliseconds until the next midnight in Vienna time.
// Used to show the user how long until they can roll again.
function msUntilMidnightVienna() {
  const now   = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour:     'numeric',
    minute:   'numeric',
    second:   'numeric',
    hour12:   false,
  }).formatToParts(now);

  const h = Number(parts.find(p => p.type === 'hour').value);
  const m = Number(parts.find(p => p.type === 'minute').value);
  const s = Number(parts.find(p => p.type === 'second').value);

  const secondsPassedToday    = h * 3600 + m * 60 + s;
  const secondsUntilMidnight  = 86400 - secondsPassedToday;
  return secondsUntilMidnight * 1000;
}

async function handle(user, guildName) {
  // ── Cooldown check ──────────────────────────────────────────────────────────
  const recentEntry = await dbService.getUserRecentPokemon(user.id);

  if (recentEntry) {
    const todayVienna  = toViennaDateString(new Date());
    const catchVienna  = toViennaDateString(new Date(recentEntry.timestamp));

    if (todayVienna === catchVienna) {
      const nextMidnightUnix = Math.floor((Date.now() + msUntilMidnightVienna()) / 1000);
      return { onCooldown: true, timeLeft: `<t:${nextMidnightUnix}:R>` };
    }
  }

  // ── Roll for Pokémon ────────────────────────────────────────────────────────
  const fullCollection = await dbService.getUserAllPokemons(user.id);
  const ownedIds       = fullCollection.map(entry => entry.pokemon.id);
  const hasShinyCharm  = await inventoryService.userHasShinyCharm(user.id);

  const pokemon = await pokemonService.getRandomPokemon({
    excludedIds:      ownedIds,
    shinyCharmActive: hasShinyCharm,
  });

  await dbService.addUserPokemon(user, pokemon, guildName);

  // ── Egg threshold check ─────────────────────────────────────────────────────
  const totalCatches = fullCollection.length + 1;
  let newEgg = false;

  if (totalCatches % EGG_CATCH_THRESHOLD === 0) {
    await inventoryService.giveEgg(user.id);
    newEgg = true;
  }

  return { onCooldown: false, pokemon, newEgg };
}

module.exports = { definition, handle };