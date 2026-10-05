---
date: 2026-10-05
spec: "001"
tags: [phaser, browser, android, verification]
---

# Lesson: crypto.randomUUID crashes the PoC over plain http on a LAN address

## Context

Feature 001 (map and home editor PoC), Phase 4 presentation layer, `poc/src/juego.js`. The plan's Phase 5 serves the app with `npm start` and opens `http://<IP-del-computador>:8080` on an Android phone.

## What happened

`juego.js` called `crypto.randomUUID()` at module top level. That API only exists in secure contexts (https, localhost, 127.0.0.1). The desktop smoke test on `127.0.0.1` passed, so nothing looked wrong. Loading the same page through the machine's LAN IP gave `window.isSecureContext === false`, `typeof crypto.randomUUID === 'undefined'`, an uncaught `TypeError` at load and a blank page — exactly the setup the plan prescribes for the phone. The subagent that wrote the layer had only flagged it as an observation; it was reproduced for real by serving on all interfaces briefly and opening the LAN address in the browser. Fix (commit 4fc4c8c): a `nuevoUuid()` helper that falls back to `crypto.getRandomValues` (available in non-secure contexts). Also, the plan's `npm start` uses `npx --yes serve`, which downloads a package; `python3 -m http.server` was used for verification instead.

## What to do next time

When a plan has you test on a device through a LAN IP, smoke-test through that exact origin (LAN IP over http), not only localhost. Treat secure-context-only APIs (`crypto.randomUUID`, `navigator.clipboard`, service workers, some storage behaviour) as suspects and give them fallbacks, or serve over https.

## Signals to watch for

A plan step that says "open `http://<LAN-IP>:port` on the phone"; top-level uses of `crypto.randomUUID`, `navigator.clipboard`, `getUserMedia`; a blank page on the phone with a working desktop page; a subagent report noting "requires a secure context".
