# Tetris

Classic Tetris, built in plain HTML, CSS, and JavaScript. No framework, no build step, no dependencies.

## Live

https://lemuelowusuansah.github.io/Tetris/

## Features

- Classic 10×20 playfield with seven tetrominoes
- Line clears, scoring, level progression
- Next-piece preview
- Hold piece
- Ghost piece (drop preview)
- Keyboard and touch controls
- Menu screen with intro animation

## Controls

| Key | Action |
| --- | --- |
| ← / → | Move left / right |
| ↓ | Soft drop |
| Space | Hard drop |
| ↑ / X | Rotate clockwise |
| Z | Rotate counter-clockwise |
| C | Hold piece |
| P | Pause |
| R | Restart |

## Run locally

Open `index.html` in a browser. That's it — no install, no server.

Or serve it:

    python3 -m http.server 8000

Then open http://localhost:8000.

## Files

- `index.html` — landing / menu screen
- `game.html` — the game
- `css/` — shared and menu styles
- `js/` — game logic

## Stack

Plain HTML, CSS, JavaScript. Zero dependencies.
