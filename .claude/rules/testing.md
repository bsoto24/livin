# Testing (livin)

- ✓ Use the built-in runner: `node:test` + `node:assert/strict`, Node ≥ 20. Run with `node --test`.
- ✓ Write the failing test first; contracts of modules are fixed by tests before implementation (Fase 0 of the plan).
- ✓ Test the generator and model headlessly — no Phaser, no DOM.
- ✓ Keep the exhaustive check of all allowed space combinations (7,560 maps) in the suite: every map must be valid and every space reachable.
- ✓ Assert determinism: generating twice from the same saved state yields identical output.
- ✓ Validate the art headlessly: every grid is 16×16 and uses only palette keys, and `arteDelMapa` gives every tile of the 7,560 maps its art; the 14 characters have their 9 frames each and the walking rules are tested headlessly; the mess art (6 objects per group, stains, cobwebs, flies and the exact list of dirty-furniture overlays) and the art of every tile in all three cleanliness states are checked over all 7,560 maps, including that the art never mutates the model. The test homes (`test/hogares-de-prueba.js`: two for the characters and one per cleanliness state) live in `test/`, outside the app, and are validated by a test.
- ✓ Test files named `*.test.js`, mirroring the module under test.
- ✗ No tests that depend on timers, real rendering, or frame rate; measure performance separately.
- ✗ No mocking of the domain; mock only the persistence boundary (`almacen`) when needed.
