# Handoff: continue PachaByte from any AI session

Read this first, then `AGENTS.md`, `odd/tasks/polish-phases.md` (the plan and status) and `docs/design/DECISIONS.md` (canon). Do not trust this file over the checkout: verify with `git log`, `npm test` and the live site.

## Where things stand (2026-10-13)
- Live game: https://andrewmechdev.github.io/pachabyte/ (GitHub Pages, workflow `.github/workflows/pages.yml`, built from `main`). Repo: https://github.com/AndrewMechDev/pachabyte (public).
- `main` = v0.5 (`530296e`): free-flight Ruta 01 (~98 s, Packet Loss, Misti eruption, Memory Leak, Bucle, Marea), Amaru-01 in three phases with REVERSE and liberation, pickups, racha, Corruptor and Sombra with the user's sprites, Spanish UI, sound, reduced motion.
- Work branch: `feat/polish-phases` (created from `main`). Plan: phases P1 to P5 in `odd/tasks/polish-phases.md`.
- 291 unit tests; a keyboard-driven browser smoke (`npm run test:browser`) covering 19 groups in both Canvas and WebGL.

## How to run and verify
```bash
npm ci
npm run dev                      # http://127.0.0.1:5173/
npm run typecheck && npm test && npm run build
npx vite preview --host 127.0.0.1 --port 4190 --strictPort
PACHA_URL=http://127.0.0.1:4190 npm run test:browser                       # WebGL
PACHA_RENDERER=canvas PACHA_URL=http://127.0.0.1:4190 npm run test:browser # Canvas
```
Never use or stop ports 4173 and 4181 (the user's playtest servers); pick your own port. The smoke needs Edge (Playwright channel `msedge`) and Python with Pillow. On Windows use `npm.cmd`. `rg` and `sd` are not installed; use grep or Python. Long patch scripts in bash heredocs lose backslashes: write a Python file with the Write tool and run it by path.

## Rules that must not be broken
1. User instructions in `~/.claude/CLAUDE.md`: conventional commits, never add `Co-Authored-By` or AI attribution, short answers, one question at a time.
2. Canon is `docs/design/` (Spanish). In-game text in Spanish, code and technical docs in English. Never copy art, characters, levels or mascots from other games or programming languages.
3. Tests first: write the failing test, observe RED, implement, GREEN. Report only RED you actually saw. Never weaken an assertion to pass.
4. Visual size and hitboxes stay separate; never scale a physics sprite (Arcade bodies follow scale). Canvas ignores tint, so derive textures instead of tinting text or sprites.
5. Exact four-green Nokia palette during REVERSE (the smoke checks every pixel). Effects drawn then must be alpha 1 and use green variants.
6. Two clocks: real (player, UI, timers) and world (enemies, hit-stop). Pause (Esc/focus) freezes both. Respect `motion.reduced`.
7. Art: follow `docs/design/ASSET_PIPELINE.md`. Missing art gets a labelled procedural placeholder and a prompt in `docs/design/ASSET_REQUESTS*.md`. User images go to `assets/incoming/` (never modified), prepared with `tools/prepare_sprite.py` into `assets/prepared/`.
8. Git: work on a feature branch, commit per work unit, then fast-forward `main` and push. The user authorized pushing verified phases to `main` to deploy. Never force-push. Confirm the Pages run finished and the live JS hash matches `dist/assets/index-*.js`.
9. Delegation pattern that worked: one writer agent per task with a full brief, explicit allowed edit surfaces and a verification list; the parent re-runs typecheck and unit tests, reads one capture, then commits. If an agent dies on an API session limit, resume it with `SendMessage`; its partial work stays in the tree.

## Known open items
- HUD shield icon touches the ENERGÍA label (small layout fix).
- Corruptor reads small at 24 px; a larger 30×32 version is a one-command change with `tools/prepare_sprite.py --auto --target 30x32`.
- Art not yet delivered: see `docs/design/ASSET_REQUESTS_V2.md` (map, logo, loop node eye, shots, neon route backdrop, page background) and optional items in `ASSET_REQUESTS.md`.
- Balance is tuned from one human playtest; keep collecting the user's feedback.
- Licence of the art is "all rights reserved" until the user chooses.

## Memory
Engram project `hack-the-andes-game` has topic `odd/ruta01-flight-mvp/tasks` with the same history; the repo docs are authoritative.
