# Phaser 3 presentation layer (livin)

- ✓ Phaser is the renderer only: it draws the generator's output (tile grid, collisions, doors, tile→space map).
- ✓ Load Phaser pinned at 3.80.1 from cdnjs; do not bump without updating the plan.
- ✓ Scenes own input; entities read input state instead of registering their own listeners.
- ✓ Tiles are 16 px; character walks 4 directions at 4 tiles/s (250 ms per tile); vertical orientation only.
- ✓ Use original or CC0 placeholder art (colored rectangles); never third-party copyrighted sprites.
- ✗ Game state lives in the domain model, not in Phaser objects.
- ✗ No business rules in scenes — call the domain/generator and render the result.
- ✓ Re-render within 100 ms after any edit-mode change; keep movement at 60 fps.
