# Continuation plan: everything that is left (single source of truth)

**Audience:** the AI session that takes over all remaining development. From 2026-10-14 the previous session (Track A) is **frozen** and will not edit the repo; you own every file. Read this file completely, then `AGENTS.md` (repo root), `docs/HANDOFF.md`, `docs/design/DECISIONS.md` (canon, Spanish), `docs/PARALLEL_BRIEF.md` (details of the map/page/art tasks B1 to B5) and `odd/tasks/polish-phases.md`. If anything here contradicts the checkout, trust the checkout and report it.

## 1. State in one screen
- **Live (v0.7):** https://andrewmechdev.github.io/pachabyte/ from `main` commit `21cf517` (GitHub Pages workflow `.github/workflows/pages.yml`; repo https://github.com/AndrewMechDev/pachabyte, public). Local `main` may be ahead by documentation commits only.
- **What the game is now:** free-flight Ruta 01 in Arequipa (~98 s: arrival, Glitchlings, fragments, Firewall, Packet Loss, Misti eruption, mixed swarm with Corruptors and Sombras, Memory Leak, Marea, Bucle with an eye-relic node, threshold) leading to Amaru-01 (80 HP, three HP-based phases, REVERSE, shield, wave, liberation with a creature burst, dialogue, Codex, result). Pickups (Ráfaga 9 s x2 damage, Escudo, Corazón), racha x2-x4, hit-stop, synthesized sound, Spanish UI, reduce-motion option.
- **Quality gates now:** 347 unit tests (`npm test`), typecheck, build, and a keyboard-only browser smoke (`npm run test:browser`, about 20+ groups, WebGL and Canvas). Pilot-driven checks are flaky in a minority of runs ("REVERSE at least twice", "solid Packet Loss block must cost a heart", Marea, Firewall); always rerun to classify and never weaken an assertion.
- **Branches/worktrees:** main folder `C:\Users\dark_\Documents\hack-the-andes-game` (branch `feat/polish-phases` == `main` locally). Your worktree: `C:\Users\dark_\Documents\hack-the-andes-game-worktrees\track-b`, branch `feat/track-b-ui-map` (no commits yet when this was written). A stale worktree `...\playtest-b1` (detached at `530296e`) serves the user's old playtest on port 4181: do not stop it without asking; remove it at the end with `git worktree remove`.
- **Ports never to use or stop:** 4173 and 4181 (user). Use 4190-4199 for yours.

## 2. Rules that must not be broken
1. User rules (`~/.claude/CLAUDE.md`): Conventional Commits, **never** add `Co-Authored-By` or any AI attribution, short answers, one question at a time.
2. Design canon is `docs/design/` (Spanish). In-game text in Spanish; code, identifiers and technical docs in English. No copied art, characters, levels or mascots of other games or programming languages (the user's idea of Peruvianized language mascots was declined: guardians are original Andean creatures that evoke a technology by behavior).
3. Tests first: write the failing test, observe RED, implement, GREEN. Report only RED you saw. Never weaken an assertion; classify flakes by rerunning and say so.
4. Visual size and hitboxes stay separate; never scale a physics sprite. Canvas ignores tint: derive textures. Exact four-green Nokia palette during REVERSE (the smoke checks every pixel; effects drawn then must be alpha 1 with green variants).
5. Two clocks (real and world), pause and focus freeze both, `motion.reduced` respected, one-shot key guard `oncePerEvent` on pause.
6. Art flow: user images go in `assets/incoming/` (never modify), prepared with `tools/prepare_sprite.py` into `assets/prepared/`, documented in `docs/design/ASSET_REQUESTS*.md` and `CREDITS.md`. Missing art = labelled procedural placeholder.
7. **Git and publishing:** work on a branch, commit per work unit, never force-push. **Pushing to `main` (which deploys) needs the user's explicit go-ahead in your session;** the earlier authorization belonged to the previous session. After a push, wait for the Pages run to finish and compare the live bundle hash with `dist/assets/index-*.js`.
8. Windows and tooling: `npm.cmd`, Git Bash, `python -I`; `rg` and `sd` are not installed; long patch scripts must be written with a file tool and run by path (bash heredocs lose backslashes). **Never `rm -rf` a `node_modules` that may be a junction** (it can delete the main folder's real dependencies); remove a junction only with `cmd /c rmdir`, then `npm.cmd ci` inside your own folder without interrupting it.
9. Delegation pattern that worked: one writer subagent per task with a complete brief, explicit allowed edit surfaces and a verification list; the parent re-runs typecheck and unit tests, reads at least one capture, then commits. If an agent dies on an API session limit, resume it with `SendMessage`.

## 3. Everything that is left, in execution order
Every item ends playable. Commit per task. Rows marked **(user)** need the user.

| # | Task | Spec / where | Files | Needs |
|---|---|---|---|---|
| 1 | Sync your branch | `git merge --ff-only feat/polish-phases` in your worktree; own `node_modules` via `npm.cmd ci` (see rule 8) | none | |
| 2 | **B1** prepare the 6 new images | `docs/PARALLEL_BRIEF.md` section 2 and 7: `MAP_TRAMA`, `LOGO_PACHABYTE`, `PAGE_BG`, `LOOP_NODE_EYE`, `SHOTS`, `BG_ROUTE_NEON` (sources in `assets/incoming/`) via `tools/prepare_sprite.py` (extend with an opaque-resize mode if needed, with self-test); write `docs/design/INTEGRATION_NOTES.md`; update `ASSET_REQUESTS_V2.md` and `CREDITS.md` | `tools/`, `assets/prepared/`, docs | |
| 3 | **B2** map screen | Declutter: title, ONE selected-node card, ONE key bar. Use `MAP_TRAMA`; six sockets (measure centers; rough source coords (365,190), (437,390), (1000,455), (1285,228), (845,675) Arequipa glowing, (1318,665)). Arequipa corrupted/restored by progress, other nodes locked with an "EN CONSTRUCCIÓN" feel; never invent real city lore (name them RUTA 02..06). Arrow keys/A-D move selection; Enter acts; `2` goes to Amaru; keep every `pachaDebug()` map field the smoke reads. Pure rules `mapRules.ts` + `mapText.ts` (font-drawable, test with `GLYPHS`), reduced-motion safe | `MapScene.ts`, new `mapRules.ts`, `mapText.ts`, tests | |
| 4 | **B3** page UI | Logo image with a real `<h1>` and `alt`, `PAGE_BG` behind a calm center, thematic buttons (neon edges, stepped chakana corners, indigo/magenta/orange/gold beyond turquoise, hover/active/focus-visible/aria-pressed, 44 px targets, `prefers-reduced-motion`, no `transition: all`), no overflow at 470 px, **"Ajustes" disclosure** grouping "Sonido" and "Reducir movimiento" (keep exact names/text once open; update only the smoke lines that click them) | `index.html`, `src/style.css`, `src/main.ts`, small smoke hunks | |
| 5 | **B4** integrate `SHOTS` | Replace the procedural bolt and impact-burst frames via `fxTextures.ts` (normal, Ráfaga, 4-frame burst). Keep the invisible 6x3 physics bodies, speeds, four-green twins and reduced-motion frame 0 | `fxTextures.ts`, `shotFx.ts` | |
| 6 | **B5** integrate `LOOP_NODE_EYE` | 7 frames (4 idle, hit, crack, shatter) via `eyeArt.ts`; HP 5, position, bob and hitbox unchanged | `eyeArt.ts`, `eyeRelic.ts` | |
| 7 | **P3 Pulso de la Trama** | The REVERSE meter is only visible on the route today and has no use there. First record the decision in Spanish in `docs/design/DECISIONS.md`. Rule: on the route, Shift/K (X) with meter >= 60 spends 60 for a radial pulse (~80 px): destroys enemy orbs in range, deals 2 damage to bugs in range, 600 ms invulnerability, short cooldown to prevent spam; HUD hint "SHIFT: PULSO" when available; in the Amaru fight Shift keeps REVERSE (meter 100). Pure `pulsoRules.ts` with tests first, effect (ring burst, four-green safe), sound cue, `debug.ts` fields, smoke group, reduced-motion safe | `RouteScene.ts`, `hud.ts`, `text.ts`, `sfx.ts`, `debug.ts`, new rules, tests | |
| 8 | **B6** route neon backdrop | Integrate `BG_ROUTE_NEON` (prepared 320x180): the sky shifts from the calm sunset to the corrupted neon night as the route progresses (cross-fade tied to segments such as Packet Loss, Memory Leak and Marea; calm central band stays readable; reduced motion = no animated fade). Keep the Misti plume/glow and mist bands working. Also vary the in-game HUD/UI accent colors beyond teal where it improves identity (do not break the font atlases: colors come from pre-colored atlases `fontKey(color)`) | `RouteScene.ts`, `routeAmbient.ts`, `text.ts`/fonts | |
| 9 | UX fixes | HUD shield icon touches the "ENERGÍA" label (`hud.ts`); pause overlay and result screens still readable; check every Spanish string for typos; contrast of captions | `hud.ts` | |
| 10 | Corruptor size (optional) | The 24 px sprite reads small; try `tools/prepare_sprite.py --auto --target 30x32`, keep the hitbox unchanged | `spriteFrames.ts`, assets | user sign-off |
| 11 | Stabilize the smoke pilots | Make the fight pilot win more often at 80 HP and the route pilot robust at Packet Loss and Firewall, without weakening any assertion; keep known-flake notes honest | `tests/browser-smoke.mjs` | |
| 12 | Docs | README (English + "En español"): new features, controls (Pulso, Ajustes), real screenshots, honest limits; `CREDITS.md` (all user-generated art, sources preserved); `docs/VERIFICATION.md` observed results only; mark statuses in `ASSET_REQUESTS*.md`; update `odd/tasks/polish-phases.md` | docs | |
| 13 | Final QA | `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, smoke WebGL x2 and Canvas x2 on your port; look at captures in both renderers; test at 1000, 600 and 470 px | | |
| 14 | **Deploy v1.0** | Rebase your branch on `main`, merge fast-forward from the main folder (`git checkout main && git merge --ff-only <branch>`), **ask the user**, push, wait for the Pages run, compare the live bundle hash, run the smoke against the live URL | | **user go-ahead** |
| 15 | Backup hosting | Cloudflare Pages or Netlify connected to the same repo (`npm run build`, output `dist`, `NODE_VERSION=22`); the Vite `base` is relative so any path works | | **user** (their account) |
| 16 | Delivery package | Confirm the submission format with the user (link, short video, description). Draft: one-paragraph description, 30-60 s screen-recording script, screenshot set, honest limits | docs | **user** |

## 4. Art status (what the user still has to generate)
Prompts are in `docs/design/ASSET_REQUESTS.md` and `ASSET_REQUESTS_V2.md`.
| ID | Status | Note |
|---|---|---|
| `BUG_CORRUPTOR`, `BUG_SOMBRA_DE_ERROR`, `PICKUPS` | **integrated** | user art, prepared via `--auto` |
| `MAP_TRAMA`, `LOGO_PACHABYTE`, `PAGE_BG`, `LOOP_NODE_EYE`, `SHOTS`, `BG_ROUTE_NEON` | **received**, not prepared or integrated (tasks 2 to 8) | in `assets/incoming/` |
| `BUG_GLITCHLING` | **never generated: still a procedural placeholder** | the most common enemy; first priority if the user can generate more |
| `AMARU_BODY` (segment, tail, core), `AMARU_RESTORED` | **never generated: procedural placeholders** (`amaruArt.ts`, restored head reuses the original) | |
| `BG_AREQUIPA_ROUTE` | superseded in practice by the current arena backdrop plus `BG_ROUTE_NEON`; ask before using | |
| `KIPU_FLY_ACTIONS` (shoot, PachaShift frames) | optional, not generated | |
Procedural placeholders still in the game: Glitchling, fragment, Firewall wall, Marea tile, Packet Loss blocks, embers, Memory Leak zones, Amaru body segments/tail/core and the corrupted head variant (a recolor of the original head).

## 5. Open decisions for the user
- Art license: code is MIT; art is "all rights reserved" (`CREDITS.md`) until the user chooses.
- Balance after the second playtest: collect feedback on Amaru's difficulty (80 HP, entry with 3+ hearts and a shield) and on the route length (~98 s).
- Whether and when to publicize (see section 7).
- Hackathon eligibility and rules are **unverified**: the earlier README text said the event is October 17-18 and applications closed October 9 (user-reported preselection before October 14). Do not claim eligibility.

## 6. Backlog ideas (not approved, do not build without asking)
More enemy variety and attack patterns on the route; extra Kipu combos or effects beyond racha and Pulso; touch controls; persistent saves; music; more regions and guardians (the canon lists Wisk'a, Kallpa, Nina, Kinti, Qhapaq, Yaku and Ñan as proposals only, not assigned to cities); a Codex screen.

## 7. Can the user announce it (for example on LinkedIn)?
Yes, the build at the live URL is playable and stable enough to share as an early, desktop-keyboard prototype, and the URL never changes, so people always get the latest deploy. Before posting: say it is keyboard-only for desktop; disclose that the art was generated with an image AI (already in `CREDITS.md`); decide the art license; verify the hackathon's rules about prior work and public sharing before presenting it as a submission; the README must be current (task 12). No secrets exist in the repo (scanned), and the Pages bandwidth limits are generous for a small game.

## 8. Report format when you finish a task
What you built; files changed; every command run with its observed result; RED evidence; screenshots reviewed (both renderers); commit hashes; anything partial; open questions for the user. Never claim a check passed unless you ran it in this checkout.

## 9. Addendum (2026-10-14): story, pacing, sharing and merge checkpoints

Approved by the user in the Track A session. These tasks are added to section 3 and keep the same rules (tests first, one commit per task, no AI attribution, no push or merge by you).

### 9.1 New order of work
B3 page UI + "Ajustes" → B4 integrate SHOTS → B5 integrate LOOP_NODE_EYE → **CHECKPOINT 1** → S1 → S2 → S3 → S4 → **CHECKPOINT 2** → P3 Pulso de la Trama → B6 neon route backdrop → UX fixes → smoke pilot stabilization → docs → **CHECKPOINT 3** → final QA → **CHECKPOINT 4 (release candidate)**. Deploy v1.0, backup hosting and the delivery package still need the user (tasks 14 to 16).

### 9.2 Merge protocol (checkpoints)
You never merge into `main` and never push. At each checkpoint: (1) in your worktree run `git merge --ff-only main` or rebase onto `main` so the diff is minimal; (2) run typecheck, unit tests, build and the smoke (2 runs WebGL, 1 Canvas) and report every run; (3) deliver the checkpoint report (commits, commands with observed results, screenshots in both renderers, integration risks) and STOP. The reviewer (Track A, read-only) verifies independently, fast-forwards `main` locally, and, only with the user's go-ahead, pushes to deploy. After that, sync again with `git merge --ff-only main` before continuing. Keep branches linear so fast-forward always works.

### 9.3 S1 Intro cards (once per session, skippable)
- New scene `IntroScene` between the map and the route; shown when the route is started from the map (Enter on Arequipa, or key 1), only the first time in the session (registry flag), never when going straight to Amaru with key 2.
- Four cards, typed text (30 ms per character, static when `motion.reduced`), 3 s each or Enter/Space to advance, Esc skips all; total at most about 12 s. Dimmed route backdrop, small Kipu, one blip sound per card, focus pause respected. Spanish, canon-only (no origin of El Desfase, no origin of Kipu, no secrets):
  1. "EN EL PERÚ DE LA TRAMA, TODO ESTÁ CONECTADO."
  2. "EL DESFASE APAGA LAS RUTAS Y CORROMPE A SUS GUARDIANES."
  3. "UNA CHISPA TURQUESA DESPIERTA: KIPU."
  4. "REPARA LAS RUTAS. LIBERA, NO DESTRUYAS."
- Pure rules (`introRules.ts`: card timing, skip, once-per-session) with tests first; strings in a font-covered module with a glyph test.
- The browser smoke starts the route with Enter and waits for scene `route`: update ONLY that start helper to skip the intro (wait for scene `intro`, press Enter or Esc, then wait for `route`) and add one group asserting the intro appears once, is skippable and does not reappear in the same session. This is an intentional flow change: do not weaken any other assertion.

### 9.4 S2 Narrative captions during the route (non-blocking)
- Short ambient lines (at most 38 characters, 2.5 to 3 s, no pause) at segment starts, as environmental storytelling. A small queue guarantees they never overlap the instructional hazard captions already shown and never cover the HUD. At most 6 lines, canon-safe, Spanish. Suggested set (adjust wording, keep the intent): arrival "AREQUIPA PIERDE SU BRILLO..."; first bugs "LOS ERRORES DE LA TRAMA TE BUSCAN."; Packet Loss "LOS DATOS SE PIERDEN Y VUELVEN."; Misti "EL MISTI TAMBIÉN SIENTE EL DESFASE."; Memory Leak "LA ENERGÍA SE ESCAPA DE LA TRAMA."; Bucle "TODO SE REPITE... HASTA QUE ALGO CAMBIE."
- Data-driven schedule in a pure module with tests: every line inside its segment, none overlapping instructional captions, count and length limits, glyph coverage.

### 9.5 S3 Tighter pacing (the user feels a long wait before Amaru)
- Measure dead time in the scripted timeline (seconds with no enemy, hazard, pickup or fragment line on screen). Add a test that no gap exceeds 5 s outside the threshold, then fix the opening first: populate the first 8 s (first Glitchling at about 3 s, a second at about 5 s, hints first) WITHOUT shifting segment boundaries.
- Only if gaps remain, compress other segments, updating every test, constant and pilot expectation that hard-codes times, and report the old and new total length (target 80 to 90 s). Never remove a hazard approved in the canon.

### 9.6 S4 Sharing and device readiness (index.html, public assets, small helpers)
- Touch/mobile notice: when the device is touch-first (`(pointer: coarse)`) or the viewport is too small, show a clear Spanish banner above the game: "PachaByte se juega con teclado: ábrelo en una computadora." (the game stays available). Pure helper with unit tests; no horizontal overflow at 470 px.
- Open Graph and Twitter card tags (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `twitter:card`) and a `<meta name="description">`, in Spanish. The preview image must be served by Pages: place a 1200x630 image in `public/` (for example `public/social-preview.png`) cropped from one of the 1920x1080 captures in `C:\Users\dark_\Documents\hack-the-andes-game-social\LinkedIn\` (for instance `01_rafaga_de_la_trama.png`), and reference its absolute URL `https://andrewmechdev.github.io/pachabyte/social-preview.png`. Verify the built `dist/index.html` contains the tags and the image is copied to `dist/`.
- Browser check: run the smoke also with `PACHA_BROWSER_CHANNEL=chrome` if Chrome is installed, and report; Firefox and Safari remain unverified (say so in the README limits).

### 9.7 Anything else a release needs (already in section 3, listed for completeness)
Pulso de la Trama (P3), neon route backdrop (B6), HUD shield icon overlap, optional bigger Corruptor, stabilize the smoke pilots, README with screenshots and "En español", CREDITS, VERIFICATION, final QA in 1000/600/470 px, backup hosting and delivery package (user), and the art license decision (user).

## 10. Roles and workflow from 2026-10-14 (second handoff, supersedes the Track A/Track B wording)

The previous Claude session (Track A) is **retired**. Two agents now work, each in its own folder, and the user relays reports between them.

### 10.1 Roles and folders
| Role | Agent | Folder | Branch | Owns |
|---|---|---|---|---|
| **PRINCIPAL** (integrator, reviewer, releaser) | Claude Code desktop, new account | `C:\Users\dark_\Documents\hack-the-andes-game` | `main` for merges; its own work on `feat/release-docs` | Independent review of every checkpoint, fast-forward merges into `main`, deploy to GitHub Pages (only with the user's go-ahead), live verification, `README.md`, `CREDITS.md`, `docs/VERIFICATION.md`, delivery package, LinkedIn kit, hosting backup guide, final QA, v1.0 release |
| **WORKTREE AGENT** (developer) | Codex desktop | `C:\Users\dark_\Documents\hack-the-andes-game-worktrees\track-b` | `feat/track-b-ui-map` | All game code and its tests, `tests/*`, `src/*`, `index.html`, `public/`, `docs/track-b-progress.md`, `docs/design/*`, `odd/tasks/*` |
Neither agent edits the other's files. Neither pushes except the principal, and only after an explicit user go-ahead in its own session.

**Codex warning:** the Codex desktop app also keeps its own automatic worktrees under `C:\Users\dark_\.codex\worktrees\<id>\hack-the-andes-game` in *detached HEAD* state. Do **not** work there: commits made on a detached HEAD are easy to lose and a branch cannot be checked out in two worktrees. Open and work only in the `track-b` folder above, on the branch `feat/track-b-ui-map` (verify with `git branch --show-current`).

### 10.2 Git rules (keep history linear)
1. `main` only moves by fast-forward, performed by the principal after a review. No one commits directly on `main`.
2. Before every checkpoint the worktree agent rebases its branch onto `main` (`git rebase main`); the principal rebases `feat/release-docs` onto `main` before merging it. If `main` moved, rebase first, then re-run the checks.
3. Principal merge routine (from the main folder, clean tree): `git checkout main && git merge --ff-only feat/track-b-ui-map` then `git checkout feat/release-docs && git rebase main`. If `--ff-only` refuses, the worktree agent must rebase.
4. Commits: Conventional Commits, one per work unit, **no `Co-Authored-By` and no AI attribution** (verify with `git log --format=%B | grep -ciE "co-authored|generated with|claude|anthropic|codex"`, expected 0). Never force-push.

### 10.3 State at the handoff (verified 2026-10-14)
- **Live (GitHub Pages): v0.7** = game code of `21cf517`, docs up to `4c96538` (https://andrewmechdev.github.io/pachabyte/).
- **Local `main` = `9ed1846` = v0.8 candidate**, NOT pushed: B1 (art prepared), B2 (new map), B3 (themed page, logo, background, "Ajustes"), B4 (user bolts and impact bursts), B5 (eye relic from the user's sheet). Independently reviewed: 0 AI attribution lines, typecheck OK, 35 files / 385 tests OK, build OK, `tests/page-ui-check.mjs` 14/14, WebGL smoke OK, captures of the page at 1280 and 470 px, of bolts and of the eye reviewed. **Pending user decision: push v0.8 to production or wait for Checkpoint 2.**
- `feat/track-b-ui-map` is at `9ed1846` (same as `main`), clean tree.
- Stale things to clean at the end (not now): worktree `...\hack-the-andes-game-worktrees\playtest-b1` (detached at `530296e`), local branches `feat/polish-phases` and `feat/release-polish` (already merged), the Codex automatic worktrees. Ports `4173` and `4181` belong to the user: never use or stop them; use `4190-4199`.
- Known flaky smoke checks (pilot-dependent, not game defects): "REVERSE at least twice", "solid Packet Loss block must cost a heart", Marea, Firewall. Always rerun to classify and report every run.

### 10.4 Work split
**WORKTREE AGENT (Codex), in this order, one commit per task, no waiting for approval between tasks:**
0. Two small fixes first, in one commit: change the page eyebrow text "PROTOTIPO LOCAL · RUTA 01" to "PROTOTIPO · RUTA 01" and replace the stale sentence "Arte provisional original, no son spritesheets finales..." with a short current one; raise the Bucle eye hitbox to about 18x20 px with a test first (the node breaks by itself after 2 repeats, so balance is unaffected) and report it explicitly.
1. S1 intro cards, S2 narrative captions, S3 tighter pacing, S4 sharing and device readiness: exactly as specified in section 9.3 to 9.6.
2. **CHECKPOINT 2** (after S4): rebase on `main`, run typecheck, unit tests, build, `tests/page-ui-check.mjs` and the smoke (2 runs WebGL, 1 Canvas; report every run), capture screenshots in both renderers (intro cards, a narrative caption, the pacing change, the mobile notice at 470 px, the share preview tags in `dist/index.html`), and STOP with the report of sections 9.2 and 10.7.
3. After Checkpoint 2 is merged: P3 Pulso de la Trama, B6 neon route backdrop, UX fixes (HUD shield icon vs "ENERGÍA"), optional bigger Corruptor, smoke pilot stabilization, then Checkpoint 3, final QA fixes and Checkpoint 4.

**PRINCIPAL, while Codex works (no overlap with Codex files):**
1. First action with the user: decide whether to push v0.8 now (steps in 10.5) or wait for Checkpoint 2.
2. Create `feat/release-docs` from `main`. Refresh `README.md` (English + "En español") for v0.8 and later: current features (map, logo, Ajustes, user art, Packet Loss/eruption/Memory Leak/Bucle, Corruptor, Sombra, racha, pickups), controls table, honest limits (desktop keyboard only, Edge-tested only), real screenshots under `docs/` (reuse `C:\Users\dark_\Documents\hack-the-andes-game-social\LinkedIn\` captures, or regenerate with `tools/capture-social.mjs`). Update `CREDITS.md` for every user-generated asset (sources preserved in `assets/incoming/`, prepared with `tools/prepare_sprite.py`). Append observed results only to `docs/VERIFICATION.md`.
3. Prepare the delivery package drafts in `docs/delivery/`: one-paragraph description (Spanish and English), a 30 to 60 s screen-recording script, screenshot list, honest limits, and the LinkedIn post draft with the AI-art disclosure. Prepare the backup hosting guide (Cloudflare Pages: build `npm run build`, output `dist`, env `NODE_VERSION=22`; the Vite base is relative so any path works); the user connects their own account.
4. Review every checkpoint of the worktree agent with the routine in 10.6 and merge approved ones.

### 10.5 Deploy routine (principal, only after the user's explicit go-ahead)
`git checkout main` (clean tree) → `npm.cmd test` and `npm.cmd run build` → `git push origin main` → poll `gh run list --repo AndrewMechDev/pachabyte --limit 1` until `completed success` → compare the live bundle (`curl -s https://andrewmechdev.github.io/pachabyte/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js'`) with `dist/assets/index-*.js` → run the smoke against `PACHA_URL=https://andrewmechdev.github.io/pachabyte` and report. Never force-push.

### 10.6 Independent review routine (principal, per checkpoint; never touch the worktree)
1. `git log --oneline main..feat/track-b-ui-map`; attribution grep (expected 0); `git diff --stat main..feat/track-b-ui-map`.
2. Export a clean copy: `git archive feat/track-b-ui-map | tar -x -C <scratch>`; give it dependencies with a junction to the main folder's `node_modules` (PowerShell `New-Item -ItemType Junction`). **Remove the junction only with PowerShell `[System.IO.Directory]::Delete('<path>')` (removes the link only).** Never `rm -rf` it and avoid `Remove-Item` on it. Afterwards confirm the main folder still has `node_modules\phaser`, `vite`, `vitest`, `typescript`, `playwright`.
3. In the copy run `npx.cmd tsc --noEmit`, `npm.cmd test`, `npm.cmd run build`, then `npx.cmd vite preview --host 127.0.0.1 --port 4196 --strictPort` and `PACHA_URL=http://127.0.0.1:4196 npm.cmd run test:browser` (WebGL; add `PACHA_RENDERER=canvas` for Canvas), plus `node tests/page-ui-check.mjs`. Stop only your own port.
4. Look at screenshots yourself in both renderers (page at 1280/600/470 px, map, route, fight, the new feature). Tap-shorter-than-a-frame inputs from Playwright (`press` with no delay) are lost by design in some scenes: use `{ delay: 80 }` when testing keys.
5. If good, merge per 10.2.3 and tell the user; if not, return a numbered list of findings to the worktree agent. Never claim a check passed that you did not run.

### 10.7 What each side must hand back to the user
Every report: what was built; files changed; every command with its observed result; RED evidence; screenshots reviewed (both renderers); commit hashes; anything partial; open questions. The user pastes each agent's report to the other when cross-checking is needed.
