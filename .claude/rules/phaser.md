# Phaser 3 presentation layer (livin)

- ✓ Phaser is the renderer only: it draws the generator's output (tile grid, collisions, doors, tile→space map).
- ✓ Load Phaser pinned at 3.80.1 from cdnjs; do not bump without updating the plan.
- ✓ Scenes own input; entities read input state instead of registering their own listeners.
- ✓ Tiles are 16 px; character walks 4 directions at 4 tiles/s (250 ms per tile); vertical orientation only.
- ✓ Use original art only: 16×16 grids from `src/arte/` (one shared palette) for the world, and colored rectangles still stand in for inhabitants, floor objects, badges and bubbles until features 009 and 010; never third-party copyrighted sprites or imported PNGs.
- ✓ The world (floor, walls, furniture) is composed once into a `RenderTexture` with NEAREST filtering and redrawn only when the layout changes; floor objects live in a separate `Graphics` above it.
- ✓ Text on the map, the bottom bar tabs and drawer titles uses Silkscreen served locally (`assets/fonts/`), with `system-ui` as fallback; forms, lists and fields keep the system font. Wait for the font at most 1 s before creating the game.
- ✗ Game state lives in the domain model, not in Phaser objects.
- ✗ No business rules in scenes — call the domain/generator and render the result.
- ✓ Re-render within 100 ms after any edit-mode change; keep movement at 60 fps.
