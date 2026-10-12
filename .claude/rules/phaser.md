# Phaser 3 presentation layer (livin)

- ✓ Phaser is the renderer only: it draws the generator's output (tile grid, collisions, doors, tile→space map).
- ✓ Load Phaser pinned at 3.80.1 from cdnjs with `integrity` (SHA-512, the value cdnjs publishes) and `crossorigin="anonymous"`; do not bump without updating the plan, the hash and `test/despliegue.test.js`.
- ✓ Scenes own input; entities read input state instead of registering their own listeners.
- ✓ Tiles are 16 px; character walks 4 directions at 4 tiles/s (250 ms per tile); vertical orientation only.
- ✓ Use original art only: 16×16 grids from `src/arte/` (one shared palette) for the world, and for the 14 characters of the inhabitants and the player (nine frames each, flipped for the left view); the activity bubbles and the cleanliness badges are icons from `src/arte/iconos.js` drawn from the same texture sheet (a bubble is a `Container`: a light rectangle, the icon and a text "+"), with no emoji anywhere in the map or the interface; the map text (labels, sign, highlight) takes its colours from `COLORES_DEL_MAPA` in `src/arte/colores.js`; never third-party copyrighted sprites or imported PNGs.
- ✓ The world (floor, walls, furniture and the mess of each space: objects, stains, dirty furniture, cobwebs, flies) is composed into one `RenderTexture` with NEAREST filtering and redrawn only when the layout changes or `estadosCambiaron` says a space changed its cleanliness state; there is no separate layer for floor objects. The art sheet is a grid of 64 columns to stay under 4,096 px per side.
- ✓ Text on the map, the bottom bar tabs and drawer titles uses Silkscreen served locally (`assets/fonts/`), with `system-ui` as fallback; forms, lists and fields keep the system font. Wait for the font at most 1 s before creating the game.
- ✗ Game state lives in the domain model, not in Phaser objects.
- ✗ No business rules in scenes — call the domain/generator and render the result.
- ✓ Re-render within 100 ms after any edit-mode change; keep movement at 60 fps.
