# Pokémon of the Day Discord bot  

<br>

![preview](preview.png)

<br>

## Description  

Developed on Arch Linux and self hosted on Homelab - Horoscope-like Pokémon Discord bot made for friend's birthday.  
  
Outputs random, individual Pokémon for user performing `/potd` command and caches Discord userId for a day.

## Features

* Outputs a random Pokémon from generations 1 - 9 (1025 in total) with name, id, stats, moves and official graphic
* Stores userId and it's Pokémon for a day
* Has 1 / 300 chance to be a shiny (indicated by different name, embed colour and official graphic)
* Has capability to recognise the Birthday Girl

## Technologies

* [Docker](https://www.docker.com/)
* [Pokemon API](https://pokeapi.co/)
* [Axios](https://axios-http.com/docs/intro)
* [Node.js](https://nodejs.org/en)
* [Discord API](https://docs.discord.com/developers/intro)
* [Redis](https://redis.io/)
* [Self hosted on Homelab with reverse proxy](https://en.wikipedia.org/wiki/Home_server)  
