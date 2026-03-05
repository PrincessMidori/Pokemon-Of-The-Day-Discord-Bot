const dbService        = require('../services/dbService');
const pokemonService   = require('../services/pokemonService');
const inventoryService = require('../services/inventoryService');
const { COOLDOWN_MS, EGG_CATCH_THRESHOLD } = require('../constants');

const definition = {
  name:        'potd',
  description: 'Get your Pokémon of the day!',
};

async function handle(user, guildName) {
  // ── Cooldown check ──────────────────────────────────────────────────────────
  const recentEntry = await dbService.getUserRecentPokemon(user.id);

  if (recentEntry) {
    const elapsed = Date.now() - new Date(recentEntry.timestamp).getTime();
    if (elapsed < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - elapsed;
      const hours     = Math.floor(remaining / 3_600_000);
      const minutes   = Math.floor((remaining % 3_600_000) / 60_000);
      return { onCooldown: true, timeLeft: `${hours}h ${minutes}m` };
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
  // fullCollection.length + 1 because the catch above was just saved
  const totalCatches = fullCollection.length + 1;
  let newEgg = false;

  if (totalCatches % EGG_CATCH_THRESHOLD === 0) {
    await inventoryService.giveEgg(user.id);
    newEgg = true;
  }

  return { onCooldown: false, pokemon, newEgg };
}

module.exports = { definition, handle };