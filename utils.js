
const { TOTAL_POKEMON_COUNT } = require('./services/pokemonService');

// potd command result
function createPotdEmbed(pokemon, userId) {

    const trainer = `<@${userId}>`;
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
function createPokedexEmbed(user, collection, page = 0) {
    const pokemon = collection[page].pokemon;
    const dateCaught = new Date(collection[page].timestamp).toLocaleDateString('en-GB');
    const bulbapediaLink = `https://bulbapedia.bulbagarden.net/wiki/${pokemon.name}_(Pok%C3%A9mon)`;

    return {
        color: 0x9B59B6,
        title: `${user.displayName}'s Pokédex`,
        description: `**Entry #${page + 1} of ${collection.length}**`,
        thumbnail: { url: pokemon.spriteUrl },
        fields: [
            { name: 'Name', value: pokemon.name, inline: true },
            { name: 'Date Caught', value: dateCaught, inline: true },
            { name: 'Wiki Entry', value: `[Bulbapedia Page](${bulbapediaLink})` }
        ],
        footer: { text: `${1025 - collection.length} left to catch.` },
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    createPotdEmbed,
    createPokedexEmbed
};
