module.exports = {
  // Pokemon data
  TOTAL_POKEMON_COUNT: 1025,
  SHINY_CHANCE: 1 / 300,

  // Cooldown: 12 hours in milliseconds
  COOLDOWN_MS: 12 * 60 * 60 * 1000,

  // Embed colours
  COLORS: {
    POTD_NORMAL: 0xA8FF3D,
    POTD_SHINY:  0xF1C40F,
    POKEDEX:     0x9B59B6,
    EVENT:       0x00DDFF,
  },

  // Bot status refresh: 1 hour in milliseconds
  STATUS_UPDATE_INTERVAL_MS: 3_600_000,

  // Event specific values
  EVENT_POOL_SIZE: 10,
};