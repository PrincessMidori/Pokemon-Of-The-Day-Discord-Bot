const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const pokemonService = require('./services/pokemonService');
const cacheService = require('./services/cacheService');

// Define commands
const commands = [
    {
        name: 'potd',
        description: 'Get your Pokémon of the day!'
    }
];

/**
 * Register commands with Discord
 */
async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_APP_ID),
            { body: commands }
        );

        console.log('✓ Global slash commands registered successfully');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

/**
 * Handle the /potd command
 */
async function handlePotdCommand(userId) {
    try {
        // Check if user already has a Pokemon for today
        let pokemon = await cacheService.getUserPokemonOfDay(userId);

        if (!pokemon) {
            console.log(`Generating new Pokemon for user ${userId}`);
            // Get a new random Pokemon
            pokemon = await pokemonService.getRandomPokemon();
            // Cache it for 24 hours
            await cacheService.setUserPokemonOfDay(userId, pokemon);
        } else {
            console.log(`User ${userId} already has a Pokemon for today`);
        }

        return pokemon;
    } catch (error) {
        console.error('Error handling POTD command:', error);
        throw error;
    }
}

module.exports = {
    commands,
    registerCommands,
    handlePotdCommand
};
