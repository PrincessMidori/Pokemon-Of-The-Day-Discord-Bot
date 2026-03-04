const pokemonService = require('../services/pokemonService');
const { EVENT_POOL_SIZE } = require('../constants.js');

const definition = {
    name: 'potd-event',
    description: '[REDACTED]', // temporary
    default_member_permissions: '0',
}

async function handle() {
  const picks = await Promise.all(
    Array.from({ length: EVENT_POOL_SIZE }, () => pokemonService.getRandomPokemon())
  );
  return picks;
}

module.exports = { definition, handle };