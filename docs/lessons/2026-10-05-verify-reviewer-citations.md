---
date: 2026-10-05
spec: "001"
tags: [sdd-review, subagents, verification]
---

# Lesson: spot-check a cheap reviewer's file:line citations and counts

## Context

First `sdd-review` (Mode B) of feature 001, run on a fast/cheap model as `sdd-execute` suggests for the mechanical coverage-matrix build. It reported SPEC-ALIGNED.

## What happened

The matrix looked complete, but several `file:line` citations were line numbers of `plan.md`, not of the test files (e.g. `distribucion.test.js:760` in a 145-line file; `hogar.test.js:337` in a 231-line file), and it said the spec had "40 ACs" when it defines 47 (40 named in test titles + 7 UI-only). It also judged coverage from test titles. Re-running the review on the session's own model with explicit rules ("every file:line comes from grep in this session", "47 ACs", "a title is not proof") produced an accurate matrix and found real drift the first pass missed: FR-10's "save when the character stops" failed when the character was blocked by a wall while the direction was still held; a throwing `localStorage.getItem` crashed startup; and a UI label differed from AC-5.1. After fixes and a third review the verdict was SPEC-ALIGNED with a verified evidence trail.

## What to do next time

Before accepting any reviewer verdict, check two things yourself: that cited `file:line` ranges exist within the files' real lengths (`wc -l`, `grep -n "^test("`), and that the AC count matches `grep -o "AC-[0-9.]*" spec.md | sort -u | wc -l`. If either is off, re-dispatch on the stronger model with those checks written into the prompt, and ask the reviewer to self-verify five of its own citations.

## Signals to watch for

Citations that equal plan.md line numbers; round numbers of ACs that don't match the spec; "all covered" with no UI-only items listed; a matrix where every row is green on the first pass; line numbers beyond the end of the cited file.
