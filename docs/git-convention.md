---
branch_pattern: "^(feat|fix|docs|chore|refactor|test)/[0-9]+-[a-z0-9-]+$"
ticket_prefix: ""
commit_format: "<type>(<scope>): <message>"
allowed_types:
  - feat
  - fix
  - docs
  - chore
  - refactor
  - test
---

# Git Convention

This file is read by SDD skills to enforce branch naming and commit message standards.
To change these settings, edit this file directly.

## Examples

### Branch names
- `feat/001-mapa-editor-hogar`
- `fix/002-bano-interno-al-eliminar-cuarto` (ASCII only: no accents or `ñ`)

### Commit messages
- `feat(hogar): agregar operaciones puras para agregar y quitar espacios`
- `fix(distribucion): generar pasillo cuando una zona lateral supera 2 espacios`
