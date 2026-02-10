const express = require('express');
const axios = require('axios');
const {
  InteractionType,
  InteractionResponseType,
} = require('discord-interactions');
const nacl = require('tweetnacl');
require('dotenv').config();

const { registerCommands, handlePotdCommand } = require('./commands');
const cacheService = require('./services/cacheService');
const { createPokemonEmbed } = require('./utils');

async function sendFollowupMessage(interactionToken, message) {
  const url = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${interactionToken}`;
  return axios.post(url, message);
}


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to capture raw body as string
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Manually verify Discord signature
function verifyDiscordSignature(req) {
  const signature = req.get('X-Signature-Ed25519');
  const timestamp = req.get('X-Signature-Timestamp');
  const rawBody = req.rawBody;

  console.log('Verifying signature...');

  if (!signature || !timestamp || !rawBody) {
    console.log('Missing signature, timestamp, or body');
    return false;
  }

  try {
    const isValid = nacl.sign.detached.verify(
      Buffer.from(timestamp + rawBody),
      Buffer.from(signature, 'hex'),
      Buffer.from(process.env.DISCORD_PUBLIC_KEY, 'hex')
    );

    if (isValid) {
      console.log('Signature valid');
    } else {
      console.log('Signature invalid');
    }

    return isValid;
  } catch (error) {
    console.error('Verification error:', error.message);
    return false;
  }
}

// Interactions endpoint
app.post('/interactions', (req, res) => {
  console.log('\n POST /interactions received');

  // Verify signature first
  if (!verifyDiscordSignature(req)) {
    console.log('Rejecting request - signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Body is already parsed by express.json middleware
  const { type, data, member } = req.body;

  console.log('Processing interaction type:', type);

  // Handle ping
  if (type === InteractionType.PING) {
    console.log('PING - sending PONG');
    return res.json({ type: InteractionResponseType.PONG });
  }

  // Handle commands
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    const userId = member.user.id;

    console.log(`Command: /${name} from user ${userId}`);

if (name === 'potd') {
  // Acknowledge immediately
  res.json({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
  });

  // Continue processing asynchronously
  handlePotdCommand(userId)
    .then(async pokemon => {
      const embed = createPokemonEmbed(pokemon, userId);

      // Send follow-up message
      await sendFollowupMessage(req.body.token, {
        embeds: [embed]
      });
    })
    .catch(async error => {
      console.error('Error fetching pokemon:', error.message);

      await sendFollowupMessage(req.body.token, {
        content: 'Failed to fetch your Pokémon of the day. Please try again later.',
        flags: 64
      });
    });

  return;
  }
}

  console.log('Unhandled interaction');
  return res.status(400).json({ error: 'Unknown interaction type' });
});

/**
 * Start server
 */
async function start() {
  try {
    console.log('\n Starting Pokemon Bot...\n');
    console.log('Configuration:');
    console.log('  Discord App ID:', process.env.DISCORD_APP_ID ? '✓' : '✗');
    console.log('  Discord Token:', process.env.DISCORD_TOKEN ? '✓' : '✗');
    console.log('  Discord Public Key:', process.env.DISCORD_PUBLIC_KEY ? '✓' : '✗');

    // Initialize Redis
    await cacheService.initializeRedis();

    // Register commands
    await registerCommands();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n Bot ready on port ${PORT}`);
      console.log(`Endpoint: https://pokemon.sheep-sloth.org/interactions\n`);
    });
  } catch (error) {
    console.error(' Startup error:', error.message);
    process.exit(1);
  }
}

start();
