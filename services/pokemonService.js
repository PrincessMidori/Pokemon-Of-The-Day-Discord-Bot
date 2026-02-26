const POKEAPI_URL = 'https://pokeapi.co/api/v2';

const TOTAL_POKEMON_COUNT = 1025;
const SHINY_CHANCE = 1 / 300;

async function getRandomPokemon({ debug = false, excludedIds = [] } = {}) {
    try {
        // Create an array of all possible IDs
        const allIds = Array.from({ length: TOTAL_POKEMON_COUNT }, (_, i) => i + 1);
        
        // Filter out what the user already owns
        const availablePool = allIds.filter(id => !excludedIds.includes(id));

        if (availablePool.length === 0) {
            throw new Error('User has caught all Pokemons or something went wrong with the pool.');
        }

        // Pick randomly from the available pool
        const randomIndex = Math.floor(Math.random() * availablePool.length);
        const randomId = availablePool[randomIndex];
        
        const response = await fetch(`${POKEAPI_URL}/pokemon/${randomId}`);
        if (!response.ok) throw new Error(`PokéAPI Error: ${response.status}`);
        
        const data = await response.json();
        return formatPokemonData(data, debug);
    } catch (error) {
        console.error('Error fetching Pokemon:', error.message);
        throw error;
    }
}

function formatPokemonData(data, debug = false) {
    let isShiny = Math.random() < SHINY_CHANCE;
    const getStat = (name) => data.stats.find(s => s.stat.name === name)?.base_stat || 0;

    // DEBUG: forced Shiny Pokemon
    if (debug) {
        isShiny = true;
    }

    let displayName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    if (isShiny) {
        displayName = `Shiny ${displayName}`;
    }

    const imageUrl = isShiny 
        ? (data.sprites.other['official-artwork'].front_shiny || data.sprites.front_shiny)
        : (data.sprites.other['official-artwork'].front_default || data.sprites.front_default);

    const spriteUrl = isShiny 
        ? data.sprites.front_shiny 
        : data.sprites.front_default;
    
    // Filter moves learned by level-up
    const levelUpMoves = data.moves
        .filter(m => m.version_group_details.some(d => d.move_learn_method.name === 'level-up'))
        .map(m => {
            const details = m.version_group_details.find(d => d.move_learn_method.name === 'level-up');
            return { 
                name: m.move.name, 
                level: details ? details.level_learned_at : 0 
            };
        });

    // Sort by level descending (high-level moves first) and take the top 8
    const selectedMoves = levelUpMoves
        .sort((a, b) => b.level - a.level)
        .slice(0, 8)
        .map(m => m.name);

    // If no level-up moves exist, take the first 8 available
    const finalMovesList = selectedMoves.length > 0 
        ? selectedMoves.join(', ') 
        : data.moves.slice(0, 8).map(m => m.move.name).join(', ');

    return {
        id: data.id,
        name: displayName,
        imageUrl: imageUrl,
        spriteUrl: spriteUrl,
        isShiny: isShiny,
        types: data.types.map(t => t.type.name).join(', '),
        hp: getStat('hp'),
        attack: getStat('attack'),
        defense: getStat('defense'),
        spAtk: getStat('special-attack'),
        spDef: getStat('special-defense'),
        speed: getStat('speed'),
        moves: finalMovesList || 'None',
        height: (data.height / 10).toFixed(1) + 'm',
        weight: (data.weight / 10).toFixed(1) + 'kg'
    };
}

module.exports = {
    getRandomPokemon
};