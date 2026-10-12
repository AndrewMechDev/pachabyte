# PachaByte — Sprint 0 Implementation Plan

Deliver one reproducible local prototype after the minimal GDD is written and read back. Implement only movement, jumping, directional shooting, inert-target feedback, and provisional Arequipa-inspired scenery. Record observed checks rather than treating a successful build as a playable-game verdict.

**Baseline:** [GDD](GDD.md), October 11, 2026 (America/Lima).  
**Current folder task tracker:** [Hack the Andes game task](../odd/tasks/hack-the-andes-game.md).
**Evidence scope:** this is the historical Sprint 0 plan from the source copy; its prior checks are not fresh verification of the relocated folder.  
**Source-copy historical state:** Writer implementation complete: install, 20 rules tests, typecheck, production build and 12 grouped real-browser checks passed. Meaningful RED had 11 assertion failures before rule implementation. Independent verification and parent spot check also passed; see [the verification record](VERIFICATION.md).

## Quick execution path

1. Read back GDD and this plan; keep excluded features excluded.
2. Scaffold and install the pinned toolchain, then build rules through observed RED → GREEN tests.
3. Integrate the rules into Phaser, run fresh checks and real browser input tests where available.
4. Write README and verification evidence; report every unavailable or failed check.

## Constraints and decisions

| Topic | Decision and tradeoff |
| --- | --- |
| Toolchain | Phaser 3.90.0, TypeScript 5.9.3, Vite 8.3.4. Initial Vite 8.0.10 install reported Windows path-disclosure advisories; the same-major patched pin replaces it. Record final installation/check evidence separately. |
| Node | Vite's documented requirement is Node 20.19+ or 22.12+; the explored system Node 22.15 meets it. Recheck the executable actually used. |
| Tests | Vitest 5.0.3: registry metadata accepts Vite 8 and Node 22.12+. Playwright 1.62.1 provides the explicit browser-smoke runner; use installed Chrome/Edge without downloading a browser. |
| Architecture | One scene, pure gameplay rules, generated textures, and a small bootstrap. Avoid a framework inside the framework. |
| Art | Generate original simple shapes; turquoise/gold Kipu and pale buildings/volcanic silhouettes. No external concept images or spritesheet claims. |
| Physics | Phaser Arcade Physics with constant-speed movement, gravity, static floor/platforms, and overlap-based target impacts. |
| Resolution | Logical 320 × 180, pixel-art rendering, proportional fit and centered canvas; CSS must not stretch aspect ratio. |
| Delivery | Local files only. This workspace is not a Git checkout; commits, native repository review, push, and PRs are N/A. |
| Eligibility | Hackathon unidentified; check official rules before expansion or submission. No eligibility assertion. |

The approximately 800–1100 authored-line forecast excludes the lockfile and build output and is advisory. Do not omit tests, minify code, or delete explanatory structure to meet a line target.

## Planned file map

All paths below are relative to the `outputs/pachabyte` project root.

| Path | Purpose |
| --- | --- |
| `package.json`, `package-lock.json` | Exact dependency versions and reproducible npm scripts/install |
| `tsconfig.json`, `vite.config.ts` | Strict TypeScript and a local-only Vite server/preview |
| `index.html`, `src/main.ts`, `src/style.css` | Browser entry, game configuration, accessible surrounding copy and fit layout |
| `src/game/rules.ts` | Pure input, jump/cooldown, and projectile-expiry decisions shared with the scene |
| `src/game/textures.ts` | Generated original placeholder textures with no external asset dependency |
| `src/game/ArcadeScene.ts` | Actual keyboard input, bodies, platforms, camera, pool, targets, HUD, and lifecycle |
| `tests/rules.test.ts` | Deterministic rule assertions; meaningful pre-implementation failures recorded |
| `tests/browser-smoke.mjs` | Real browser/canvas/input integration assertions when browser automation is available |
| `.gitignore` | Exclude dependencies, build output, logs, and local verification artifacts |
| `README.md` | Windows setup, commands, controls, limitations, and proposed next sprints |
| `docs/VERIFICATION.md` | Executed commands, observed outputs, runtime evidence and limitations |

Temporary scripts, logs, screenshots, and browser profiles belong in the parent workspace's `work/` area, not the distributable source tree. Do not bundle `node_modules` as a deliverable.

## Task 1 — Runnable shell and test harness

**Files:** `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/style.css`, `.gitignore`, `tests/rules.test.ts`.

1. Confirm Node/npm versions and the intended dependency versions from official package metadata. Pick and pin the compatible test runner; do not silently float versions.
2. Define scripts: `dev`, `typecheck`, `test`, `build`, and `preview`. Use local host `127.0.0.1`; keep browser smoke execution explicit and document any runner-specific invocation.
3. Install dependencies in the project root and retain the lockfile. Record install exit status; inspect/report meaningful warnings.
4. Create a strict TypeScript browser bootstrap and minimal game shell. Use Phaser's 320 × 180 config, Arcade Physics, pixel-art rendering, FIT scaling, and centering.
5. Introduce a runnable rules-test harness with stubbed functions returning deliberately incomplete results, then observe a real assertion failure before behavior is implemented. A missing-module or syntax error alone is not meaningful RED evidence.

**Acceptance:** The harness executes assertions; the local server can serve the shell; version/installation evidence is retained. A shell boot alone does not complete G1 or validate gameplay.

## Task 2 — Tested movement, facing, and jump

**Files:** `src/game/rules.ts`, `src/game/ArcadeScene.ts`, `src/game/textures.ts`, `src/main.ts`, `tests/rules.test.ts`.

1. Write failing assertions for neutral input, opposite-key cancellation, signed movement speed, facing retention, and grounded-only jump decisions.
2. Implement the smallest pure rules until tests are GREEN. Use pixels/second, not pixels/frame; use last-facing direction when movement stops.
3. Generate Kipu's small turquoise/gold placeholder. Create the player body, gravity, floor, a few reachable platforms, and safe world bounds.
4. Map A/D and Left/Right to the same rule input. Detect W/Space/Up on key press; evaluate grounded state from actual Arcade collision state.
5. When sizing static platform sprites, refresh their static physics bodies after resizing. Keep body dimensions consistent with the visible platform.
6. Wire movement and jump through the tested rules, then refactor with the tests still GREEN. Do not duplicate a second movement implementation for tests.

**Acceptance:** G2 and G3 work through actual keyboard input and real Arcade Physics. Automated unit tests verify decisions; browser tests or a recorded manual pass verify collision/landing integration. No double jump or jump-on-hold after landing.

## Task 3 — Bounded shooting and target feedback

**Files:** `src/game/rules.ts`, `src/game/ArcadeScene.ts`, `src/game/textures.ts`, `tests/rules.test.ts`.

1. Write failing rules tests for cooldown boundaries, initial readiness, facing-dependent shot direction, projectile expiry, and out-of-bounds cleanup.
2. Implement rules and observe GREEN. Use scene time for cooldown/expiry and consistent reset behavior.
3. Create a fixed-capacity Arcade projectile pool. On reuse, enable/reset position and activity; explicitly reset velocity, gravity and TTL. No unbounded sprite creation during firing.
4. Hold J or Z to request a shot. If cooldown or pool capacity prevents it, safely skip without creating an extra projectile.
5. Add static inert targets and overlap feedback. Disable the projectile and target immediately on hit; increment the counter once, not every overlap frame.
6. Recycle projectiles on TTL expiry, world exit, impact, or restart. Show enough visible feedback to distinguish a shot from a hit.

**Acceptance:** G4 passes: both directions work, cadence is bounded, targets cannot score repeatedly, active bullets never exceed the pool capacity, and repeated firing/restarts do not grow allocated projectiles.

## Task 4 — Practice scene, camera, and lifecycle

**Files:** `src/game/ArcadeScene.ts`, `src/game/textures.ts`, `src/style.css`, `index.html`, `tests/browser-smoke.mjs`.

1. Build a short world wider than 320 pixels. Layer pale block structures and original mountain/volcano silhouettes behind the playable platforms.
2. Follow Kipu with camera bounds matching the world. Keep HUD controls and hit count fixed using screen-space positioning.
3. Restart with R into a clean initial state: spawn, facing, velocity, targets, counter, cooldown, pool, camera and input state.
4. Clear held inputs on focus loss. Clean up scene-owned listeners/colliders as appropriate on shutdown/restart; do not accumulate handlers.
5. Expose opt-in `?debug=1` **read-only snapshots** of actual player body, camera, targets, bullet count/capacity and logical resolution for browser checks. No writable test controls or alternate motion path. Omit this telemetry on ordinary launches.
6. Add a browser smoke runner using an available Playwright installation and installed Chrome/Edge if possible. It must send actual keyboard events and inspect actual state, not fabricate physics outcomes.

**Acceptance:** G1, G5 and G6 pass in an available tested browser. Resize preserves aspect ratio/readability. Restart and blur do not retain motion or accumulate objects. If the runner/browser cannot launch, report that exact limitation and keep runtime criteria pending rather than calling them verified.

## Task 5 — Documentation and fresh verification

**Files:** `README.md`, `docs/VERIFICATION.md`; adjust the relevant source/test file only for evidenced defects within the authorized scope.

1. Write Windows/PowerShell instructions using `npm.cmd` to avoid PowerShell script-execution-policy ambiguity. Document prerequisites, exact project directory, install, dev, test, typecheck, build, preview and browser smoke commands.
2. Document controls, focus requirements, generated-art limitations, no boss/Shift/mobile/audio features, and the hackathon eligibility gate.
3. Run typecheck, rules tests and build after final source changes. Record command, exit status, useful output summary and whether the check is complete/partial/blocked.
4. Start a local preview and attempt browser integration. Verify canvas boot, movement, cancellation, facing/fire, jump/landing, impact, camera-follow, projectile bound, restart, blur and resize.
5. Let the independent verifier repeat applicable checks and inspect the runnable result. Fix only evidenced in-scope defects, then rerun affected checks. No scope expansion as a side effect of verification.
6. Complete the verification record with actual versions/results, skipped checks and reasons. The parent reads back the delivered docs and performs its bounded spot check.

**Acceptance:** G7 and G8 pass. README matches actual scripts, no installed-version claim is based only on this plan, and the final report identifies every failed/skipped/pending check. No Git commit, remote operation or hackathon submission occurs.

## Verification matrix

| Layer | Check | What it does not prove |
| --- | --- | --- |
| Pure rules | Direction cancellation/facing, speed, grounded jump, cooldown, expiry and bounds decisions | Phaser bodies, real keyboard wiring, visuals or collision integration |
| Types | Strict TypeScript check | Runtime behavior or visual correctness |
| Production | Vite build and local preview | A build alone does not prove controls work |
| Browser | Real keys, actual body/camera/pool state, canvas and console/page errors | Subjective game feel, final art quality, exhaustive hardware coverage |
| Structural | README/scripts/lockfile/docs readback | Hackathon eligibility or publication readiness |

Keyboard/browser checks must wait for observed state conditions with timeouts, not assume a frame count. Screenshots support visual evidence but do not replace state assertions. Browser tooling failure is an environment limitation, not a passing gameplay result.

## References and method

- [Superpowers repository](https://github.com/obra/superpowers)
- [Brainstorming workflow](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md)
- [Writing plans](https://github.com/obra/superpowers/blob/main/skills/writing-plans/SKILL.md)
- [Test-driven development](https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md)
- [Verification before completion](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md)
- [Vite guide and Node requirements](https://vite.dev/guide/)
- [Phaser 3.90.0 source](https://github.com/phaserjs/phaser/tree/v3.90.0)

This is a transparent adaptation of the Superpowers design → plan → test-first → verification sequence to the user's explicit instruction to proceed after writing the documents. It is not a claim of plugin installation or exact approval-gate compliance. The hackathon remains unidentified: obtain its actual official rules before expanding scope or preparing a submission.


