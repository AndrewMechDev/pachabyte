# Track B continuation progress

## Current worktree scope — S2 / Checkpoint 2 (2026-10-14)

Current baseline is `759461a` on `feat/track-b-ui-map` in the Track B worktree. B1–B5 are already integrated. The PRINCIPAL (Claude) owns release documentation, main merges and deployment; this worktree owns authorized game code/tests. No main access, synchronization, installs, release-file edits or remote operations are part of these bounded Checkpoint 2 units.

Task 0 is verified and committed locally as `9e33b9a1c190f396d46f00677a3c5d3862082901`. Parent reran typecheck and all 35 files/394 tests, inspected the WebGL eye, and applied the medium ordinary verification tier with RDD OFF. Precommit cached whitespace caught an extra EOF blank line in the feature document; parent removed that blank line only before the commit. S1 parent delivery is recorded below; S2 is the current bounded writer unit, stopping before S3. Feature/recovery locator: `odd/tasks/checkpoint-2-story-sharing.md`. Canvas eye capture remains pending Checkpoint 2 after the one bounded pilot attempt lost; no Task 0 retry is needed.

### S1 parent delivery / S2 start

S1 is committed as `2dd0b629960ac8c13c9ac1470663919c1ef10c35`. Parent repeated typecheck/37 files/405 tests and inspected card 2 Canvas; native read-only risk was medium, 473 authored lines, with global RDD OFF and ordinary verification. Initial staging was rejected against an obsolete smoke veto; parent re-read current 9.3/10.1 authorization and the exact helper/one-group diff, then scoped retry was approved. This was an authorization reconciliation, not a code failure. These facts and the S1 hash are recorded BEFORE S2 source writes. S2 only is now authorized; no S3 work.

### S2 acceptance, schedule and invariants

S2 writer verification is complete; parent assessment/spot-check/commit remains pending. Delegated direct: pure schedule/queue/text, small route integration and deterministic/browser proof form one behavior. No S3 work started. The S1 commit/ordinary tier and obsolete staging-veto reconciliation were recorded above and in the feature document BEFORE S2 source edits.

The four compatible suggested intents retain exact wording and existing lore. Duration is 2800 ms each, derived from unchanged `SEGMENTS` and newly exported read-only `CAPTIONS`:

| Segment / text | Instruction window | Narrative window (world ms) |
|---|---|---|
| firstBug — `LOS ERRORES DE LA TRAMA TE BUSCAN.` | Arrival hints end at 8000 | 8000–10800 |
| packetLoss — `LOS DATOS SE PIERDEN Y VUELVEN.` | 37000–40500 | 40500–43300 |
| eruption — `EL MISTI TAMBIÉN SIENTE EL DESFASE.` | 46000–49500 | 49500–52300 |
| memoryLeak — `LA ENERGÍA SE ESCAPA DE LA TRAMA.` | 64000–67500 | 67500–70300 |

Arrival lore is omitted because instruction captions occupy its complete 0–8000 ms segment. Bucle lore is omitted because dynamic `BUCLE ROTO` can interrupt a slot, making an uninterrupted 2.5–3 s line unsafe to promise. At-most-six is a ceiling, not a target; this four-line subset changes no hints/cues or canon. Packet/Misti/Leak lines queue from their segment boundary until the earliest complete hint-free interval, never carry into the next segment. Threshold's full instructional segment similarly has no free slot (tested).

`narrativeRules.ts` is pure: schedule reserves non-overlapping full intervals; consumed cursor drops expired/blocked lines, never replays on a lower clock, and fresh `initialNarrative()` resets each Route create. Runtime steps only in the existing active world-clock path; no new timers, physics, HP, enemies, route duration, loop/reset mechanics or reduced-motion animation were introduced. Static narrative uses the existing caption strip (same bitmap atlas/colors/position), below HUD. Existing instructional text has absolute rendering priority, including a defensive future dynamic-cue interruption; an interrupted line is consumed, not resurrected. All four selected current windows avoid dynamic loop cues entirely.

### S2 observed checks and visual proof

Commands use explicit Track B cwd, `login:false` and the same-invocation private TEMP/TMP prefix recorded below. No source normalizer needed; source bytes were final before functional checks. All original route test assertions remain unchanged; no S1/T0 source edits or long-smoke edits occurred.

| Command / phase | Observed result |
|---|---|
| `npx.cmd vitest run tests/narrativeRules.test.ts tests/narrativeText.test.ts tests/routeRules.test.ts` RED | Exit 1, receipt de0006: two missing-module suites and one CAPTIONS-export assertion failed; original 32 route tests passed. Missing-module RED is not described as a separately observed scheduling failure. |
| Same focused command GREEN | Exit 0, a96b08: 3 files / 45 tests (9 queue/schedule, 3 text, 33 route); guarded typecheck also passed |
| `npx.cmd tsc --noEmit` | Passed before full tests, guarded command continued |
| `npm.cmd test` | 39 files / 418 tests passed, df364f (S1 405 + 13) |
| `npm.cmd run build` | Exit 0, 778c4d / session 81156: 74 modules; existing nonfatal chunk/npm-config warnings |
| `node tests/narrative-flow-check.mjs`, `PACHA_URL=http://127.0.0.1:4190` | Exit 0, 18745e / session 31266: WebGL + Canvas serially, one attempt each; arrival priority, first story, HUD separation, real movement/world-clock continuity, pause/focus freeze, exclusive expiration and restart cursor reset passed. Canvas used OS reduced motion. |
| Full browser smoke / later narrative route captures | Deferred CP2 after S4; no route pilot, long smoke or additional capture attempt in S2 |
| `git diff --check` | Exit 0 after final tracking writes; line-ending warnings only |

Scoped elevated own preview and focused Edge command were approved using native permissions due already observed sandbox limitations. Exact server `npx.cmd vite preview --host 127.0.0.1 --port 4190 --strictPort` ran with private TEMP prefix, session 32826. Browser closed in `finally`; only preview 32826 stopped with Ctrl+C, observed exit 1 (4022c6). No protected listener/process, settings, firewall, software install or global review mode changed. No tracked `docs/ruta01-*.png` was generated; no restoration necessary.

Four new 960x540 captures (native 320x180 logical canvas at 3x) were inspected with `view_image` original detail: `docs/design/checkpoint-2-captures/s2-instruction-webgl.png`, `s2-story-webgl.png`, `s2-instruction-canvas.png`, `s2-story-canvas.png`. Existing arrival hint is unchanged; story is fully readable in its centered strip below the unoccluded hearts/energy/score HUD, with flight canvas unobstructed except the existing narrow caption area. Later three schedule windows have deterministic proof, not claimed screenshot proof. Principal human fit/checkpoint review remains separate.

Rollback boundary is the two narrative modules, CAPTIONS export, minimal Route reset/step/debug additions, narrative tests/harness and S2 tracking/captures only. Requests for PRINCIPAL: checkpoint/release summary should report four compatible ambient lines, preserved instructional priority, and remaining CP2 later-caption/full-smoke/human acceptance. Parent owns full task mirror and commit; next source unit is S3 only after parent verification. No principal release file or forbidden surface was edited.

### S1 acceptance and implementation

S1 writer verification below is historical; parent delivery is recorded above. Route is delegated direct because scene/rules/text, map/page entry, view state and browser helpers form one coherent multi-file behavior. No S2 work was started. T0's parent-owned commit and precommit EOF cleanup were recorded above and in the feature document BEFORE S1 source edits.

- `IntroScene.ts` renders the four EXACT approved Spanish cards over the existing dimmed arena with native-size Kipu. `introText.ts` wraps at 288 logical pixels (48 six-pixel glyphs), preserving words and accents; card 2 fits two lines with padding.
- Pure `introRules.ts` owns four cards, 3000 ms/card, 30 ms/character, advance/skip and once-entry routing. The scene advances only its own active clock: focus loss freezes typing/auto-advance, and the first resumed delta is discarded instead of catching up. Reduced motion displays the whole card immediately. One blip is requested per presented card; muted settings still win.
- `MapScene.ts` and the native page route button choose the intro on first map-to-route entry only. The registry flag is set in intro `create`, not on a routing request. Direct key 2 still enters Amaru and leaves the flag false. Subsequent map route entries bypass the intro; no HP, score, route clocks, settings or achievement meanings change.
- Entry-event deduplication, held-key seeding and repeat rejection prevent the map/native Enter event from advancing the first card or cascading. Manual final advance/Esc waits for its key release before Route starts, so Esc cannot pause Route and Space cannot fire through the transition. Keyboard, native keyup/focus/visibility and page-focus listeners are removed on shutdown. There are no intro timer events to leak.
- `viewState.ts` gains a coherent intro view/copy. Main hides retry during intro and retains the route button's pressed meaning. Read-only intro debug adds timing/card/text/focus/session fields without removing existing scene fields. `debug.ts` needed no edit.
- Deterministic tests cover timing boundaries, a delayed frame, paused actions, terminal state, once routing, reduced motion, exact text, glyph coverage and native wrapping. The long smoke changes ONLY route entry handling plus one once/skippable group; unrelated pilot/assertion logic is unchanged.

### S1 exact checks and observed outcomes

All commands use the explicit Track B root, `login:false`, and the same-invocation private TEMP/TMP prefix documented below. Source changes preceded final functional checks; no mutating normalizer was needed.

| Command / phase | Observed result |
|---|---|
| `npx.cmd vitest run tests/introRules.test.ts tests/introText.test.ts tests/viewState.test.ts` RED | Exit 1: two suites failed because intro modules did not exist; two view-state assertions failed, three passed. Timing/text tests were written first; no separate timing failure is claimed. |
| Same focused command GREEN | Exit 0: three files / 15 tests |
| `npx.cmd tsc --noEmit` | Passed; guarded invocation continued to full tests |
| `npm.cmd test` | Exit 0: 37 files / 405 tests (T0 394 + 11) |
| `npm.cmd run build` | Exit 0: 72 modules; existing nonfatal chunk/npm-config warnings |
| `node tests/intro-flow-check.mjs` with `PACHA_URL=http://127.0.0.1:4190` | Exit 0: one serial WebGL + Canvas sequence, real keyboard/read-only debug. Key 2 bypass, typing, repeat/held entry, focus pause/resume, Esc release, once flag, native page entry, all four automatic cards/blips and reduced motion passed. |
| `node tests/page-ui-check.mjs` with same URL | Exit 0: 17/17; original 16 retained plus native settings Enter during intro does not advance its card and preserves mute/focus |
| Full `tests/browser-smoke.mjs` | Not run in S1; three full renderer runs remain required at CP2 after S4 |
| `git diff --check` | Exit 0 after final tracking writes; informational line-ending warnings only |

Preview and the two focused Edge commands received scoped native elevated approval because sandbox Edge/localhost limitations were already observed. Own server was exactly `npx.cmd vite preview --host 127.0.0.1 --port 4190 --strictPort` with the private TEMP prefix, session 90601. No software install, settings/firewall change or protected process control occurred. Both browser scripts closed their own browsers in `finally`; own preview 90601 then stopped via Ctrl+C, observed exit 1. No server is intentionally left running and no tracked `docs/ruta01-*.png` was generated, so no restoration was needed.

### S1 visual evidence and remaining boundary

All ten new 960x540 captures (320x180 logical canvas at 3x) were inspected with `view_image` at original resolution:

- `docs/design/checkpoint-2-captures/s1-card-1-webgl.png`, `s1-card-2-webgl.png`, `s1-card-3-webgl.png`, `s1-card-4-webgl.png`, `s1-reduced-webgl.png`.
- `docs/design/checkpoint-2-captures/s1-card-1-canvas.png`, `s1-card-2-canvas.png`, `s1-card-3-canvas.png`, `s1-card-4-canvas.png`, `s1-reduced-canvas.png`.

Observed readable glyphs/accents, centered native lines, card 2's unclipped two-line wrap, small Kipu, dark backdrop and clear control bar in both renderers. Reduced captures show static complete first-card text. No route pilot was needed; only one capture/check sequence per renderer occurred. This is S1 evidence, not the principal's independent CP2 review. Parent owns commit/hash recording; next writer unit is S2 only after parent verification. Requests for PRINCIPAL: release/checkpoint summaries should reflect the once-per-session intro and retain pending full CP2 smoke/Canvas eye evidence. No principal-owned file was edited.

### Task 0 acceptance and changes

- `index.html`: eyebrow is `PROTOTIPO · RUTA 01`; art disclosure is `Arte generado con IA y elementos procedurales.` Existing focus, pause and achievement guidance is unchanged. Provenance was checked against the worktree's credits (AI art plus procedural placeholders); no final-art or license claim is made.
- `loopRules.ts`: manual collision is exactly centered 18x20, offset -9/-10, through pure `nodeHitbox(now)`. `RouteScene.ts` consumes that same helper for its existing screen-space shot-overlap check. This is NOT an Arcade body setter.
- Eye frames, texture/origin, visual size, bob, HP 5, two-repeat timeout, formation, score and drop logic are unchanged. `eyeRelic.ts` changes only the stale 12x12 comment. The legacy eye test intentionally accepts the authorized rectangular target while retaining HP/location/bob and all other art/animation assertions.
- Tests prove newly admitted 6x3 shots on all four edges miss the old 12x12 square but overlap the new rectangle; shots that merely touch the four outside edges still miss. Center and dimensions are checked across the complete loop window.

### Task 0 exact checks and observed outcomes

All commands use explicit Track B cwd, `login:false`, and this same-invocation prefix for tests/build/preview/browser:

```powershell
$env:TEMP="$PWD\node_modules\.tmp"; $env:TMP=$env:TEMP; New-Item -ItemType Directory -Force $env:TEMP | Out-Null
```

| Command / phase | Observed result |
|---|---|
| `npx.cmd vitest run tests/loopRules.test.ts tests/eyeRelic.test.ts` RED | Exit 1: 10 failed / 29 passed; old body 12 differs from 18x20, helper missing |
| Same focused command GREEN and final rerun | Exit 0: two files / 39 tests, including nine new geometry cases |
| `npx.cmd tsc --noEmit` | Passed before the full test run (the guarded command continued) |
| `npm.cmd test` | Exit 0: 35 files / 394 tests (historical baseline 385 + nine geometry tests) |
| `npm.cmd run build` | Final retained receipt exit 0, 69 modules; existing nonfatal large-chunk/npm-config warnings |
| `node tests/page-ui-check.mjs` RED against built old copy | Exit 1: exactly two new copy failures, all original 14 assertions passed |
| Same page command GREEN after copy/build | Exit 0: 16/16 assertions; original assertions unchanged |
| `git diff --check` | Exit 0; only informational Git line-ending warnings |

The geometry-stage build also exited 0 before page-copy RED. A combined typecheck/test/build invocation returned during its final build, but its session identity was not retained by the output wrapper; that build's completion is NOT counted as evidence. A separate final `npm.cmd run build` retained exit 0 and the complete output. No mutating normalizer was needed; final source writes preceded final functional checks.

Page checks used `$env:PACHA_URL='http://127.0.0.1:4190'` against own approved elevated `npx.cmd vite preview --host 127.0.0.1 --port 4190 --strictPort`, session 76660. Native permission requests were scoped to this server and focused Edge commands, based on previously observed sandbox launch/connectivity limitations. No settings, firewall, installation or external-server controls changed.

### Task 0 visual evidence and limits

One bounded capture invocation drove real keyboard input and read only `pachaDebug()` snapshots, serially WebGL then Canvas; it did not fast-forward clocks or write debug/game state. It wrote only new `docs/design/checkpoint-2-captures/task0-*.png` evidence. Reviewed with `view_image`:

- `task0-page-webgl.png`: current eyebrow/disclosure, unchanged layout and controls.
- `task0-page-canvas.png`: same current HTML shell with Canvas renderer.
- `task0-eye-webgl.png`: active seven-frame eye at clock 82017.89 ms, node `(262,98)`, texture `loop-eye-idle3`, player HP 2; no page errors. The visible disc/cables remain unchanged. Screenshot cannot prove invisible collision geometry; shared pure-helper tests are the collision proof.

Canvas pilot ended in defeat at clock 75362.75 ms, before the eye segment, with zero page errors. Its eye screenshot is unavailable after exactly one attempt and remains pending CP2; no retry, full smoke or pilot/assertion weakening occurred. Full long smoke is deliberately deferred to CP2 after S4, not falsely reported as passed for Task 0.

The capture browser closed in its `finally`. Only own preview 76660 was then interrupted, exit 1 on Ctrl+C. No preview is intentionally left running. No tracked `docs/ruta01-*.png` was generated/changed, so no restoration was needed. Final forbidden-surface readback is clean for principal README/CREDITS/VERIFICATION, capture-social tool and art assets. No commit, main read/edit, merge/sync/push, release documentation or S1 implementation was performed. Rollback is the Task 0 copy, rectangle/helper, tests and corresponding worktree tracking/evidence only.

## Historical B1–B5 and environment records

The opening statuses and task ownership below describe earlier snapshots, not the current integrated baseline. They are retained as evidence; current roles/order come from `docs/CONTINUATION_PLAN.md` sections 9 and 10.

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
| 5 | B4: SHOTS integration | Complete locally (see B4 section); 378 tests, smoke W1+W2 WebGL and C1 Canvas green |
| 6 | B5: LOOP_NODE_EYE integration | Complete locally (see B5 section); 385 tests, smoke W1+W2 WebGL and C2 Canvas green (C1 = Firewall flake) |
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

## B4 SHOTS integration (2026-10-14)

Delegated writer, parent-verified. `src/game/shotSheets.ts` (pure slicing, alpha bounds and head anchors) and `shotFx.ts`/`fxTextures.ts` now build every bolt frame from `shots-v1-normal-16x12.png`, `shots-v1-rafaga-24x20.png` and `shots-v1-impact-16x16.png` (4 frames each) under the unchanged keys `shot-<kind>-<frame>` and `-nokia` twins. The impact burst decodes each 16x16 frame once into opaque pixels (with exact Nokia greens) painted by the unchanged `drawImpacts`; pool capacity 12, timing, reduced-motion frame, the invisible 6x3 bodies, speeds and damage did not change. Scene hunks: `loadShotSheets(this)` in `RouteScene` and `GuardianScene` `preload` plus their imports (4 lines). Anchors are computed from real alpha (normal (9, 6.5) in 16x12, Ráfaga (15, 11) in 24x20; the tip sits at the physics body's front edge, matching the old placeholder). Visible behavior change: Ráfaga hits now share the single prepared burst (the procedural one grew for Ráfaga). No reduced sheets were made: occupied sizes (~11x5 and ~16x11) do not cover Kipu, enemies or enemy bolts in the captures; the reduced-sheet command is documented in `INTEGRATION_NOTES.md` if needed. Removed exports: `SHOT_ART`, `impactPixels`, `IMPACT.arm` (no other users found).

Evidence: RED `vitest run tests/shotFx.test.ts` failed on the missing module `../src/game/shotSheets` (module-missing failure, not an assertion failure); GREEN 20 tests in that file, full suite 35 files / 378 tests, typecheck exit 0, build exit 0. The new tests decode the real PNGs (grid, binary alpha, margins, anchors, every REVERSE pixel is a Nokia green). Smoke on own preview 4190, unmodified: W1 exit 0, W2 exit 0, C1 exit 0 (22 groups each; the REVERSE frame check passed in all three). Captures reviewed: normal bolts and impacts in WebGL and Canvas (writer and parent), Ráfaga volley in WebGL (turquoise arrows with gold tips, fan reads as a volley but is dense at launch; no human sign-off), REVERSE frame in Canvas. Not seen: a Ráfaga volley in Canvas and a REVERSE impact burst in a browser frame (unit-tested only). `docs/ruta01-*.png` rewritten by the smoke were restored and not committed.

## B5 LOOP_NODE_EYE integration (2026-10-14)

Delegated writer, parent-verified. New `src/game/eyeSheets.ts` (pure slicing, alpha bounds, disc-center math); `eyeArt.ts` keeps only the frame-name type; `eyeRelic.ts` takes cell and anchor from the sheet; `fxTextures.ts` adds `loadEyeSheet` and slices `loop-eye-idle0..3`, `-hit`, `-crack`, `-break` from `loop-node-eye-v1-40x56.png` under the unchanged keys. `RouteScene.ts`: import plus `loadEyeSheet(this)` in `preload`, and the HP pip row moved from `p.y - h - 5` to `p.y - EYE.pipsAbove` (18) because the new eye's top tab reaches 14 px above the node and overlapped the pips (3 px, slightly beyond a minimal hunk). Node HP (5), position, bob, collision body, depth and `eyeFrameFor` are unchanged; the eye is not drawn in the Guardian scene, so no REVERSE twin was needed.

Decisions: the full 40x56 sheet is used. A 24x32 or 28x40 derivative halves the content (~13x21 occupied) and loses the slit pupil and the stepped chakana, so neither was kept. The display anchor is (20, 21) in the cell (origin 0.5, 0.375), measured from the alpha of the idle gold frame; the JSON origin (20, 28) is 7 px below the visual eye, so it is not used. The programmatic shatter was undersized for the larger relic, so only its geometry was retuned (shard speeds 52/72/92, sizes 3/2/1, loosened cables start at row +14 and x -7/-3/3/7); counts, timings and determinism are unchanged.

Evidence: RED `vitest run tests/eyeRelic.test.ts` failed on the missing module `../src/game/eyeSheets` (a missing-module failure; the pip and shatter changes have no RED of their own). GREEN 22 tests in that file, full suite 35 files / 385 tests, typecheck exit 0, build exit 0. Smoke on own preview 4190, unmodified: W1 exit 0, W2 exit 0, C1 exit 1 (`touching a Firewall column outside its gap must cost a heart`, known pilot flake), C2 exit 0. Captures reviewed: idle eye in the route (WebGL, parent), idle, hit, crack, break and four shatter frames in WebGL and Canvas (writer): the eye reads as the Bucle node, is about Kipu's size and covers neither Kipu nor the bolts. Captures under `docs/` were restored and not committed.

Open risk (for the user): the visible disc is about 26 px while the hitbox is still 12x12 (unchanged by design), so bolts touch the gold frame about 7 px before registering. If this feels off in play the options are a larger hitbox or a smaller eye sheet. Human approval of the eye is not recorded.

Next: CHECKPOINT 1 report (sync with main, full QA, report and stop).
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
