---
scope: conventions
loaded-by: sdd-specify, sdd-plan, sdd-execute, sdd-review
---

# Conventions

## File Naming
Lowercase single-word Spanish module names as in the plan (`catalogo.js`, `hogar.js`, `almacen.js`, `distribucion.js`, `posicion.js`, `juego.js`); tests as `*.test.js`. Edit to match reality.

## Directory Structure
Docs-only today: `docs/specs/NNN-slug/` (prd, spec, plan, data-model) and `docs/adr/`. Source layout will follow the plan: domain, generator and presentation as three independent units. Edit to match reality.

## Code Style
See `.claude/rules/javascript.md`, `testing.md` and `phaser.md`. Spanish domain vocabulary from the spec (hogar, espacio, cuarto, baño interno).

## Architectural Patterns
Three layers — model (`dominio`), pure deterministic generator, Phaser renderer. Stable ids for entities; plain objects, no DTOs/view-models; layout data-driven by a space-type catalog (ADR del generador, ADR modelo de datos).
