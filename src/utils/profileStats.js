const { REGIONS } = require('../constants');

function getRegionFromId(pokemonId) {
  const region = REGIONS.find(r => pokemonId >= r.min && pokemonId <= r.max);
  return region?.name ?? 'Unknown';
}

function getMostFrequent(values) {
  const counts = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
}

function formatEggLine(egg) {
  if (!egg.incubatingAt) return '🥚 Odd Egg — *not incubating*';

  const now = new Date();
  if (egg.hatchesAt > now) {
    const msLeft      = egg.hatchesAt - now;
    const hoursLeft   = Math.floor(msLeft / 3_600_000);
    const minutesLeft = Math.floor((msLeft % 3_600_000) / 60_000);
    return `🥚 Odd Egg — ⏳ ${hoursLeft}h ${minutesLeft}m remaining`;
  }

  return '🥚 Odd Egg — ✅ **Ready to hatch!**';
}

// Takes the user's full catch collection and their inventory document and
// returns a plain summary object ready to be passed directly into createProfileEmbed.
function computeProfileStats(collection, inventory) {
  const allTypes   = collection.flatMap(e => e.pokemon.types.split(', '));
  const allRegions = collection.map(e => getRegionFromId(e.pokemon.id));

  const eggs          = inventory.items.filter(i => i.type === 'odd_egg' && !i.hatched);
  const hasShinyCharm = inventory.items.some(i => i.type === 'shiny_charm');

  const inventoryLines = eggs.map(formatEggLine);
  if (hasShinyCharm) inventoryLines.push('✨ Shiny Charm — *active*');

  // Resolve each favourite pokemon ID to a display name using the catch collection.
  // Falls back to "#ID" if the pokemon somehow isn't in the collection (e.g. egg hatch duplicate).
  const favouriteNames = (inventory.favourites ?? []).map(id => {
    const entry = collection.find(e => e.pokemon.id === id);
    return entry
      ? `${entry.pokemon.isShiny ? '✨ ' : ''}${entry.pokemon.name}`
      : `#${id}`;
  });

  return {
    totalCaught:      collection.length,
    shinyCount:       collection.filter(e => e.pokemon.isShiny).length,
    topType:          getMostFrequent(allTypes),
    topRegion:        getMostFrequent(allRegions),
    hasShinyCharm,
    inventorySummary: inventoryLines.length > 0 ? inventoryLines.join('\n') : 'Empty',
    favouriteNames,
  };
}

module.exports = { computeProfileStats };