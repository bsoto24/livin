---
name: livin-project-state
description: Where Livin stands after feature 001 (map + home editor PoC) — merged locally, no remote, Android checks pending
metadata:
  type: project
---

SDD was initialised in `/Users/pepitofriki/claude/livin` (one sub-project inside a workspace folder that also holds unrelated projects: backend, device-fingerprint, app-planner, mercadito-app, pomodoro-timer, …). Feature `001-mapa-editor-hogar` (web PoC with Phaser 3.80.1 under `poc/`) was implemented test-first, reviewed SPEC-ALIGNED (round 3, 44/44 tests) and merged locally into `main` as `526841d` on 2026-10-05. The repo has **no git remote**.

Plan Phase 5 manual checks were done on 2026-10-05 on a Samsung Galaxy S23 Ultra (Android 16): 82 fps, regen 0.0 ms, no failed points (recorded in `docs/specs/001-mapa-editor-hogar/verification.md`). No numeric stopwatch value was recorded.

Still open:
- D4 ambiguity: AC-6.6 ("el personaje se muestra como 'Diana'") is satisfied by the name in the character's sheet; an on-map label was not added. Ask the spec owner if it must appear on the map.

**Why:** the Android run closed the device-only items from the final review; AC-6.6 is the only ambiguity left.
**How to apply:** before starting the next feature (family/pets, routines, activities), check with the user whether the AC-6.6 on-map label question was settled. See [[docs-in-spanish]] for language conventions.
