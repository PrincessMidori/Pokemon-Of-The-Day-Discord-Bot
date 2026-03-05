// Usage: docker exec pokemon-bot-app node scripts/grantRetroactiveEggs.js
// Print to terminal and save to a file at the same time:
// docker exec pokemon-bot-app node scripts/grantRetroactiveEggs.js | tee retroactive_eggs.log

require('dotenv').config({ path: '../.env' });
const mongoose         = require('mongoose');
const dbService        = require('../src/services/dbService');
const inventoryService = require('../src/services/inventoryService');
const { EGG_CATCH_THRESHOLD } = require('../src/constants');

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('[✓] Connected to database');

  const allEntries = await dbService.getAllEntries();
  const userIds    = [...new Set(allEntries.map(e => e.userId))];

  console.log(`[i] Found ${userIds.length} unique users`);

  for (const userId of userIds) {
    const userEntries  = allEntries.filter(e => e.userId === userId);
    const totalCatches = userEntries.length;
    const eggsEarned   = Math.floor(totalCatches / EGG_CATCH_THRESHOLD);

    if (eggsEarned === 0) {
      console.log(`[skip] User ${userId} — ${totalCatches} catches, no eggs earned yet`);
      continue;
    }

    const inventory    = await inventoryService.getUserInventory(userId);
    const existingEggs = inventory.items.filter(i => i.type === 'odd_egg').length;
    const eggsToGrant  = eggsEarned - existingEggs;

    if (eggsToGrant <= 0) {
      console.log(`[skip] User ${userId} — already has ${existingEggs}/${eggsEarned} eggs`);
      continue;
    }

    for (let i = 0; i < eggsToGrant; i++) {
      await inventoryService.giveEgg(userId);
    }
    console.log(`[✓] User ${userId} — granted ${eggsToGrant} egg(s) (${totalCatches} catches, ${eggsEarned} earned total)`);
  }

  console.log('[✓] Migration complete');
  process.exit(0);
}

run().catch(err => {
  console.error('[✗] Migration failed:', err);
  process.exit(1);
});