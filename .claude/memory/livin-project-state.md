---
name: livin-project-state
description: Where Livin stands after feature 001 (map + home editor PoC) — merged locally, no remote, Android checks pending
metadata:
  type: project
---

SDD was initialised in `/Users/pepitofriki/claude/livin` (one sub-project inside a workspace folder that also holds unrelated projects: backend, device-fingerprint, app-planner, mercadito-app, pomodoro-timer, …). Feature `001-mapa-editor-hogar` (web PoC with Phaser 3.80.1 under `poc/`) was implemented test-first, reviewed SPEC-ALIGNED (round 3, 44/44 tests) and merged locally into `main` as `526841d` on 2026-10-05. The repo has **no git remote**.

Still open:
- Plan Phase 5 manual checks on a real Android phone: 60 fps, touch D-pad long-press, backgrounding, 4 tiles/s with a stopwatch (not verifiable from the desktop).
- D4 ambiguity: AC-6.6 ("el personaje se muestra como 'Diana'") is satisfied by the name in the character's sheet; an on-map label was not added. Ask the spec owner if it must appear on the map.

**Why:** these were the only items the final review listed as unverified or ambiguous; they decide whether the PoC counts as fully accepted.
**How to apply:** before starting the next feature (family/pets, routines, activities) or declaring 001 fully done, check with the user whether the Android run and the AC-6.6 question were settled. See [[docs-in-spanish]] for language conventions.
