const { REST, Routes } = require('discord.js');
const pokemonService = require('./services/pokemonService');
const cacheService = require('./services/cacheService');

const commands = [
    {
        name: 'potd',
        description: 'Get your Pokémon of the day!'
    },
    {
        name: 'potd-debug-shiny',
        description: 'Debug command: display random Shiny',
        default_member_permissions: "0"
    }
];

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

async function handlePotdCommand(userId) {
    try {
        let pokemon = await cacheService.getUserPokemonOfDay(userId);

        if (!pokemon) {
            console.log(`Generating new Pokemon for user ${userId}`);
            pokemon = await pokemonService.getRandomPokemon();
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

async function handleDebugShinyCommand() {
return await pokemonService.getRandomPokemon({ debug: true });
}

module.exports = {
    commands,
    registerCommands,
    handlePotdCommand,
    handleDebugShinyCommand
};