const { ComponentType, MessageFlags } = require('discord.js');
const { commandHandlers }             = require('../commands');
const dbService                       = require('../services/dbService');
const inventoryService                = require('../services/inventoryService');
const pokemonService                  = require('../services/pokemonService');
const { computeProfileStats }         = require('../utils/profileStats');
const {
  createPotdEmbed,
  createPokedexEmbed,
  createEventEmbed,
  createProfileEmbed,
  createItemObtainedEmbed,
}                                     = require('../builders/embeds');
const {
  buildPokedexButtons,
  buildProfileButtons,
  buildModal,
}                                     = require('../builders/components');

// ─── Entry point ──────────────────────────────────────────────────────────────

async function handleInteraction(interaction) {
  try {
    if (interaction.isChatInputCommand()) return handleSlashCommand(interaction);
    if (interaction.isModalSubmit())      return handleModalSubmit(interaction);
  } catch (error) {
    console.error('[✗] Unhandled interaction error:', error);
  }
}

// ─── Render helpers ───────────────────────────────────────────────────────────
// These assemble the full { embeds, components } payload for each screen.
// All button handlers call one of these — adding new buttons or fields only

// Produces the embed + buttons for a single Pokédex page.
function buildPokedexView(user, collection, page, inventory) {
  return {
    embeds:     [createPokedexEmbed(user, collection, page)],
    components: [buildPokedexButtons(
      page,
      collection.length,
      collection[page].pokemon.id,
      inventory.favourites ?? [],
    )],
  };
}

// Fetches egg state, computes stats, and produces the embed + buttons for
// the profile screen. Async because getEggState hits the database.
async function buildProfileView(user, collection, inventory) {
  const eggState = await inventoryService.getEggState(user.id);
  const stats    = computeProfileStats(collection, inventory);
  return {
    embeds:     [createProfileEmbed(user, stats)],
    components: [buildProfileButtons(eggState)],
  };
}

// ─── Slash command router ─────────────────────────────────────────────────────

async function handleSlashCommand(interaction) {
  const { commandName, user } = interaction;
  const guildName = interaction.guild?.name ?? 'Direct Message';

  if (commandName === 'potd')             return handlePotd(interaction, user, guildName);
  if (commandName === 'potd-pokedex')     return handlePokedex(interaction, user);
  if (commandName === 'potd-debug-shiny') return interaction.showModal(buildModal());
  if (commandName === 'potd-event')       return interaction.showModal(buildModal('event_modal'));
}

// ─── /potd ────────────────────────────────────────────────────────────────────

async function handlePotd(interaction, user, guildName) {
  try {
    const result = await commandHandlers['potd'](user, guildName);

    if (result.onCooldown) {
      console.log(`POTD: ${user.tag} in ${guildName} used /potd but has cooldown`);
      return interaction.reply({
        content: `You already rolled today. Next roll: **${result.timeLeft}**`,
        flags:   MessageFlags.Ephemeral,
      });
    }

    console.log(`POTD: ${user.tag} in ${guildName} got ${result.pokemon.name}`);
    await interaction.deferReply();
    await interaction.editReply({ embeds: [createPotdEmbed(result.pokemon, user.id)] });

    if (result.newEgg) {
      console.log(`[Odd Egg] ${user.tag} in ${guildName} got an Odd Egg`);
      await interaction.followUp({ embeds: [createItemObtainedEmbed(user, 'odd_egg')] });
    }

  } catch (error) {
    console.error('[✗] /potd error:', error);
    const msg = 'Something went wrong. Please contact my creator.';
    return interaction.deferred
      ? interaction.editReply(msg)
      : interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
  }
}

// ─── /potd-pokedex ────────────────────────────────────────────────────────────

async function handlePokedex(interaction, user) {
  const guildName = interaction.guild?.name ?? 'Direct Message';
  
  try {
    const collection = await commandHandlers['potd-pokedex'](user);

    if (collection.length === 0) {
      return interaction.reply({ content: 'Your collection is empty.', flags: MessageFlags.Ephemeral });
    }

    let page      = 0;
    let inventory = await inventoryService.getUserInventory(user.id);

    const { resource } = await interaction.reply({
      ...buildPokedexView(user, collection, page, inventory),
      withResponse: true,
    });
    const response = resource.message;

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time:          300_000,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Only the owner can interact with this.', flags: MessageFlags.Ephemeral });
      }

      // ── Pokédex navigation ───────────────────────────────────────────────
      if (i.customId === 'prev') {
        page--;
        return i.update(buildPokedexView(user, collection, page, inventory));
      }

      if (i.customId === 'next') {
        page++;
        return i.update(buildPokedexView(user, collection, page, inventory));
      }

      // ── Team: toggle favourite ───────────────────────────────────────────
      if (i.customId === 'select_pokemon') {
        const currentPokemon = collection[page].pokemon;
        const result         = await inventoryService.toggleFavourite(user.id, currentPokemon.id);

        if (result.full) {
          return i.reply({
            content: `Your team is full (${inventory.favourites.length}/${require('../constants').MAX_TEAM_SIZE}). Remove one first.`,
            flags:   MessageFlags.Ephemeral,
          });
        }

        // Refresh inventory so the SELECT button colour updates immediately
        inventory = await inventoryService.getUserInventory(user.id);

        const feedback = result.added
          ? `⭐ **${currentPokemon.name}** added to your team!`
          : `✖️ **${currentPokemon.name}** removed from your team.`;

        // Update the buttons in place, then send feedback as an ephemeral reply
        await i.update({ components: buildPokedexView(user, collection, page, inventory).components });
        return i.followUp({ content: feedback, flags: MessageFlags.Ephemeral });
      }

      // ── Profile screen ───────────────────────────────────────────────────
      if (i.customId === 'profile') {
        inventory = await inventoryService.getUserInventory(user.id);
        return i.update(await buildProfileView(user, collection, inventory));
      }

      if (i.customId === 'back_to_pokedex') {
        inventory = await inventoryService.getUserInventory(user.id);
        return i.update(buildPokedexView(user, collection, page, inventory));
      }

      // ── Egg: start incubation ────────────────────────────────────────────
      if (i.customId === 'incubate_egg') {
        await inventoryService.startIncubation(user.id);
        inventory = await inventoryService.getUserInventory(user.id);
        return i.update(await buildProfileView(user, collection, inventory));
      }

      // ── Egg: hatch ───────────────────────────────────────────────────────
      if (i.customId === 'hatch_egg') {
        const { isShiny } = await inventoryService.hatchEgg(user.id);

        const pokemon = await pokemonService.getRandomPokemon({ forceShiny: isShiny });
        await dbService.addUserPokemon(user, pokemon, 'Egg Hatch');
        console.log(`[Egg Hatch] ${user.tag} in ${guildName} hatched ${pokemon.name}`);

        // Rebuild collection after the new catch, refresh inventory
        const updatedCollection = await dbService.getUserAllPokemons(user.id);
        inventory               = await inventoryService.getUserInventory(user.id);

        await i.update(await buildProfileView(user, updatedCollection, inventory));
        return i.followUp({ embeds: [createPotdEmbed(pokemon, user.id)] });
      }
    });

  } catch (error) {
    console.error('[✗] /potd-pokedex error:', error);
    return interaction.reply({ content: 'Something went wrong.', flags: MessageFlags.Ephemeral });
  }
}

// ─── Modal submissions ────────────────────────────────────────────────────────

async function handleModalSubmit(interaction) {
  const { user } = interaction;
  const input    = interaction.fields.getTextInputValue('password_field');

  // ── /potd-debug-shiny ──────────────────────────────────────────────────────
  if (interaction.customId === 'modal') {
    if (input !== process.env.DEBUG_PASSWORD) {
      console.warn(`[DEBUG] ${user.tag} failed password attempt`);
      return interaction.reply({ content: 'Access denied.', flags: MessageFlags.Ephemeral });
    }
    try {
      await interaction.deferReply();
      const pokemon = await commandHandlers['potd-debug-shiny']();
      return interaction.editReply({ embeds: [createPotdEmbed(pokemon, user.id)] });
    } catch (error) {
      console.error('[✗] Debug shiny error:', error.message);
      return interaction.editReply('potd-debug-shiny failed.');
    }
  }

  // ── /potd-event ────────────────────────────────────────────────────────────
  if (interaction.customId === 'event_modal') {
    if (input !== process.env.EVENT_PASSWORD) {
      console.warn(`[EVENT] ${user.tag} failed password attempt`);
      return interaction.reply({ content: 'Access denied.', flags: MessageFlags.Ephemeral });
    }
    try {
      await interaction.deferReply();
      const pokemons = await commandHandlers['potd-event']();
      return interaction.editReply({ embeds: [createEventEmbed(user, pokemons)] });
    } catch (error) {
      console.error('[✗] Event error:', error.message);
      return interaction.editReply('potd-event failed.');
    }
  }
}

module.exports = { handleInteraction };