const mongoose = require('mongoose');

async function initializeDatabase() {
    await mongoose.connect(process.env.MONGO_URL);
}

const dbEntrySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    username: String,
    pokemon: Object,
    location: String,
    timestamp: { type: Date, default: Date.now },
    isEvent: { type: Boolean, default: false } // Event
});

const dbEntry = mongoose.model('dbEntry', dbEntrySchema);

// Add new Pokemon as a database entry for a given user
async function addUserPokemon(user, pokemonData, guildName, isEvent = false) {
    try {
        const newDbEntry = new dbEntry({
            userId: user.id,
            username: user.username,
            pokemon: pokemonData,
            location: guildName || 'Direct Message',
            timestamp: new Date(),
            isEvent: isEvent // Event
        });

        await newDbEntry.save();
        return newDbEntry;
    } catch (error) {
        console.error('[✗] addUserPokemon: ', error);
    }
}

// Retrieve most recent Pokemon for a given user
async function getUserRecentPokemon(userId) {
    try {
        const recentPokemon = await dbEntry.findOne({ userId })
        .sort({ timestamp: -1 })
        .lean();

        return recentPokemon;
    } catch (error) {
        console.error('[✗] getUserRecentPokemon: ', error);
    }
}

// Retrieve all Pokemons for a given user
async function getUserAllPokemons(userId) {
    try {
        return await dbEntry.find({ userId })
        .sort({ timestamp: -1 })
        .lean();
    } catch (error) {
        console.error('[✗] getUserAllPokemons: ', error);
        return [];
    }
}

// Event
async function getEventPullsCount(userId) {
    try {
        return await dbEntry.countDocuments({ userId, isEvent: true });
    } catch (error) {
        console.error('[✗] getEventPullsCount: ', error);
        return 0;
    }
}


module.exports = {
    initializeDatabase,
    addUserPokemon,
    getUserRecentPokemon,
    getUserAllPokemons,
    getEventPullsCount // Event
}