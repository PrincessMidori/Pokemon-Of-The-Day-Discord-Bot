
const { TOTAL_POKEMON_COUNT } = require('./services/pokemonService');
const trainer = `<@${userId}>`;

// potd command result
function createPotdEmbed(pokemon, userId) {

    const displayName = pokemon.isShiny 
        ? `✨ ${pokemon.name} ✨` 
        : pokemon.name;

    // const trainer = userId === '138305948530769920' ? `🎂 Birthday Girl 🎉` : `<@${userId}>`

    return {
        color: pokemon.isShiny ? 0xF1C40F : 0xA8FF3D,
        title: `Pokémon of the Day: ${displayName}`,
        description: `**Trainer:** ${trainer}`,
        image: { url: pokemon.imageUrl },
        fields: [
            { name: '🔢 ID', value: `#${pokemon.id}`, inline: true },
            { name: '🧬 Type', value: pokemon.types, inline: true },
            { name: '📏 Height', value: pokemon.height, inline: true },
            { name: '⚖️ Weight', value: pokemon.weight, inline: true },
            { name: '❤️ HP', value: String(pokemon.hp), inline: true },
            { name: '⚔️ Attack', value: String(pokemon.attack), inline: true },
            { name: '🛡️ Defense', value: String(pokemon.defense), inline: true },
            { name: '🔮 Sp. Attack', value: String(pokemon.spAtk), inline: true },
            { name: '🔰 Sp. Defense', value: String(pokemon.spDef), inline: true },
            { name: '⚡ Speed', value: String(pokemon.speed), inline: true },
            { name: '📜 Moves', value: pokemon.moves || 'N/A', inline: false }
        ],
        footer: { text: 'Come back tomorrow for a new Pokémon!' },
        timestamp: new Date().toISOString()
    };
}

// Pokedex command result
function createPokedexEmbed(user, collection) {

    // Sort A-Z by name
    collection.sort((a, b) => a.pokemon.name.localeCompare(b.pokemon.name));

    const remaining = TOTAL_POKEMON_COUNT - collection.length;
    const columns = [[], [], []];
    
    // Distribute into columns
    collection.forEach((entry, index) => {
        columns[index % 3].push(`${entry.pokemon.spriteUrl} ${entry.pokemon.name}`);
    });

    return {
        color: 0x9B59B6,
        title: `${user.username}'s Pokédex`,
        thumbnail: { url: collection[0]?.pokemon.spriteUrl }, // Show the latest sprite in the corner
        fields: [
            { name: 'Collection A-Z', value: columns[0].join('\n') || 'Empty', inline: true },
            { name: '\u200b', value: columns[1].join('\n') || '\u200b', inline: true },
            { name: '\u200b', value: columns[2].join('\n') || '\u200b', inline: true },
        ],
        footer: { text: `${remaining} left to catch.` },
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    createPotdEmbed,
    createPokedexEmbed
};
