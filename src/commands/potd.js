const dbService     = require('../services/dbService');
const pokemonService = require('../services/pokemonService');
const { COOLDOWN_MS } = require('../constants');

// Slash command definition sent to Discord API
const definition = {
  name:        'potd',
  description: 'Get your Pokémon of the day!',
};

// Business logic for /potd
async function handle(user, guildName) {
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

  const fullCollection = await dbService.getUserAllPokemons(user.id);
  const ownedIds       = fullCollection.map(entry => entry.pokemon.id);
  const pokemon        = await pokemonService.getRandomPokemon({ excludedIds: ownedIds });

  await dbService.addUserPokemon(user, pokemon, guildName);
  return { onCooldown: false, pokemon };
}

module.exports = { definition, handle };