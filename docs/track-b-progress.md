# Track B continuation progress

Status: task 1 environment is committed and verified. B1 preparation is independently verified and committed locally as `fc3036a27a376ff4cb9f3b31141ecaf2a1139289`. Unchanged smoke passes in WebGL and Canvas after one recorded WebGL pilot-failure classification rerun. Prepared assets are not integrated. No B2 work has started.

## Authority and current scope

`docs/CONTINUATION_PLAN.md` is the source of truth for the 16 ordered tasks. Track A is frozen; this session owns all remaining development in the Track B worktree on `feat/track-b-ui-map`. Current baseline: `cd80afae86d436f24dddd877150f095f26117ad3`.

The user authorized ordered dependency recovery, recording observed outcomes here, then B1. This bounded recovery task made no gameplay, asset, lockfile or configuration changes. Later work remains task-by-task with tests and documentation, local Conventional Commits and no AI attribution. Push, main-folder changes, merge to main, deployment and other remote destinations require separate current-session authorization.

The old parallel split, forbidden gameplay/README/smoke surfaces, deferred Ajustes, and handoff-to-Track-A delivery rules are superseded by the continuation plan. Its detailed B3 smoke scope still applies to that task; later pilot/Pulso tasks authorize their own changes. This tracker remains the recovery locator. No `odd/tasks/*` file was changed during environment recovery.

## Ordered tasks and observed progress

| # | Task | State / next evidence |
|---|---|---|
| 1 | Branch synchronization and private dependencies | Verified: refs equal, private dependencies and npm ls/typecheck; TEMP/TMP-prefixed full unit run passes 33 files/347 tests. WebGL smoke independently unavailable at browser launch |
| 2 | B1: prepare six sources, integration notes, statuses and credits | Complete: `fc3036a27a376ff4cb9f3b31141ecaf2a1139289`; self-tests, typecheck, 33 files/347 tests, build; WebGL W2 and Canvas C1 pass 22 groups each. W1 pilot failure retained |
| 3 | B2: map selection, pure rules, font-safe text and six nodes | Complete locally (see B2 section); unit 368/368, smoke W1+W2 WebGL and C1 Canvas green; restored-node look not yet seen in game |
| 4 | B3: page logo/background/theme and Ajustes | Complete locally (see B3 section); page check 14/14, smoke W2+W3 WebGL and C2 Canvas green after recorded flakes |
| 5 | B4: SHOTS integration | Pending; preserve invisible 6x3 bodies, speed, Nokia twins and reduced-motion frame |
| 6 | B5: LOOP_NODE_EYE integration | Pending; preserve node HP, location, bob and hitbox |
| 7 | P3: Pulso de la Trama | Pending; record Spanish design decision first, then pure-rule tests and gameplay/UI/sound/smoke |
| 8 | B6: neon route backdrop and readable accents | Pending; gameplay integration now belongs to this session |
| 9 | UX fixes including shield/ENERGIA overlap | Pending |
| 10 | Optional larger Corruptor | Pending user visual sign-off; unchanged hitbox |
| 11 | Smoke pilot stabilization | Pending; preserve assertions and report every run |
| 12 | README, credits, verification, asset and phase statuses | Pending |
| 13 | Final QA | Pending: typecheck, tests, build, WebGL x2, Canvas x2 and captures at 1000/600/470 px |
| 14 | Deploy v1.0 | Pending explicit user authorization; no main/remote operation performed |
| 15 | Backup hosting | Pending user account/destination authorization |
| 16 | Delivery package | Pending user submission-format decision |

Task 1 was committed by the parent as `9d7452401807731caaa3ed35b3e92ea39e5d8727` (`docs: record isolated Track B verification environment`). Its environment acceptance is verified by the TEMP/TMP recovery recorded below. B1 now starts under bounded delegated authorization: prepare six assets and document them, without integration, dependency installation/deletion or a writer-owned commit. Preserve originals under `assets/incoming/`; preparation outputs belong under `assets/prepared/`.

## B1 preparation evidence (2026-10-14)

Route: delegated direct, because source inspection, tool changes, preparation, documentation and command execution form a bounded multi-file work unit. Allowed source changes are `tools/prepare_sprite.py`, prepared B1 outputs, integration notes, asset status, credits and this tracker only. No dependency install/delete/copy, canonical/main access, gameplay/page/test changes, review lifecycle or commit was performed by the resumed B1 writer. RDD is OFF per parent evidence; ordinary checks apply.

### Outputs and rationale

All six received sources were inspected and measured: map/page/neon 1672x941 RGB; logo 2172x724 RGBA; eye 1659x948 RGBA; shots 1448x1086 RGBA. Before/after source SHA256 identities and output metadata are in `docs/review/b1-review-manifest.json`; all six source hashes match the initial read.

| Output (under `assets/prepared/`) | Dimensions / bytes | Choice |
|---|---|---|
| `map-trama-v1-320x180.png` | 320x180 / 140774 | Provisional game-native map; six sockets readable |
| `map-trama-v1-640x360.png` | 640x360 / 515676 | Higher-detail comparison; final game fit deferred |
| `logo-pachabyte-v1-320x107.png` | 320x107 / 32114 | Full word/chullo, binary alpha, no crop |
| `page-bg-v1-320x180.png` | 320x180 / 116819 | Native comparison |
| `page-bg-v1-640x360.webp` | 640x360 / 359124 | Selected page background: richer side detail, lossless compression below approximately 600 KB |
| `bg-route-neon-v1-320x180.png` | 320x180 / 112050 | Full composition; genuine magenta preserved |
| `loop-node-eye-v1-40x56.png` | 280x56 / 4815 | Seven padded 40x56 frames: idle 0-3, hit 4, crack 5, shatter 6 |
| `shots-v1-normal-16x12.png` | 64x12 / 245 | Four normal frames |
| `shots-v1-rafaga-24x20.png` | 96x20 / 541 | Four Ráfaga frames |
| `shots-v1-impact-16x16.png` | 64x16 / 375 | Four impact frames |

Four corresponding sprite JSON files record measured source boxes, cell bounds, order, center anchor and sampling scale, with no invented duration. Ten `docs/review/b1-review-*-zoom.png` files record nearest-enlarged inspection pairs over a dark backdrop. New `docs/design/INTEGRATION_NOTES.md` contains exact final reproduction commands and integration caveats. Asset request statuses say prepared, not integrated; credits preserve user-art provenance and all-rights-reserved licensing pending a user decision.

### Observed RED, GREEN and candidate evaluations

- `python -I tools/prepare_sprite.py --self-test`: RED exit 1 after adding opaque tests, `opaque resize: opaque_prepare is not implemented`; GREEN after implementing no-key/no-crop nearest RGB resizing, source preservation and invalid-size/alpha rejection.
- Same self-test: a second focused RED exit 1, `explicit pitch: auto_prepare does not support a measured grid`; GREEN after adding optional finite positive `--pitch` without changing default estimation. The original uneven-sheet/halo/particle exact round-trip still passes (three 8x16 cells). Final self-test passed again after all tool edits.
- Final asset commands in integration notes all exited 0. Grid logo reports expected non-integer sampling; original width/height ratio is retained approximately rather than forcing 160x40.
- Eye automatic estimate 36.61 source px at alignment 0.08 produced unreadable 5-7px shapes. Explicit inspected pitch 8 preserves identity; it is not a claimed exact grid. 32x48 evaluation touched the top/bottom of the shatter cell, so final 40x56 cells add padding. All final sprite bounds are strictly inside their cells and report `cropped: false`.
- Shots measured three rows of four sprites. Initial normal 24x16/28x16 and impact 24x24 evaluations touched cell edges; final normal/impact factor-2 reductions preserve readable silhouettes and padding. Ráfaga 24x20 uses the existing automatic factor 2. Unselected candidates were removed by exact filenames only.
- Page 960x540 lossless WebP evaluation was 728960 bytes, over target; removed after selecting 640x360. All retained outputs were inspected natively and at 2x/4x zoom with `view_image`. One zoom read occurred before the metadata-generation command finished and found no file; the completed zoom was then successfully inspected. These are asset-only observations, not in-game approval.

### Functional verification

Python alias resolves to `C:\Users\dark_\AppData\Local\Programs\Python\Python311\python.exe`; used `-I`. Source/output hash and binary-alpha audit passed for all ten retained image outputs. Metadata audit reran the same `auto_prepare` parameters and verified pixel identity, seven/four/four/four frames, no crops and padded bounds.

Every npm/preview/smoke invocation uses this same-shell prefix from Track B, with `login:false`:

```powershell
$env:TEMP="$PWD\node_modules\.tmp"; $env:TMP=$env:TEMP; New-Item -ItemType Directory -Force $env:TEMP | Out-Null
```

`npm.cmd run typecheck`: exit 0. `npm.cmd test`: exit 0, 33 files/347 tests passed. `npm.cmd run build`: exit 0, 61 modules transformed; existing large-chunk warning and npm minimum-release-age warning are nonfatal. No mutating normalizer was required; all tool/asset mutation preceded these checks. `git diff --check` passed.

### Browser attempts (all assertions unchanged)

Screenshot status was clean before launch. Sandbox own preview session 28480 started on `npx.cmd vite preview --host 127.0.0.1 --port 4190 --strictPort`. Scoped elevated unchanged smoke command:

```powershell
$env:TEMP="$PWD\node_modules\.tmp"; $env:TMP=$env:TEMP; New-Item -ItemType Directory -Force $env:TEMP | Out-Null; $env:PACHA_URL='http://127.0.0.1:4190'; $env:PACHA_RENDERER='webgl'; node tests/browser-smoke.mjs
```

Attempt E1: approved elevated Edge launch, exit 1, zero groups; `page.goto: net::ERR_CONNECTION_TIMED_OUT` to owned localhost preview. Not a gameplay verdict. Sandbox preview 28480 was explicitly terminated (exit 1), then parent authorized a scoped native permission request for the identical elevated owned preview, not firewall/settings changes. Approved elevated preview session 84227 started successfully on 4190.

WebGL W1 against elevated preview: exit 1 after three passed groups, no page errors. Route pilot lost attempts at 75233/73221 ms from bug/Firewall/Marea/Packet Loss/ember damage, ending in defeat; `the route must end in the guardian arena` failed. No B1 asset is wired into this unchanged game.

WebGL W2 was the required second run and the single bounded classification rerun: **exit 0, 22 groups passed**, no page/console errors; route reached the guardian with four hearts and the fight won. This establishes the W1 route-pilot failure was non-reproducible on the one rerun, not that both WebGL runs were green or that pilot instability is fixed.

Canvas C1 used the identical approved elevated command with `$env:PACHA_RENDERER='canvas'`: **exit 0, 22 groups passed**, no page/console errors, route/fight victory. All three renderer runs were serial and unmodified. Both passing runs verified the exact four-green REVERSE frame. The smoke emits a nonfatal Pillow `getdata` deprecation warning; no assertion was weakened and no script was edited.

Approved commands were scoped to the exact own preview/browser work; no approval/settings, firewall, installation or protected-server change occurred. Only own elevated preview session 84227 was stopped after all runs (exit 1 on Ctrl+C), just as only own sandbox session 28480 was stopped earlier. No servers are intentionally left running by B1.

Retained and inspected through `view_image`: `docs/review/b1-review-webgl-map.png`, `docs/review/b1-review-webgl-bolts.png`, `docs/review/b1-review-webgl-loop.png` and corresponding `docs/review/b1-review-canvas-*.png`. These show unchanged procedural map/bolt/eye gameplay, not new-asset integration. Smoke-generated tracked screenshots were restored only after inspection, with an exact `git restore --source=HEAD --worktree --` list: `docs/ruta01-bolts.png`, `ruta01-bugs.png`, `ruta01-eruption.png`, `ruta01-eye.png`, `ruta01-freed.png`, `ruta01-liberation.png`, `ruta01-loop.png`, `ruta01-map.png`, `ruta01-memoryleak.png`, `ruta01-nokia.png`, `ruta01-packetloss.png`, `ruta01-pickups.png`, `ruta01-route.png` (all under `docs/`). The first sandbox restore failed at the shared Git worktree `index.lock` with permission denied; the identical exact-path restore was then explicitly approved through native escalation and exited 0. Their final Git status is clean. No preexisting screenshot changes existed, no blanket restore was used, and no screenshots under `docs/` belong in the B1 commit.

Final forbidden-surface readback is empty for `assets/incoming`, `src`, `tests`, `index.html`, package/lock, README and `odd/tasks`. No B1 gameplay integration, responsive new-page acceptance, human art approval or two-successful-run WebGL proof is claimed; final QA remains its own later task.

### Requests for next integrations

- B2/B3: validate map markers, logo and calm page surround at actual native viewport sizes; the asset review does not establish scene fit or responsive acceptance.
- B4/B5: use measured per-sheet grids and frame order, retain current animation timing/reduced-motion frame 0, physics geometry and four-green twins. Eye's larger padded cell and non-anatomical center anchor require scene alignment review, not collider changes.
- B6: verify the brighter magenta backdrop against player, bolts and HUD; preserve ambient layers and reduced motion. Skyline matching to the current arena is not proven.
- Human art license and visual acceptance remain pending. No missing-source regeneration request is needed for B1.

### Independent verification and parent readback

Independent verifier passed the preparation scope: self-test, typecheck, 33 files/347 tests and diff whitespace checks. All six original files are byte-identical to task-1 baseline `9d74524`; all ten prepared outputs match hashes, dimensions, byte counts and alpha bounds; four sprite metadata sets match actual cells. Map and eye native outputs plus original eye were independently inspected. No required correction was found. Native read-only risk assessment was high/unassessable because new files lacked an explicit declaration; this did not lower the verification tier. RDD is globally OFF, so no native review lifecycle was started; independent ordinary verification was used instead.

Parent reran Python self-tests, typecheck and the complete TEMP/TMP-prefixed unit suite: all exit 0, 33 files/347 tests. Parent also inspected the seven-frame eye sheet. An earlier parent tracker patch found no matching stale status line and made no changes; current status already reflected the writer's updated outcome. All browser failure records remain intact. One WebGL and one Canvas passing run do not establish final QA's two passing runs per renderer.

Commit boundary: parent-owned B1 work-unit commit after independent verification. Rollback consists only of the B1 tool extension, prepared outputs and associated docs/status/credits; no gameplay/UI behavior changed. Do not start B2 automatically.

### B1 commit and next task

Local commit: `fc3036a27a376ff4cb9f3b31141ecaf2a1139289`, `feat(assets): prepare the six received art sources for integration`. It contains 36 files, including generated images/metadata/review captures, the tested tool extension and corresponding docs/credits. No push, merge or deployment occurred. The working tree was clean immediately after committing; this post-commit hash/status record is the only subsequent documentation change and will be included with the next task's commit, avoiding a self-referential commit hash.

### Review evidence relocation

After the B1 review, the 17 `b1-review-*` files (captures, zooms and the manifest) moved from `assets/prepared/` to `docs/review/`; `assets/prepared/` now holds only art the game loads or will load. Paths in `docs/design/INTEGRATION_NOTES.md` and in this tracker were corrected. The manifest stores bare zoom file names, so it needs no edit.

## B2 map screen (2026-10-14)

Route: delegated writer (4 new files plus a scene rewrite), parent verification. New `src/game/mapRules.ts` (six nodes, status per progress, wrap-around A/D/arrow selection, card keys), `src/game/mapText.ts` (uppercase Spanish, font-drawable, fits 312 px) and rewritten `src/game/MapScene.ts` (prepared `map-trama-v1-320x180.png`, top title strip, one selected-node card, one key bar, Graphics markers so Canvas needs no tint). Locked routes are RUTA 02 to RUTA 06 with an EN CONSTRUCCIÓN card and PRÓXIMAMENTE; no real-city lore. Reduced motion: no flicker, pulse or bobbing.

Socket centers measured on 12x crops of the 320x180 art: RUTA 02 (70,34), RUTA 03 (84,74), Arequipa (161,128), RUTA 04 (191,87), RUTA 05 (246,43), RUTA 06 (251,126). Selection order is left to right. Held keys do not skip nodes (auto-repeat ignored). The debug contract keeps `scene`, `audio`, `progress`, `node`, `otherRoutesLocked` and `selected` (`'route'` on Arequipa, `'locked'` otherwise) and adds `selectedNode`, `nodes`, `reducedMotion`. `TEXT.map*` entries in `text.ts` are now unused and were left untouched.

Evidence observed in this checkout (TEMP/TMP prefix): RED `vitest run tests/mapRules.test.ts tests/mapText.test.ts` failed with `Cannot find module '../src/game/mapText'` in both files; GREEN 2 files / 21 tests. Baseline before B2: typecheck exit 0, 33 files / 347 tests. After B2 (parent rerun): typecheck exit 0, 35 files / 368 tests, build exit 0 (large-chunk warning only). Browser: own preview on 4190 (stopped afterwards), unmodified smoke W1 WebGL exit 0, W2 WebGL exit 0, C1 Canvas exit 0, 22 groups each, no page errors. All three runs green, so no flake classification was needed.

Screenshots reviewed (scratchpad, not committed): Arequipa selected and RUTA 04 selected in WebGL and Canvas, plus a 3x magnified comparison of selected/unselected markers. Title, card and key bar are readable over the art; selection brackets are gold corners and legible but subtle. Reduced-motion Canvas run confirmed `reducedMotion: true` and the selection and locked-Enter behavior. Not yet seen: the restored Arequipa node (pulse) in game, because no debug hook sets `progress.guardian`; it is covered by unit tests only. Smoke-rewritten `docs/ruta01-*.png` were restored with an exact-path `git restore` and not committed.

## B2 follow-up and B3 page UI (2026-10-14)

**B2 follow-up** (`e6b3eb6`): pointer-down taps on the map (`nodeAt`/`tapOutcome` in `mapRules.ts`: the first tap selects, a tap on the selected playable node acts), 2 px selection brackets, unused `TEXT.map*` keys removed. RED: 4 failing tests (`nodeAt is not a function`); GREEN 372 tests.

**B3** (delegated writer, parent-verified): `index.html` logo `<h1><img alt="PachaByte">`; night background from `page-bg-v1-640x360.webp` (Vite bundles it with relative URLs); themed stepped-corner buttons (turquoise, magenta, orange, gold, violet for Ajustes; the neon edge and face are `::before`/`::after` layers so the `outline` focus ring is not clipped); native `<details id="settings"><summary>Ajustes</summary>` holding `#sound` and `#motion` (ids, texts and `aria-pressed` unchanged); 44 px targets; named transitions only; reduced motion honored. New `tests/page-ui-check.mjs` (14 assertions; run with `PACHA_URL=http://127.0.0.1:4190 node tests/page-ui-check.mjs`).

Problems the parent found and fixed: (1) the writer's panel made the column 916 px wide, so the canvas was 916x515.25 and its last row blended the page color into the REVERSE frame (smoke: `unexpected REVERSE colors`); the column is back to 960 px and the dark panel is a `main::before` layer that never changes layout (canvas 960x540 at a 1000 px viewport). (2) `getByRole` skips the hidden buttons of a closed disclosure, so a third `openSettings()` hunk was needed before the OS-preference `getAttribute`. (3) Real bug: Phaser caches the canvas bounds, so opening Ajustes moved the canvas and a tap landed on the wrong game pixel (the first canvas click started the route). RED assertion `l)` in `page-ui-check.mjs` failed (`scene: route`); the fix in `main.ts` calls `game.scale.updateBounds()` on the details `toggle` and on page scroll; GREEN.

Smoke hunks in `tests/browser-smoke.mjs`: `openSettings` helper after the `button` helper (~line 75); the map visibility list split so only the two settings buttons are checked after `await openSettings()` (~135); `openSettings()` before the first Sonido click (~1084), before the OS-preference assertion (~1117) and before the first Reducir movimiento click (~1139). No other line changed.

Observed: typecheck exit 0, 35 files / 372 tests, build exit 0, page check PASS 14/14. Smoke on own preview 4190, unmodified apart from the hunks: W1 exit 1 (`touching a solid Packet Loss block must cost a heart`, known pilot flake), W2 exit 0, W3 exit 0, C1 exit 1 (`a Packet Loss hit only while touching a solid block`, known pilot flake), C2 exit 0. Runs that failed because of B3 itself (Nokia stray row; hidden-button lookup) were fixed before these. Screenshots reviewed at 1000x800 and 470x800 (closed, Ajustes open, focused): logo, buttons and panel read well; the background art is mostly covered by the panel at 1000 px and shows at wider windows. Honest verdict: good, not epic; a larger logo or decorative frame would need new art. Smoke screenshots under `docs/` were restored with an exact-path `git restore`.

Next source task: B4 (SHOTS).
## Ordered test-environment diagnosis (2026-10-14)

Status: diagnostic complete, full baseline blocked; no B1 edits. All commands explicitly use Track B and non-login PowerShell; no source/configuration changes or canonical inspection.

### Step 0: guards

Branch `feat/track-b-ui-map`, HEAD `cd80afa`; `node_modules` is an ordinary Directory with empty LinkType/Target. Read current tracker, package.json and vite.config.ts. `npm test` means `vitest run`; config has only base/server/preview settings.

### Step 1: first current complete error

`npm.cmd test`: exit 1; 24 failed files, 9 passed files (33), 68 executed tests passed. This differs from the previous run's 25 failed/8 passed/47 tests; no full baseline pass. Tool receipt `52d9c6` retains the full run. First failure block verbatim:

```text
 FAIL  tests/amaruRules.test.ts [ tests/amaruRules.test.ts ]
 FAIL  tests/balanceRules.test.ts [ tests/balanceRules.test.ts ]
Error: ENOENT: no such file or directory, open 'C:\Users\dark_\AppData\Local\Packages\sandbox.{75affc6b-1d27-4082-9dc1-22b3897f2ad1}\AC\Temp\B4lSQ3kId-_jkgmZkQPAw\ssr\3efcd5bf2ea2759090dd077f05535484c024269d'
 ❯ src/game/routeRules.ts:1:1
      1| import { GAME, clamp } from './rules';
       | ^
      2| import { TEXT } from './text';
      3| import { comboPoints } from './comboRules';
 ❯ src/game/balanceRules.ts:1:1
```

No additional stack was emitted for this first block. The failure references sandbox SSR temporary output, not vite.config.ts.timestamp-*.mjs. No proven cause or antivirus evidence.

### Step 2: private cache probe

Verified root/existing target ordinary and literal contained. Created .vite-temp/probe.txt containing x, read x, deleted only probe; exit 0. This proves that cache location writable, not sandbox SSR temp availability. No escalation needed.

### Step 3: private cache cleanup

Verified literal root and both cache targets contained under ordinary private node_modules; no reparse/link roots or descendants. Removed only .vite and .vite-temp (existing targets) with native literal PowerShell Remove-Item. Exit 0; first error preserved before cleanup. Baseline rerun follows.

Step 3 baseline rerun: `npm.cmd test` exit 1; 25 failed files, 8 passed files (33), 68 executed tests passed. Full receipt `1205e3`. First error:

```text
 FAIL  tests/amaruRules.test.ts [ tests/amaruRules.test.ts ]
Error: ENOENT: no such file or directory, open 'C:\Users\dark_\AppData\Local\Packages\sandbox.{9e652012-8820-4ed2-b8cb-b343aafb10a9}\AC\Temp\hMEpPJDZfh9I6jZWuOFv5\ssr\eeb1d38156c57c53632f7c1bbf873f165f5b80d0'
 ❯ src/game/balanceRules.ts:1:1
      1| import { ROUTE } from './routeRules';
       | ^
      2|
      3| // Balance round 2 (playtest 2026-10-13). The first live playtest foun…
 ❯ src/game/amaruRules.ts:1:1
```

Cleanup did not restore baseline. All failing suites still reported missing sandbox SSR output during import.

### Step 4: isolated and serialized comparisons

Executed strictly sequentially; waited for completion before the next command.

| Command | Observed result | Receipt |
|---|---|---|
| `npx.cmd vitest run tests/rules.test.ts` | Exit 0: 1 file, 21 tests passed | `6682fb` |
| `npx.cmd vitest run --no-file-parallelism` | Exit 1: 26 failed files, 7 passed files (33); 61 executed tests passed | `595e94`, completion `a0b803` |

First serialized failure verbatim:

```text
 FAIL  tests/ambientRules.test.ts [ tests/ambientRules.test.ts ]
Error: ENOENT: no such file or directory, open 'C:\Users\dark_\AppData\Local\Packages\sandbox.{2985f2ed-5fca-454f-9fae-4c905cc75032}\AC\Temp\vU4T0JmjkwLb5NBcoaDaM\ssr\3efcd5bf2ea2759090dd077f05535484c024269d'
 ❯ src/game/ambientRules.ts:1:1
      1| import { GAME } from './rules';
       | ^
      2| import { SEGMENTS, type SegmentName } from './routeRules';
      3|
 ❯ tests/ambientRules.test.ts:2:1
```

The isolated rules suite passes, but the same suite fails at import in the serialized full run. Disabling file parallelism did not restore the full baseline; neither this contrast nor changing counts proves a race or sandbox root cause.

### Step 5: configLoader conditional

NOT APPLICABLE: observed missing files are sandbox `ssr` module outputs, not `vite.config.ts.timestamp-*.mjs`. Did not run help/configLoader/native workaround. No antivirus/quarantine evidence was inspected or claimed. No explicit access-denied failure occurred in cache probe or runs, so no escalation or permissions/settings change was performed.

### Step 6: terminal baseline state

Baseline remains blocked: neither exact `npm.cmd test` run passed all 33 files/347 tests. Only the isolated 1-file/21-test command passed. Stop before B1; parent owns the next user decision. No speculative retry, installer, TEMP/config workaround, source/test/assertion edits, build/smoke/server, canonical operation, commit or review lifecycle was performed. Main's 347-test health remains user-reported only. Modified this tracker and permitted private runtime caches only; old incident history preserved.

## Track B temporary-directory recovery (2026-10-14)

At `feat/track-b-ui-map`, baseline `cd80afa`, relocating TEMP/TMP to the verified real private dependency directory eliminated the previously observed sandbox SSR missing-file error: **33 test files and 347 tests passed**, exit 0. This is evidence for the local temporary-path solution, not proof of AppContainer internals, cross-process incoherence or antivirus behavior. The user's report that Track A already passed 347 tests is separate user evidence; this task did not inspect canonical/main.

Run the prefix and command in the **same non-login PowerShell invocation**, from the Track B root:

```powershell
$env:TEMP = "$PWD\node_modules\.tmp"; $env:TMP = $env:TEMP; New-Item -ItemType Directory -Force $env:TEMP | Out-Null; npm.cmd test
```

Observed Node `os.tmpdir()` inheritance:
`C:\Users\dark_\Documents\hack-the-andes-game-worktrees\track-b\node_modules\.tmp`.
No elevated test retry was needed. Do not replace this with a separate shell invocation or permanently change system/environment configuration.

Build passed with the same prefix (`npm.cmd run build`, including typecheck). The large-chunk warning remained nonfatal. Exact preview and one-shot WebGL smoke commands, each with its own prefix:

```powershell
$env:TEMP = "$PWD\node_modules\.tmp"; $env:TMP = $env:TEMP; New-Item -ItemType Directory -Force $env:TEMP | Out-Null; npx.cmd vite preview --host 127.0.0.1 --port 4190 --strictPort
$env:TEMP = "$PWD\node_modules\.tmp"; $env:TMP = $env:TEMP; New-Item -ItemType Directory -Force $env:TEMP | Out-Null; $env:PACHA_URL='http://127.0.0.1:4190'; $env:PACHA_RENDERER='webgl'; npm.cmd run test:browser
```

Preview started on the owned 4190 port. Smoke exited 1 at **browser launch**, `failed_or_unavailable`, with zero passed groups: `browserType.launch: Target page, context or browser has been closed`. Edge logged `TransactNamedPipe: Ha terminado la canalización. (0x6D)`; Playwright's own cleanup logged a taskkill username/password error and then process exit. Root cause and permission remedy remain unproven. No browser retry/escalation or settings change was authorized/performed; a new smoke attempt needs permission. Canvas was not run. No screenshot was produced or visually examined, and screenshot Git status was clean before and after, so no restoration was needed. Only the owned preview exec session was interrupted and terminated (exit 1); no other server/process was touched.

Unit/build baseline is now verified for this checkout. Renderer smoke and visual acceptance remain unavailable/pending; B1 work still has not started and belongs to parent coordination.
Verification receipts: unit start d86672/completion74914d; build028126/e1df13; preview d7fc84 own session17113 terminated6195f5; smoke476944/completion724f2e; clean screenshot status8b51fa. Private .tmp was verified contained under non-link node_modules before creation. No cleanup/install/source/config/lock/main changes, commit or review lifecycle. Task 1 branch sync/private dependencies/full-unit baseline is verified; browser smoke is independently blocked at launch. Parent must mirror tracker and spot-check before B1.
