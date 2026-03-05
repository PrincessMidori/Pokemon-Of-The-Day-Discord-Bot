const { TOTAL_POKEMON_COUNT, SHINY_CHANCE } = require('../constants');

const POKEAPI_URL = 'https://pokeapi.co/api/v2';

async function getRandomPokemon({ debug = false, excludedIds = [], shinyCharmActive = false, forceShiny = null } = {}) {
  try {
    // forceShiny is set when hatching an egg — the shiny result was already
    // rolled at egg odds by inventoryService.hatchEgg, so we skip the normal roll.
    let isShiny;
    if (forceShiny !== null) {
      isShiny = forceShiny;
      console.log(`[Egg hatch] Shiny forced to: ${isShiny ? '✨ SHINY' : 'normal'}`);
    } else {
      const effectiveChance = SHINY_CHANCE * (shinyCharmActive ? 2 : 1);
      const shinyRoll = Math.random();
      // Roll for shiny (debug sets odds for shiny 1 / 2)
      isShiny = shinyRoll < (debug ? 1 / 2 : effectiveChance);
    }

    // Build the pool of available IDs
    const allIds       = Array.from({ length: TOTAL_POKEMON_COUNT }, (_, i) => i + 1);
    const availablePool = isShiny
      ? allIds                                             // shinies can duplicate
      : allIds.filter(id => !excludedIds.includes(id));   // normals must be new

    if (availablePool.length === 0) {
      throw new Error('No available Pokémon left in the pool.');
    }

    const randomId = availablePool[Math.floor(Math.random() * availablePool.length)];

    const response = await fetch(`${POKEAPI_URL}/pokemon/${randomId}`);
    if (!response.ok) throw new Error(`PokéAPI Error: ${response.status}`);

    const data = await response.json();
    return formatPokemonData(data, isShiny);
  } catch (error) {
    console.error('[✗] getRandomPokemon:', error.message);
    throw error;
  }
}

function formatPokemonData(data, isShiny) {
  const getStat = (name) => data.stats.find(s => s.stat.name === name)?.base_stat || 0;

  let displayName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  if (isShiny) displayName = `Shiny ${displayName}`;

  const imageUrl = isShiny
    ? (data.sprites.other['official-artwork'].front_shiny || data.sprites.front_shiny)
    : (data.sprites.other['official-artwork'].front_default || data.sprites.front_default);

  const spriteUrl = isShiny
    ? data.sprites.front_shiny
    : data.sprites.front_default;

  // Level-up moves only, sorted by level descending, top 8
  const levelUpMoves = data.moves
    .filter(m => m.version_group_details.some(d => d.move_learn_method.name === 'level-up'))
    .map(m => {
      const details = m.version_group_details.find(d => d.move_learn_method.name === 'level-up');
      return { name: m.move.name, level: details?.level_learned_at ?? 0 };
    })
    .sort((a, b) => b.level - a.level)
    .slice(0, 8)
    .map(m => m.name);

  // Fallback: first 8 available moves if no level-up moves exist
  const movesList = levelUpMoves.length > 0
    ? levelUpMoves.join(', ')
    : data.moves.slice(0, 8).map(m => m.move.name).join(', ');

  return {
    id:       data.id,
    name:     displayName,
    imageUrl,
    spriteUrl,
    isShiny,
    types:    data.types.map(t => t.type.name).join(', '),
    hp:       getStat('hp'),
    attack:   getStat('attack'),
    defense:  getStat('defense'),
    spAtk:    getStat('special-attack'),
    spDef:    getStat('special-defense'),
    speed:    getStat('speed'),
    moves:    movesList || 'None',
    height:   (data.height / 10).toFixed(1) + 'm',
    weight:   (data.weight / 10).toFixed(1) + 'kg',
  };
}

module.exports = { getRandomPokemon };