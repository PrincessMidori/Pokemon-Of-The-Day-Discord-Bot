const mongoose = require('mongoose');

async function initializeDatabase() {
  await mongoose.connect(process.env.MONGO_URL);
}

const catchEntrySchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true },
  username:  String,
  pokemon:   Object,
  location:  String,
  timestamp: { type: Date, default: Date.now },
});

const CatchEntry = mongoose.model('CatchEntry', catchEntrySchema);

// Add new Pokemon as a database entry for a given user
async function addUserPokemon(user, pokemonData, guildName) {
  try {
    const entry = new CatchEntry({
      userId:    user.id,
      username:  user.username,
      pokemon:   pokemonData,
      location:  guildName || 'Direct Message',
      timestamp: new Date(),
    });
    await entry.save();
    return entry;
  } catch (error) {
    console.error('[✗] addUserPokemon:', error);
    throw error;
  }
}

// Retrieve most recent Pokemon for a given user
async function getUserRecentPokemon(userId) {
  try {
    return await CatchEntry.findOne({ userId })
      .sort({ timestamp: -1 })
      .lean();
  } catch (error) {
    console.error('[✗] getUserRecentPokemon:', error);
    throw error;
  }
}

// Retrieve all Pokemons for a given user
async function getUserAllPokemons(userId) {
  try {
    return await CatchEntry.find({ userId })
      .sort({ timestamp: -1 })
      .lean();
  } catch (error) {
    console.error('[✗] getUserAllPokemons:', error);
    throw error;
  }
}

// Get the total number of catches across all users
async function getTotalCatchCount() {
  try {
    return await CatchEntry.countDocuments();
  } catch (error) {
    console.error('[✗] getTotalCatchCount:', error);
    return 0;
  }
}

module.exports = {
  initializeDatabase,
  addUserPokemon,
  getUserRecentPokemon,
  getUserAllPokemons,
  getTotalCatchCount,
};