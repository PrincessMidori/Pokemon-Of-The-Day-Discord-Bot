module.exports = {
  // Pokemon data
  TOTAL_POKEMON_COUNT: 1025,
  SHINY_CHANCE: 1 / 300,

  // Timezone for midnight reset
  TIMEZONE: 'Europe/Vienna',

  // Bot status refresh: 1 hour in milliseconds
  STATUS_UPDATE_INTERVAL_MS: 3_600_000,

  // Embed colours
  COLORS: {
    POTD_NORMAL:   0xA8FF3D,
    POTD_SHINY:    0xF1C40F,
    POKEDEX:       0x9B59B6,
    EVENT:         0x00DDFF,
    PROFILE:       0x3498DB,
    ITEM_OBTAINED: 0xF39C12,
  },

  // Event specific values
  EVENT_POOL_SIZE: 10,

  // Inventory / eggs / profile
  MAX_TEAM_SIZE:       6,             // size of the team in profile
  EGG_CATCH_THRESHOLD: 7,             // give one egg every N catches
  EGG_HATCH_HOURS:     24,            // hours to incubate before hatching
  EGG_SHINY_CHANCE:    1 / 7,         // odds of shiny when egg hatches

  // Item sprite URLs
  EGG_SPRITE_URL:          'https://raw.githubusercontent.com/PokeAPI/sprites/dc262cee6317d896ef51c12ccd881ace9f84deba/sprites/items/mystery-egg.png',
  SHINY_CHARM_SPRITE_URL:  'https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/items/shiny-charm.png',

  // Maps Pokémon ID ranges to generation regions
  REGIONS: [
    { name: 'Kanto',  min: 1,   max: 151  },
    { name: 'Johto',  min: 152, max: 251  },
    { name: 'Hoenn',  min: 252, max: 386  },
    { name: 'Sinnoh', min: 387, max: 493  },
    { name: 'Unova',  min: 494, max: 649  },
    { name: 'Kalos',  min: 650, max: 721  },
    { name: 'Alola',  min: 722, max: 809  },
    { name: 'Galar',  min: 810, max: 905  },
    { name: 'Paldea', min: 906, max: 1025 },
  ],
};