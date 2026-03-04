const pokemonService = require('../services/pokemonService');

// Slash command definition sent to Discord API
const definition = {
  name:                     'potd-debug-shiny',
  description:              'Debug command: display random Shiny',
  default_member_permissions: '0',  // Admin only
};

// Business logic for /potd-debug-shiny
async function handle() {
  return await pokemonService.getRandomPokemon({ debug: true });
}

module.exports = { definition, handle };