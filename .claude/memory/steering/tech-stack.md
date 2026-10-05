---
scope: tech-stack
loaded-by: sdd-brainstorm, sdd-specify, sdd-plan, sdd-execute, sdd-review
---

# Tech Stack

## Languages
JavaScript (native ES modules), HTML, CSS — from the plan; no code written yet. Edit to match reality.

## Frameworks
Phaser 3 (pinned 3.80.1, loaded from cdnjs) as renderer for a disposable web PoC. The official stack is undecided; a later ADR will choose it from PoC performance evidence. Edit to match reality.

## Infrastructure
None. Local-first, single device, offline, no server or authentication. Target: Android phone browser, portrait. Edit to match reality.

## Package Manager
None — no npm dependencies. Tests use Node's built-in runner (Node ≥ 20). Edit to match reality.
