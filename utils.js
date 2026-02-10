/**
 * Create a Discord embed response for Pokemon
 */
function createPokemonEmbed(pokemon) {
    return {
        color: 0xFF6B6B,
        title: `<@${userId}>'s Pokémon of the Day: ${pokemon.name}`,
        image: { url: pokemon.imageUrl },
        fields: [
            { name: 'ID', value: `#${pokemon.id}`, inline: true },
            { name: 'Type', value: pokemon.types, inline: true },
            { name: 'Height', value: pokemon.height, inline: true },
            { name: 'Weight', value: pokemon.weight, inline: true },
            { name: '❤️ HP', value: String(pokemon.hp), inline: true },
            { name: '⚔️ Attack', value: String(pokemon.attack), inline: true },
            { name: '🛡️ Defense', value: String(pokemon.defense), inline: true },
            { name: '✨ Sp. Attack', value: String(pokemon.spAtk), inline: true },
            { name: '🌟 Sp. Defense', value: String(pokemon.spDef), inline: true },
            { name: '⚡ Speed', value: String(pokemon.speed), inline: true },
            { name: 'Moves', value: pokemon.moves || 'N/A', inline: false }
        ],
        footer: { text: 'Come back tomorrow for a new Pokémon!' },
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    createPokemonEmbed
};
