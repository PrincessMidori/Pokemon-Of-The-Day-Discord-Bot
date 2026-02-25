const { REST, Routes } = require('discord.js');
const pokemonService = require('./services/pokemonService');
const dbService = require('./services/dbService');

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

async function handlePotdCommand(userId, guildName) {
    try {
        const recentEntry = await dbService.getUserRecentPokemon(user.id);
        const cooldown = 12 * 60 * 60 * 1000; // 12h in milliseconds
        const now = Date.now();

        if (recentEntry) {
            const recentTimestamp = new Date(recentEntry.timestamp).getTime();
            const timeElapsed = now - recentTimestamp;

            if (timeElapsed < cooldown) {
                const timeRemaining = cooldown - timeElapsed;

                const totalMinutes = Math.floor(timeRemaining / 60000);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;

                return { onCooldown: true, timeLeft: `${hours}h ${minutes}m` };
            }
        }

        const pokemon = await pokemonService.getRandomPokemon();
        await dbService.addUserPokemon(user, pokemon, guildName);

        return { onCooldown: false, pokemon };
        
    } catch (error) {
        console.error(error);
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