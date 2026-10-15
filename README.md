# Formicide

A browser real-time strategy game of rival ant colonies, inspired by Command & Conquer, StarCraft and Warcraft. Gather food and honeydew, grow your colony, raise a Warrior Princess, and destroy every rival Queen's Nest.

**Play it:** https://mendezm87.github.io/formicide/

No build step and no dependencies: plain HTML, CSS and JavaScript on a canvas. Works with mouse and keyboard or touch. All sound effects and music are synthesized in the browser, and the announcer uses the browser's built-in speech voice.

## Modes

- **Campaign:** six missions with objectives: a tutorial raid, holding the line against waves, a water crossing, a hero escort, a race to destroy three superweapons, and a final three-way war. Progress is saved in your browser.
- **Skirmish:** pick your colony, map, one or two AI rivals (free-for-all), difficulty, AI style (Balanced, Rusher, Turtle, Expander), starting resources, game speed, weather and wild creatures.

## Features

- **Three colonies** with different perks and a unique giant each: Black Carpenter Legion (Juggernaut), Red Fire Colony (Inferno Ant), Gold Crazy Swarm (Gale Drone).
- **Two resources:** food from sugar and seed piles, and honeydew from aphid herds that slowly refill. Build Outpost Nests to expand toward distant food.
- **12 ant types:** Workers, Alate Scouts, Soldiers, Acid Spitters, Nurses, Sky Lancers, Bombardiers, the three colony giants, Swarmlings and the Warrior Princess hero, who levels up to 5 and can be revived.
- **Abilities:** Rally Cry, Acid Pool, Burrow Charge, Pheromone Mark, Healing Burst, Blaze, Stinger Lunge and Summon Swarm.
- **Veterancy:** ants earn Veteran, Elite and Heroic ranks from kills.
- **Air and ground:** melee ants can't hit flyers; Spitters, Sky Lancers and Acid Towers can.
- **Terrain:** puddles to path around, tall grass that hides units, high ground that boosts sight and range, and pheromone trails around your structures that speed up and heal your ants.
- **Wild creatures:** Wolf Spiders, Stag Beetles and Praying Mantises guard rich spots and drop a bounty when killed.
- **Hazards:** rain slows ants off their trails, and a giant footstep periodically crushes whatever is under its shadow.
- **Superweapon:** the Swarm Spire charges for 4 minutes, then unleashes a swarm anywhere you can see. Every player can see every spire's countdown.
- **RTS controls:** control groups, shift-queued orders, attack-move, patrol, hold position, formations that move at the slowest unit's pace, smart rally points, and a production queue you can cancel.
- **End-of-game stats** with an army-size graph.

## Controls

**Mouse and keyboard**

| Action | Input |
| --- | --- |
| Select | Left-click, or drag a box. Double-click selects all of that type on screen. |
| Command | Right-click to move, gather, attack or repair. Hold Shift to queue. |
| Camera | Right-drag or arrow keys to scroll, wheel to zoom, Space to jump to the latest alert. |
| Units | A attack-move, S stop, H hold, P patrol, D and F abilities, B build menu then 1-7 |
| Control groups | Ctrl or Alt + 1-9 to save, 1-9 to select (press twice to jump there), Shift + 1-9 to add |
| Structures | Q W E R T press the panel buttons |
| Menu and pause | Esc for the menu, F10 to pause |

**Touch:** tap to select, double-tap for all of a kind, tap the ground to command, drag to scroll, pinch to zoom, use ⬚ Box to drag-select and + Group to save a group.

## Project layout

```
index.html        page markup
style.css         styles
js/data.js        units, structures, upgrades, abilities, colonies, AI settings
js/audio.js       synthesized sound effects, music and announcer
js/map.js         map generation, terrain, pathfinding and ground art
js/sim.js         game simulation: movement, orders, combat, abilities, weather
js/ai.js          computer opponents
js/render.js      drawing the world, fog of war and minimap
js/input.js       mouse, touch and keyboard controls
js/ui.js          HUD, command panel and menus
js/campaign.js    campaign missions
js/main.js        startup and the game loop
```

To run it locally, serve the folder with any static web server, for example `python -m http.server`, and open the printed address.
