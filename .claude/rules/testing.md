# Testing (livin)

- ✓ Use the built-in runner: `node:test` + `node:assert/strict`, Node ≥ 20. Run with `node --test`.
- ✓ Write the failing test first; contracts of modules are fixed by tests before implementation (Fase 0 of the plan).
- ✓ Test the generator and model headlessly — no Phaser, no DOM.
- ✓ Keep the exhaustive check of all allowed space combinations (7,560 maps) in the suite: every map must be valid and every space reachable.
- ✓ Assert determinism: generating twice from the same saved state yields identical output.
- ✓ Test files named `*.test.js`, mirroring the module under test.
- ✗ No tests that depend on timers, real rendering, or frame rate; measure performance separately.
- ✗ No mocking of the domain; mock only the persistence boundary (`almacen`) when needed.
