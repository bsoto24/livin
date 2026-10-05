---
scope: test-strategy
loaded-by: sdd-plan, sdd-execute, sdd-review
---

# Test Strategy

## Test Framework
`node:test` with `node:assert/strict` (Node ≥ 20), run via `node --test`. Edit to match reality.

## Test Levels
- Unit tests: domain model, catalog, persistence boundary, generator and position logic — headless, no Phaser/DOM.
- Integration tests: generator output validity (reachability, collisions, doors, tile→space map) across combinations.
- E2E tests: N/A for the PoC; manual play on an Android browser, plus a separate performance check (60 fps, <100 ms edit re-render).

## Coverage Expectations
Plan targets 40 automated tests including the exhaustive verification of all 7,560 allowed maps. Domain and generator fully covered; presentation layer excluded.

## Mocking Policy
No mocking of the domain. Mock only the persistence boundary when needed; generator tests use real inputs.
