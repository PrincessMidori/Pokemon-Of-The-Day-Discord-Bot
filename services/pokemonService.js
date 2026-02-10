const axios = require('axios');

const POKEAPI_URL = 'https://pokeapi.co/api/v2';

/**
 * Get a random Pokémon by ID (1-898 are Generation 1-8)
 */
async function getRandomPokemon() {
    try {
        const randomId = Math.floor(Math.random() * 898) + 1;
        const response = await axios.get(`${POKEAPI_URL}/pokemon/${randomId}`);
        return formatPokemonData(response.data);
    } catch (error) {
        console.error('Error fetching Pokemon:', error.message);
        throw new Error('Failed to fetch Pokemon data');
    }
}

/**
 * Format the API response into a user-friendly object
 */
function formatPokemonData(data) {
    const isShiny = Math.random() < (1 / 648);
    const hpStat = data.stats.find(s => s.stat.name === 'hp');
    const attackStat = data.stats.find(s => s.stat.name === 'attack');
    const defenseStat = data.stats.find(s => s.stat.name === 'defense');
    const spAtkStat = data.stats.find(s => s.stat.name === 'special-attack');
    const spDefStat = data.stats.find(s => s.stat.name === 'special-defense');
    const speedStat = data.stats.find(s => s.stat.name === 'speed');

    let displayName = data.name.charAt(0).toUpperCase() + data.name.slice(1);

    if (isShiny) {
        displayName = `Shiny ${displayName}`;
    }

    const imageUrl = isShiny 
        ? (data.sprites.other['official-artwork'].front_shiny || data.sprites.front_shiny)
        : (data.sprites.other['official-artwork'].front_default || data.sprites.front_default);

    return {
        id: data.id,
        name: displayName,
        imageUrl: imageUrl,
        isShiny: isShiny,
        types: data.types.map(t => t.type.name).join(', '),
        hp: hpStat ? hpStat.base_stat : 0,
        attack: attackStat ? attackStat.base_stat : 0,
        defense: defenseStat ? defenseStat.base_stat : 0,
        spAtk: spAtkStat ? spAtkStat.base_stat : 0,
        spDef: spDefStat ? spDefStat.base_stat : 0,
        speed: speedStat ? speedStat.base_stat : 0,
        moves: data.moves.slice(0, 4).map(m => m.move.name).join(', '),
        height: (data.height / 10).toFixed(1) + 'm',
        weight: (data.weight / 10).toFixed(1) + 'kg'
    };
}

module.exports = {
    getRandomPokemon
};
