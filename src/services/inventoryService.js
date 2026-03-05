const mongoose = require('mongoose');
const { EGG_HATCH_HOURS, EGG_SHINY_CHANCE } = require('../constants');

// ─── Schema ───────────────────────────────────────────────────────────────────

const inventorySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  items: [
    {
      type:         { type: String, enum: ['odd_egg', 'shiny_charm'], required: true },
      obtainedAt:   { type: Date, default: Date.now },
      incubatingAt: { type: Date, default: null },
      hatchesAt:    { type: Date, default: null },
      hatched:      { type: Boolean, default: false },
    },
  ],
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// ─── Internal helper ──────────────────────────────────────────────────────────

// Returns the inventory document for a user, creating an empty one if it
// does not exist yet. Used by every public function in this service.
async function getOrCreate(userId) {
  let inventory = await Inventory.findOne({ userId });
  if (!inventory) {
    inventory = new Inventory({ userId, items: [] });
    await inventory.save();
  }
  return inventory;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

async function getUserInventory(userId) {
  return await getOrCreate(userId);
}

async function userHasShinyCharm(userId) {
  const inventory = await getOrCreate(userId);
  return inventory.items.some(item => item.type === 'shiny_charm');
}

// Returns a string representing the most relevant egg state for a given user.
// The handler uses this to decide which button to show on the profile screen.
//
// Priority order:
//   'ready'       — an egg has finished incubating and can be hatched right now
//   'waiting'     — an egg is currently incubating but not yet ready
//   'unincubated' — at least one egg exists but has not started incubating
//   'none'        — no eggs at all
async function getEggState(userId) {
  const inventory = await getOrCreate(userId);
  const now = new Date();

  const readyEgg = inventory.items.find(
    i => i.type === 'odd_egg' && i.hatchesAt && i.hatchesAt <= now && !i.hatched
  );
  if (readyEgg) return 'ready';

  const incubatingEgg = inventory.items.find(
    i => i.type === 'odd_egg' && i.incubatingAt && !i.hatched
  );
  if (incubatingEgg) return 'waiting';

  const unincubatedEgg = inventory.items.find(
    i => i.type === 'odd_egg' && !i.incubatingAt && !i.hatched
  );
  if (unincubatedEgg) return 'unincubated';

  return 'none';
}

// ─── Write ────────────────────────────────────────────────────────────────────

async function giveEgg(userId) {
  try {
    const inventory = await getOrCreate(userId);
    inventory.items.push({ type: 'odd_egg', obtainedAt: new Date() });
    await inventory.save();
    return inventory;
  } catch (error) {
    console.error('[✗] giveEgg:', error);
    throw error;
  }
}

// Grants a shiny charm to a user. Silently skips if one already exists,
// and returns alreadyOwned: true so the caller can respond accordingly.
async function grantShinyCharm(userId) {
  try {
    const inventory   = await getOrCreate(userId);
    const alreadyHas  = inventory.items.some(item => item.type === 'shiny_charm');
    if (alreadyHas) return { alreadyOwned: true, inventory };

    inventory.items.push({ type: 'shiny_charm', obtainedAt: new Date() });
    await inventory.save();
    return { alreadyOwned: false, inventory };
  } catch (error) {
    console.error('[✗] grantShinyCharm:', error);
    throw error;
  }
}

// Starts incubation on the first available unincubated egg.
// Sets incubatingAt to now and hatchesAt to now + EGG_HATCH_HOURS.
async function startIncubation(userId) {
  try {
    const inventory = await getOrCreate(userId);
    const egg = inventory.items.find(
      i => i.type === 'odd_egg' && !i.incubatingAt && !i.hatched
    );
    if (!egg) throw new Error('No unincubated egg found.');

    const now        = new Date();
    egg.incubatingAt = now;
    egg.hatchesAt    = new Date(now.getTime() + EGG_HATCH_HOURS * 60 * 60 * 1000);

    await inventory.save();
    return egg;
  } catch (error) {
    console.error('[✗] startIncubation:', error);
    throw error;
  }
}

// Marks the first ready egg as hatched and rolls for shiny at egg odds (1/7).
// Returns { isShiny } so the caller can pass that result to pokemonService.
async function hatchEgg(userId) {
  try {
    const inventory = await getOrCreate(userId);
    const now = new Date();
    const egg = inventory.items.find(
      i => i.type === 'odd_egg' && i.hatchesAt && i.hatchesAt <= now && !i.hatched
    );
    if (!egg) throw new Error('No egg ready to hatch.');

    egg.hatched = true;
    await inventory.save();

    return { isShiny: Math.random() < EGG_SHINY_CHANCE };
  } catch (error) {
    console.error('[✗] hatchEgg:', error);
    throw error;
  }
}

module.exports = {
  getUserInventory,
  userHasShinyCharm,
  getEggState,
  giveEgg,
  grantShinyCharm,
  startIncubation,
  hatchEgg,
};