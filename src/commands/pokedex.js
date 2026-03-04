const dbService = require('../services/dbService');

// Slash command definition sent to Discord API
const definition = {
  name:        'potd-pokedex',
  description: 'Display all Pokémons you have caught so far',
};

// Business logic for /potd-pokedex
async function handle(user) {
  return await dbService.getUserAllPokemons(user.id);
}

module.exports = { definition, handle };