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

/**
 * Updates the initial thinking state with the actual response
 */
async function updateInteractionResponse(interactionToken, body) {
  const url = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${interactionToken}/messages/@original`;
  return axios.patch(url, body);
}


const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

function verifyDiscordSignature(req) {
  const signature = req.get('X-Signature-Ed25519');
  const timestamp = req.get('X-Signature-Timestamp');
  const rawBody = req.rawBody;

  if (!signature || !timestamp || !rawBody) return false;

  try {
    return nacl.sign.detached.verify(
      Buffer.from(timestamp + rawBody),
      Buffer.from(signature, 'hex'),
      Buffer.from(process.env.DISCORD_PUBLIC_KEY, 'hex')
    );
  } catch (error) {
    return false;
  }
}

app.post('/interactions', (req, res) => {
  if (!verifyDiscordSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { type, data, member, user, token } = req.body;

  if (type === InteractionType.PING) {
    return res.json({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    // Fallback for DM interactions where 'member' is undefined
    const userData = member ? member.user : user;
    const userId = userData.id;

    if (name === 'potd') {
      // 1. Respond immediately to avoid the 3-second timeout
      res.json({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      });

      // 2. Handle the logic asynchronously
      handlePotdCommand(userId)
        .then(async (pokemon) => {
          const embed = createPokemonEmbed(pokemon, userId);
          await updateInteractionResponse(token, { embeds: [embed] });
        })
        .catch(async (error) => {
          console.error('Error processing potd command:', error.message);
          await updateInteractionResponse(token, {
            content: 'An error occurred while fetching your Pokémon of the day.',
            flags: 64
          });
        });
      return;
    }
  }

  return res.status(400).json({ error: 'Unknown interaction type' });
});

async function start() {
  try {
    console.log('Starting application...');
    await cacheService.initializeRedis();
    await registerCommands();

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error.message);
    process.exit(1);
  }
}

start();