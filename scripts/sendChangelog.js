// Reads changelog.md from the project root and sends its content to a Discord channel.
// Automatically splits into multiple messages if the content exceeds Discord's 2000
// character limit, splitting on newlines so markdown formatting is never cut mid-line.
//
// Usage:
//   docker exec pokemon-bot-app node scripts/sendChangelog.js <channelId>
//
// Example:
//   docker exec pokemon-bot-app node scripts/sendChangelog.js 987654321098765432
//
// The changelog.md file should sit in the project root (same level as app.js).
// Standard Discord markdown is supported: **bold**, *italic*, `code`, ## headings, etc.

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs             = require('fs');
const path           = require('path');
const { REST, Routes } = require('discord.js');

const [channelId] = process.argv.slice(2);

if (!channelId) {
  console.error('[✗] Missing argument.');
  console.error('    Usage: node scripts/sendChangelog.js <channelId>');
  process.exit(1);
}

const CHANGELOG_PATH  = path.resolve(__dirname, '../changelog.md');
const MAX_LENGTH      = 2000;

// Splits a string into chunks of at most maxLength characters,
// always breaking on a newline boundary so lines are never cut in half.
function splitIntoChunks(text, maxLength) {
  const chunks = [];
  const lines  = text.split('\n');
  let current  = '';

  for (const line of lines) {
    // +1 for the newline character that will be re-added
    if ((current + line + '\n').length > maxLength) {
      if (current.length > 0) {
        chunks.push(current.trimEnd());
        current = '';
      }
      // If a single line is somehow longer than maxLength, hard-split it
      if ((line + '\n').length > maxLength) {
        for (let i = 0; i < line.length; i += maxLength) {
          chunks.push(line.slice(i, i + maxLength));
        }
        continue;
      }
    }
    current += line + '\n';
  }

  if (current.trim().length > 0) chunks.push(current.trimEnd());
  return chunks;
}

async function run() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.error(`[✗] changelog.md not found at: ${CHANGELOG_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CHANGELOG_PATH, 'utf8').trim();

  if (!content) {
    console.error('[✗] changelog.md is empty.');
    process.exit(1);
  }

  const rest   = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const chunks = splitIntoChunks(content, MAX_LENGTH);

  console.log(`[i] Sending ${chunks.length} message(s) to channel ${channelId}...`);

  for (let i = 0; i < chunks.length; i++) {
    await rest.post(Routes.channelMessages(channelId), {
      body: { content: chunks[i] },
    });
    console.log(`[✓] Sent part ${i + 1} of ${chunks.length}`);
  }

  console.log('[✓] Changelog sent successfully');
  process.exit(0);
}

run().catch(err => {
  console.error('[✗] sendChangelog failed:', err.message);
  process.exit(1);
});