# PachaByte — Phase 3 local demo

PachaByte is a local 320 × 180 side-view arcade prototype built with Phaser, TypeScript, and Vite. Enter Amaru directly from the choice screen or explore the optional four-target Arequipa route. Amaru is a one-phase fight with two telegraphed attacks and PachaShift capture/reversal. This folder is the canonical local working copy requested on October 12, 2026.

## Start locally on Windows

Requirements: Node.js 22.12+ on the 22.x line, or a supported Node 24.x/26+ release, with npm. From this folder (the one containing `package.json`):

```powershell
node.exe --version
npm.cmd ci
npm.cmd run dev
```

Open **http://127.0.0.1:5173/** and click the game to focus it. Stop the server with Ctrl+C in PowerShell. `npm.cmd` avoids PowerShell execution-policy changes. A fresh dependency install needs npm registry access. Do not copy `node_modules`; the lockfile reproduces dependencies.

## Controls

| Action | Keys |
| --- | --- |
| Move | A/D or Left/Right arrows |
| Jump | W, Space, or Up arrow |
| Fire | Hold J or Z |
| Retry current challenge | R |
| PachaShift (guardian only) | X |
| Map | M, or Enter after result |
| Choose challenge | 1: Explore Arequipa; 2 or Enter: Play Amaru |
| Sound | Page button "Sound: on/off" (session only). Effects are synthesized in code; no audio files. |

## Project map

- `src/` — Phaser bootstrap, scene, gameplay rules, and procedural placeholder visuals.
- `tests/` — deterministic rules tests and optional real-browser smoke runner.
- `docs/GDD.md` — approved creative baseline and MVP boundary.
- `docs/SHARED_WORKFLOW.md` — shared development/art handoff rules and proposed broader creative direction.
- `docs/IMPLEMENTATION_PLAN.md` — historical Sprint 0 implementation breakdown.
- `docs/PROJECT_PLAN.md` — phases, goals, acceptance criteria, event eligibility gate.
- `docs/STACK.md` — current and recommended future stack.
- `docs/DECISIONS.md` — key decisions and tradeoffs.
- `docs/VALIDATION_PLAN.md` — final verification sequence; tests have not been rerun in this copy.
- `docs/VERIFICATION.md` — historical source-copy evidence plus this copy's transfer status.

## Checks (run at the final verification gate)

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

Open **http://127.0.0.1:4173/** for the production preview. While it is running, use a second PowerShell window in this folder to run `npm.cmd run test:browser`. A successful build does not alone establish gameplay correctness. See [the validation plan](docs/VALIDATION_PLAN.md).

## Important limits

This desktop keyboard demo combines static original evaluation images and a shared low-contrast Arequipa background, not final animation spritesheets. It now includes a two-node map, one-phase guardian, HP/outcomes and PachaShift. Audio, persistent saves, touch, backend, extra worlds and deployment remain out of scope. Vite's production bundle is large for a small prototype; the historical verification records its warning.

## Hack the Andes eligibility gate

As of October 12, 2026, the official event site lists the event for October 17–18, says applications closed October 9, and says accepted participants will learn the tracks on October 17. Whether the user is accepted, what the applicable track is, and whether prior development is permitted are unknown. Treat this prototype as exploratory portfolio/demo material only until acceptance status and organizer rules explicitly establish appropriate use as a challenge submission. See [the project plan](docs/PROJECT_PLAN.md).

## Method and next step

The existing baseline was produced using an adapted Superpowers sequence: approved GDD, exact-file plan, focused implementation, and recorded verification. Superpowers is a methodology reference here, not an installed skill package. This relocation and documentation work does not approve a new gameplay feature. First complete the final validation gate for this copy, then confirm event eligibility and choose the next scoped phase.

## Phase 3 loop

Start on the choice screen. Click Play Amaru, press Enter, or press 2 to enter Amaru immediately. Click Explore Arequipa or press 1 for the optional training route. Four target hits earn training completion; they are not an access gate. Evade marked rune columns and aimed pulses or use X to slow/capture nearby bolts. Stored energy returns at expiry for real damage. Outcomes offer retry/map. Session progress resets on refresh. Other regions are future/non-playable. Original static art and reusable prompts: [PHASE3_ASSETS.md](docs/PHASE3_ASSETS.md). No full animation, audio, backend or publication. Human art/game-feel acceptance pending.

## Verified local demo

Writer and independent verifier observed 33/33 unit tests, typecheck/build exit 0, and 19/19 real-keyboard browser groups in both actual Canvas and WebGL. Exact four-green Nokia rendering, returned damage, complete challenge outcomes and retained training regressions passed. Parent typecheck and screenshot checks passed. See [verification](docs/VERIFICATION.md) for evidence and retained limitations.

Human visual/game-feel acceptance remains pending. Phase 4 local release/manual QA is proposed; no clean install, wider-device/OS-focus coverage, native approval, official eligibility verification, Git bootstrap or remote delivery is implied.
