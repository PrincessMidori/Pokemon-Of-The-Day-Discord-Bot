# Pokémon of the Day Discord bot  

<br>

![preview](preview.png)

<br>

## Description  

Developed on Arch Linux and self hosted on Homelab - Horoscope-like Pokémon Discord bot made for friend's birthday.  
  
Outputs random, individual Pokémon for user performing `/potd` command and caches Discord userId for a day.

## Features

* Outputs a random Pokémon from generations 1 - 9 (1025 in total) with name, id, stats, moves and official graphic
* Stores user and their entry in persistent database
* Has Pokedex for each individual user `/potd-pokedex`  

 ![alt text](pokedex_preview.png)  

* Has 1 / 300 chance to be a shiny (indicated by different name, embed colour and official graphic)  

![shiny_preview](shiny_preview.png)  

* Has capability to recognise the Birthday Girl
* Supports events

## Technologies

* [Docker](https://www.docker.com/)
* [Pokemon API](https://pokeapi.co/)
* [Discord.js](https://discord.js.org)
* [Mongoose](https://mongoosejs.com/)
* [MongoDB](https://www.mongodb.com)
* [Self hosted on Homelab with reverse proxy](https://en.wikipedia.org/wiki/Home_server)  
