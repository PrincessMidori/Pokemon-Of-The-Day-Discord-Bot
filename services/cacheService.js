const redis = require('redis');

let client;

/**
 * Initialize Redis connection
 */
async function initializeRedis() {
    client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    console.log('✓ Redis connected');
}

/**
 * Get user's Pokemon of the day
 */
async function getUserPokemonOfDay(userId) {
    try {
        const cached = await client.get(`potd:${userId}`);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.error('Error retrieving from cache:', error);
        return null;
    }
}

/**
 * Set user's Pokemon of the day (expires after 12 hours)
 */
async function setUserPokemonOfDay(userId, pokemonData) {
    try {
        await client.setEx(
            `potd:${userId}`,
            86400 / 2, // 24 hours in seconds / 2 so that user can have fun earlier
            JSON.stringify(pokemonData)
        );
    } catch (error) {
        console.error('Error setting cache:', error);
    }
}

module.exports = {
    initializeRedis,
    getUserPokemonOfDay,
    setUserPokemonOfDay
};
