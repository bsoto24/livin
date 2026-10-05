---
name: docs-in-spanish
description: Livin's specs, ADRs, foundation and domain vocabulary are in Spanish while the user chats in English
metadata:
  type: user
---

The user converses with Claude in English, but all Livin project documents (PRD, spec, plan, ADRs, `.claude/memory/foundation.md`) and the domain vocabulary are in Spanish: hogar, espacio, cuarto, baño común, baño interno, modo edición. Module and test file names also follow the Spanish plan (`catalogo.js`, `hogar.js`, `distribucion.js`, …).

**Why:** the user chose the Spanish mission text for the foundation and the existing spec set is Spanish; mixing languages would make specs and code drift apart.
**How to apply:** write new specs, ADRs, foundation/steering text and user-facing app strings in Spanish; keep chat replies in English; use the spec's exact Spanish terms for identifiers and messages. Related: [[livin-project-state]].
