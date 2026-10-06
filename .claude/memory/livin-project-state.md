---
name: livin-project-state
description: Where Livin stands — features 001 and 002 implemented; 002 (family members and pets) is merged locally but not pushed and not yet checked on a phone
metadata:
  type: project
---

SDD is initialised in `/Users/pepitofriki/claude/livin` (one sub-project inside a workspace folder that also holds unrelated projects: backend, device-fingerprint, app-planner, mercadito-app, pomodoro-timer, …). The repo's remote is `origin` = https://github.com/bsoto24/livin.git.

Feature `001-mapa-editor-hogar` (web PoC with Phaser 3.80.1 under `poc/`) is complete and on `origin/main`:
- v1.0.0 (Phases 0–5): verified on a Samsung Galaxy S23 Ultra (Android 16) on 2026-10-05: 82 fps, regen 0.0 ms, no failed checklist points.
- v1.1.0 (Phase 6, Story 9 / FR-12): name labels for spaces and the character, merged as `d91c412`; checked on the phone: 73 fps, no observations.
Evidence is in `docs/specs/001-mapa-editor-hogar/verification.md`.

Feature `002-familiares-y-mascotas` (spec v1.0.0: up to 8 family members and 4 pets that wander on their own, obstacles for the player, managed in edit mode, saved format v2 with migration) was implemented test-first through plan Phases 0–4, reviewed SPEC-ALIGNED in two rounds (with follow-ups: D4 step timing, D1 validate only active members, D2 empty-name message when editing, extra tests) and merged locally into `main` as `486f4ae` on 2026-10-05. The suite has 100 automated tests. **Not pushed to origin yet and plan Phase 5 (the Android checklist: 60 fps with 8+4 habitantes, touch, stopwatch ≈ 4 tiles in 2 s, regen < 100 ms over 20 edits, backgrounding) has not been done**; the record goes in `docs/specs/002-familiares-y-mascotas/verification.md`.

Accepted limits of feature 002 (rulings, no action): the `regen` indicator measures only part of the edit path (same as in 001); the "+" button sits inside the "Familiares" / "Mascotas" rows instead of reading "+ Familiar"; the validator accepts a habitante with a foreign `cuentaId` (the app never creates one).

**Why:** this records what is done and what is still unverified so the next session does not redo it or assume 002 was device-tested.
**How to apply:** before starting another feature, finish feature 002: push `main` and run the Android checklist (serve `poc/` on the LAN only while testing and stop the server after). Then continue with the next piece (routines, activities…) via `sdd-brainstorm` / `sdd-specify`, branching off `main`, and run git commands from `/Users/pepitofriki/claude/livin` (the parent folder is not a repo). See [[docs-in-spanish]] for language conventions.
