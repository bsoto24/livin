---
name: livin-project-state
description: Where Livin stands — feature 001 (map + home editor PoC) done through spec v1.1.0, on origin/main, verified on Android
metadata:
  type: project
---

SDD is initialised in `/Users/pepitofriki/claude/livin` (one sub-project inside a workspace folder that also holds unrelated projects: backend, device-fingerprint, app-planner, mercadito-app, pomodoro-timer, …). The repo's remote is `origin` = https://github.com/bsoto24/livin.git, and `main` is pushed to it.

Feature `001-mapa-editor-hogar` (web PoC with Phaser 3.80.1 under `poc/`, 55 automated tests) is complete:
- v1.0.0 (Phases 0–5): implemented test-first, reviewed SPEC-ALIGNED, verified on a Samsung Galaxy S23 Ultra (Android 16) on 2026-10-05: 82 fps, regen 0.0 ms, no failed checklist points. No numeric stopwatch value was recorded.
- v1.1.0 (Phase 6, Story 9 / FR-12): name labels for every space and for the character on the map in exploration and edit mode, merged as `d91c412`; checked on the phone on 2026-10-05: 73 fps, no observations.
Evidence is in `docs/specs/001-mapa-editor-hogar/verification.md`.

Minor v1.1.0 ambiguities left without action because nothing was observed on the phone: corridors have no label; the HTML D-pad / Editar button can cover a label; the current space's label switches up to 250 ms before the sprite crosses a door; a 20-character name with wide letters might not fit a narrow room.

**Why:** nothing is blocking feature 001; this records what is verified so the next session does not redo it.
**How to apply:** the next work is a new feature (family/pets, routines, activities) via `sdd-brainstorm` / `sdd-specify`; branch off `main` and run git commands from `/Users/pepitofriki/claude/livin` (the parent folder is not a repo). See [[docs-in-spanish]] for language conventions.
