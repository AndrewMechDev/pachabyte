# Parallel brief: Track B (map, page UI, art preparation)

> **UPDATE 2026-10-14: read section 7 (at the end) first. It supersedes sections 0.1, 2 (scope additions) and 3 (ownership list) wherever they differ.**

You are the second AI working on PachaByte at the same time as Track A (another session that owns all gameplay code). Read this whole file, then `docs/HANDOFF.md`, `AGENTS.md` (repo root), `odd/tasks/polish-phases.md` and `docs/design/ASSET_REQUESTS_V2.md`. If anything here contradicts the checkout, trust the checkout and report the difference.

## 0. Rules of engagement (non-negotiable)
1. **Work only in your own git worktree and branch**, never in the main folder:
   - worktree: `C:\Users\dark_\Documents\hack-the-andes-game-worktrees\track-b`
   - branch: `feat/track-b-ui-map` (already created from commit with the 6 source images; if the folder is missing, create it with `git worktree add <path> -b feat/track-b-ui-map feat/polish-phases` and link `node_modules` with a junction: `powershell -Command "New-Item -ItemType Junction -Path '<worktree>\node_modules' -Target 'C:\Users\dark_\Documents\hack-the-andes-game\node_modules'"`).
2. **Never push, never merge, never touch `main` or the main folder.** Commit locally in your branch only (Conventional Commits, no `Co-Authored-By`, no AI attribution). The user or Track A merges later.
3. **Do not edit Track A files** (list in section 3). If you need a change in one of them, write it under "Requests for Track A" in your final report instead.
4. Ports: never use or stop 4173, 4181, 4185, 4186, 4187. Use 4190-4199 for your own preview servers and stop only those.
5. Tests first where deterministic (observe RED, then GREEN); never weaken an assertion; report only what you observed in this checkout. Windows: use `npm.cmd`, Git Bash, `python -I`; `rg` and `sd` are not installed; write long patch scripts with a file-writing tool and run them by path (bash heredocs lose backslashes).
6. Game rules still apply: in-game text in Spanish, code and technical docs in English; no copied art, characters or levels from other games; the 320x180 canvas, crisp scaling, Canvas and WebGL both supported (Canvas ignores tint), `motion.reduced` respected, pause/focus behavior unchanged.

## 1. Where the project is
- Live: https://andrewmechdev.github.io/pachabyte/ (GitHub Pages from `main`, currently v0.6 = commit `70f5eed`). Repo: https://github.com/AndrewMechDev/pachabyte.
- v0.6 has the free-flight Ruta 01 (~98 s with Packet Loss, Misti eruption, Memory Leak, Bucle, Marea), Amaru-01 in three phases with REVERSE and liberation, pickups, racha, user sprites for Corruptor/Sombra/pickups, Spanish UI, synthesized sound, reduced motion. 308 unit tests; a keyboard-driven browser smoke (`tests/browser-smoke.mjs`, 20 groups, WebGL and Canvas).
- Phases (`odd/tasks/polish-phases.md`): P1 done (balance). **P2 is being written by Track A right now** (animated bolts, Amaru liberation burst with bugs flying out, eye-relic loop node, all procedural placeholders). P3 (Pulso de la Trama on the route) and P5 (final integration) come after.

## 2. Your mission (Track B), in this order
User playtest feedback you are answering: the map screen shows too much text and a confusing order of information ("ENTER: INICIAR RUTA / 2: IR A AMARU"); the top page buttons should match the theme; everything is the same turquoise, the page needs an epic cyberpunk-Andean look; the title needs the chullo logo; the map should show that the first route is unlocked and the others are still being built.

### B1. Prepare the six new images (sources already in `assets/incoming/`, never modify them)
Observed by Track A at 2026-10-13 (verify yourself):
| File | Size / mode | What it is | Use |
|---|---|---|---|
| `MAP_TRAMA.png` | 1672x941 RGB, opaque | Stylized Peru map: coast left, Andes middle, jungle right, six stone sockets joined by golden thread chains, the Arequipa socket already glowing green near the volcano (bottom-center) | **You** integrate (B2) |
| `LOGO_PACHABYTE.png` | 2172x724 RGBA | Wordmark "PACHABYTE" in turquoise tech-Andean letters with a chullo on the second A | **You** integrate (B3) |
| `PAGE_BG.png` | 1672x941 RGB, opaque | Cyberpunk-Andean night page background | **You** integrate (B3) |
| `LOOP_NODE_EYE.png` | 1659x948 RGBA | 7-frame strip: 4 idle, hit flash, cracking, shattering eye relic with tentacles | Prepare only; Track A wires it in P5 |
| `SHOTS.png` | 1448x1086 RGBA | Bolt sprites: normal, Ráfaga, impact burst (verify rows and frame count) | Prepare only |
| `BG_ROUTE_NEON.png` | 1672x941 RGB, opaque | Corrupted neon-night version of the route sky | Prepare only |
Use `tools/prepare_sprite.py` (`--auto` for uneven strips; read `skills/pachabyte-gameplay-quality/references/asset-prep.md`). For the three opaque full-screen images the sources are not on a clean pixel grid, so evaluate a reduction to 320x180 (and 640x360 for the map if details die) and pick what reads best **at native size in the game**; extend the tool with a documented opaque-resize mode if needed (keep existing modes and `--self-test` working, add a self-test for the new mode). For the page background pick a size and format that loads fast (target under about 600 KB; quantized PNG or lossless WebP are fine; state what you chose and why). Save outputs in `assets/prepared/` with names like `map-trama-v1-320x180.png`. Inspect every prepared file at zoom and confirm nothing is cropped, halos are gone, and silhouettes are complete.
Write `docs/design/INTEGRATION_NOTES.md` for Track A: per sheet, the native cell size, frame order, anchor, exact commands used, and any caveats, for `LOOP_NODE_EYE`, `SHOTS` and `BG_ROUTE_NEON`. Update the statuses in `docs/design/ASSET_REQUESTS_V2.md` (received / prepared / integrated) and add rows to `CREDITS.md`.

### B2. Map screen (MapScene), less text and more clarity
Files you own: `src/game/MapScene.ts`, a NEW `src/game/mapText.ts` (do not edit `text.ts`), a NEW `src/game/mapRules.ts` for pure logic, and their new tests.
- Draw the prepared map as the background. Place six node markers on the sockets of the artwork (measure the socket centers yourself; rough positions in the 1672x941 source: (365,190), (437,390), (1000,455), (1285,228), (845,675) glowing = Arequipa, (1318,665)). Arequipa is the playable node; the others are locked.
- States: Arequipa corrupted (not yet freed: dim violet static overlay) vs restored (warm pulse), based on the existing `progress` registry values; other nodes locked: dim, flickering, a small construction/scaffold mark and an "EN CONSTRUCCIÓN" tag. Never invent real city lore: the design canon says other regions are not assigned yet, so show only generic locked state (name them "RUTA 02" ... "RUTA 06" or leave unnamed).
- Information design: a short title, ONE selected-node card (name, state, one action line) and ONE compact key bar. No paragraph text. Arrow keys / A-D move the selection between nodes (locked nodes show "PRÓXIMAMENTE"), Enter acts on the selected playable node, `2` still goes straight to Amaru and `1`-style shortcuts that exist today must keep working. Keep every `pachaDebug()` map field the browser smoke reads and only add fields.
- Pure rules (node list, selection movement, state per progress, card text keys) in `mapRules.ts` with unit tests first. Strings in `mapText.ts` must be drawable by the retro font; add a test using `GLYPHS` like `tests/retroFont.test.ts` does.
- Respect reduced motion (no flicker/pulse when `motion.reduced`).

### B3. Page UI, logo and background
Files you own: `index.html`, `src/style.css`, and `src/main.ts` only if unavoidable.
- Replace the plain title with the logo image (keep a real `<h1>` with an accessible name; the image needs `alt="PachaByte"`; keep `#view-title`, `#view-help`, `#view-result`, `#achievements`, `#navigation`, `#game`).
- Page background from `PAGE_BG`; keep the area behind the game dark and calm.
- Theme the nav buttons: neon edges, stepped chakana-style cut corners (CSS `clip-path` or borders), an indigo / magenta / orange / gold accent palette beyond turquoise, clear `:hover`, `:active`, `:focus-visible` and `aria-pressed` states, 44 px minimum touch height, good contrast, `prefers-reduced-motion` honored, and no `transition: all`.
- **Do not change button order, ids, `data-view` values, visible text or accessible names**: `tests/browser-smoke.mjs` finds buttons by names ("Jugar ruta", "Ir a Amaru", "Mapa", "Reintentar", /^Sonido:/, /^Reducir movimiento:/) and clicks them. Grouping Sonido and Reducir movimiento into one "Ajustes" disclosure is **deferred**: Track A will do it after merging, together with the smoke update. Mention it as pending, do not do it.
- No horizontal overflow at 470 px width; keep the page usable at 1000x800 and 600x700.

## 3. Track A owns these; do not edit
`src/game/RouteScene.ts`, `GuardianScene.ts`, `animation.ts`, `sfx.ts`, `textures.ts`, `text.ts`, `debug.ts`, `spriteFrames.ts`, `sheetTextures.ts`, `bugArt.ts`, `bugRules.ts`, `pickup*.ts`, `loopRules.ts`, `liberationRules.ts`, `amaruRules.ts`, `reverseRules.ts`, `routeRules.ts`, `hud*.ts`, `effectsRules.ts`, all other `src/game/*` files you did not create, `tests/browser-smoke.mjs`, `tests/animation.test.ts`, `tests/sfx.test.ts`, every existing test file except where you add new ones, `docs/ruta01-*.png`, `odd/tasks/*`, `README.md`.
If you run the browser smoke (it rewrites `docs/ruta01-*.png`), restore them afterwards with `git checkout -- docs/ruta01-*.png` and do not commit them.

## 4. Verification you must run and report (in your worktree)
`npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, then `npx.cmd vite preview --host 127.0.0.1 --port 4190 --strictPort` and the **unmodified** smoke serially in WebGL and in Canvas (`PACHA_RENDERER=canvas`, `PACHA_URL=http://127.0.0.1:4190`): it must still pass, because you changed no behavior it relies on (if a map or page assertion fails because of your intended change, stop and report it as a request for Track A instead of editing the smoke). Also take screenshots of the map (restored and corrupted states, selection on a locked node) and of the page at 1000, 600 and 470 px and LOOK at them in both renderers.

## 5. Final report format
What you built; files added and changed; decisions (sizes, formats, tool changes); every command run with its observed result; RED evidence; screenshots reviewed; the commits made (hash and message); anything partial; **Requests for Track A** (smoke changes, text.ts strings, integration steps for the eye, shots and neon backdrop, the Ajustes disclosure). Do not claim a check passed unless you ran it here.

## 6. What remains overall (for your awareness; not yours unless stated)
- Track A: finish P2; P3 Pulso de la Trama (Shift on the route with at least 60 meter); merge Track B; Ajustes disclosure and smoke update; integrate `SHOTS`, `LOOP_NODE_EYE`, `BG_ROUTE_NEON`; HUD shield icon touching "ENERGÍA"; optional bigger Corruptor; README and screenshots; final smoke in both renderers; deploy v1.0.
- User: playtest, art license decision for the art folder (currently "all rights reserved").

## 7. UPDATE after P2 was merged and deployed (supersedes earlier ownership where different)

### 7.1 What changed
- `main` is now at commit `21cf517` (v0.7, live): P2 is done (animated bolts with impact bursts, Amaru liberation creature burst, eye-relic loop node, all procedural placeholders). 347 unit tests; the smoke has more checks. Track A is **not editing any file right now**; its next task (P3, Pulso de la Trama) will only start after the user confirms.
- Your branch `feat/track-b-ui-map` was created before P2. **First step:** in your worktree run `git merge --ff-only feat/polish-phases` (it should fast-forward; your untracked `docs/track-b-progress.md` is not a problem). Then re-run `npm.cmd ci` ONLY if your own `node_modules` is still missing, after confirming with `Test-Path` that no junction remains. Re-read this brief afterwards: it is also updated there.
- The incident with `npm ci` and the junction is closed: Track A verified its dependencies intact (same versions as the lockfile, 347 tests passing).

### 7.2 New ownership map
**Track B now owns (in addition to section 2):**
- `src/game/fxTextures.ts`, `src/game/eyeArt.ts`, `src/game/shotFx.ts`, `src/game/spriteFrames.ts`, `src/game/sheetTextures.ts` and the new files you create: this is where the delivered sprites replace the procedural placeholders (P2 isolated the swap there).
- `index.html`, `src/style.css`, `src/main.ts` (including the **"Ajustes" disclosure** that groups "Sonido" and "Reducir movimiento" into one control; keep the exact accessible names and visible text "Sonido: sí/no" and "Reducir movimiento: sí/no" once opened).
- In `tests/browser-smoke.mjs` you may change ONLY the lines that locate or click the Sonido and Reducir movimiento buttons (add a tiny helper that opens "Ajustes" first, and keep the keyboard-only spirit). No other lines, no new groups, no renamed constants. List the exact hunks in your report.
- Your own new tests for map rules, map text and sprite frame tables.

**Track A still owns (do not edit):** `RouteScene.ts`, `GuardianScene.ts`, `animation.ts`, `sfx.ts`, `textures.ts`, `text.ts`, `debug.ts`, `hud.ts`, `hudRules.ts`, `routeRules.ts`, `amaruRules.ts`, `reverseRules.ts`, `pickupRules.ts`, `bugRules.ts`, `bugArt.ts`, `loopRules.ts`, `liberationRules.ts`, `liberationFx.ts`, `eyeRelic.ts`, `effectsRules.ts`, `balanceRules.ts`, all other existing tests, `docs/ruta01-*.png`, `odd/tasks/*`, `README.md`. Anything you need there goes under "Requests for Track A".
If a requirement forces a one-line change in an `src/game/` file Track A owns (for example a texture key), do **not** edit it: put the exact diff in your report.

### 7.3 Task list now (in this order, one local commit per task)
- **B1** prepare the six images (as in section 2).
- **B2** MapScene with `MAP_TRAMA` (as in section 2). Check `tests/browser-smoke.mjs` for every map field and key it reads and keep them working.
- **B3** page UI, logo, page background, thematic buttons, **plus the Ajustes disclosure** (now yours).
- **B4 (new)** integrate `SHOTS` into the bolts: replace the procedural bolt and impact-burst frames with the prepared sheet through `fxTextures.ts` (normal bolt, Ráfaga bolt, 4-frame impact burst). Hitboxes, speeds and the invisible 6x3 physics bodies must stay exactly as they are; Nokia four-green twins must still exist and the exact four-green REVERSE frame must still pass; reduced motion keeps frame 0.
- **B5 (new)** integrate `LOOP_NODE_EYE` through `eyeArt.ts` (4 idle frames, hit, cracking, shattering; the frame-to-sheet mapping is documented in that file). Node HP, position, bobbing and hitbox unchanged.
- **B6 (not yours, do not start)** `BG_ROUTE_NEON` needs a change in `RouteScene.ts`; prepare it and write the exact integration steps in `docs/design/INTEGRATION_NOTES.md` for Track A.

### 7.4 Verification (stronger now)
After each task: `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`. Before your final report, run the smoke serially: WebGL twice and Canvas once on your own port (4190-4199). The smoke has pilot-dependent checks: a single failure in a pilot-driven check ("REVERSE at least twice", "solid Packet Loss block must cost a heart", Marea, Firewall) is a known flake; rerun to classify it, and report every run honestly. Failures in checks about your changes (map, page, bolts, eye, buttons) are real: fix them. Screenshots: map (restored and corrupted, locked node selected), page at 1000, 600 and 470 px, bolts in a Ráfaga volley, the eye idle and breaking. Look at them in both renderers.

### 7.5 Report additions
Include: the merge result of `git merge --ff-only feat/polish-phases`; the smoke hunks you touched; a list of integration risks for when Track A merges your branch after P3.
