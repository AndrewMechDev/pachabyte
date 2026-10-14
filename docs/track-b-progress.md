# Track B continuation progress

Status: task 1 environment is committed and verified. B1 preparation, asset inspection, tool tests and independent functional verification are complete; unchanged smoke passes in WebGL and Canvas after one recorded WebGL pilot-failure classification rerun. B1 local commit is the next bookkeeping step. Prepared assets are not integrated. No B2 work has started.

## Authority and current scope

`docs/CONTINUATION_PLAN.md` is the source of truth for the 16 ordered tasks. Track A is frozen; this session owns all remaining development in the Track B worktree on `feat/track-b-ui-map`. Current baseline: `cd80afae86d436f24dddd877150f095f26117ad3`.

The user authorized ordered dependency recovery, recording observed outcomes here, then B1. This bounded recovery task made no gameplay, asset, lockfile or configuration changes. Later work remains task-by-task with tests and documentation, local Conventional Commits and no AI attribution. Push, main-folder changes, merge to main, deployment and other remote destinations require separate current-session authorization.

The old parallel split, forbidden gameplay/README/smoke surfaces, deferred Ajustes, and handoff-to-Track-A delivery rules are superseded by the continuation plan. Its detailed B3 smoke scope still applies to that task; later pilot/Pulso tasks authorize their own changes. This tracker remains the recovery locator. No `odd/tasks/*` file was changed during environment recovery.

## Ordered tasks and observed progress

| # | Task | State / next evidence |
|---|---|---|
| 1 | Branch synchronization and private dependencies | Verified: refs equal, private dependencies and npm ls/typecheck; TEMP/TMP-prefixed full unit run passes 33 files/347 tests. WebGL smoke independently unavailable at browser launch |
| 2 | B1: prepare six sources, integration notes, statuses and credits | Preparation independently verified: tool self-tests, typecheck, 33 files/347 tests, build; WebGL W2 and Canvas C1 pass 22 groups each. W1 pilot failure retained. Local commit pending |
| 3 | B2: map selection, pure rules, font-safe text and six nodes | Pending; delegated multi-file behavior with tests |
| 4 | B3: page logo/background/theme and Ajustes | Pending; Ajustes is now in scope, with precise smoke button-helper updates |
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

All six received sources were inspected and measured: map/page/neon 1672x941 RGB; logo 2172x724 RGBA; eye 1659x948 RGBA; shots 1448x1086 RGBA. Before/after source SHA256 identities and output metadata are in `assets/prepared/b1-review-manifest.json`; all six source hashes match the initial read.

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

Four corresponding sprite JSON files record measured source boxes, cell bounds, order, center anchor and sampling scale, with no invented duration. Ten `b1-review-*-zoom.png` files record nearest-enlarged inspection pairs over a dark backdrop. New `docs/design/INTEGRATION_NOTES.md` contains exact final reproduction commands and integration caveats. Asset request statuses say prepared, not integrated; credits preserve user-art provenance and all-rights-reserved licensing pending a user decision.

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

Retained and inspected through `view_image`: `assets/prepared/b1-review-webgl-map.png`, `b1-review-webgl-bolts.png`, `b1-review-webgl-loop.png` and corresponding `b1-review-canvas-*.png`. These show unchanged procedural map/bolt/eye gameplay, not new-asset integration. Smoke-generated tracked screenshots were restored only after inspection, with an exact `git restore --source=HEAD --worktree --` list: `docs/ruta01-bolts.png`, `ruta01-bugs.png`, `ruta01-eruption.png`, `ruta01-eye.png`, `ruta01-freed.png`, `ruta01-liberation.png`, `ruta01-loop.png`, `ruta01-map.png`, `ruta01-memoryleak.png`, `ruta01-nokia.png`, `ruta01-packetloss.png`, `ruta01-pickups.png`, `ruta01-route.png` (all under `docs/`). The first sandbox restore failed at the shared Git worktree `index.lock` with permission denied; the identical exact-path restore was then explicitly approved through native escalation and exited 0. Their final Git status is clean. No preexisting screenshot changes existed, no blanket restore was used, and no screenshots under `docs/` belong in the B1 commit.

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

## Recovery evidence (2026-10-14)

All commands used the literal Track B working directory and non-login PowerShell. The only mutation surface was private `node_modules/`, followed by this tracker update.

| Operation | Observed result |
|---|---|
| Branch/root/status checks | `feat/track-b-ui-map`; correct Track B root; only this pre-existing untracked tracker |
| `git rev-parse HEAD main feat/polish-phases` | All three refs equal `cd80afae86d436f24dddd877150f095f26117ad3` |
| `git rev-list --left-right --count HEAD...main` | `0 0`; no synchronization mutation needed |
| Dependency-root guard | Ordinary Directory, no ReparsePoint, empty LinkType/Target; exact resolved private path inside Track B |
| Sandbox CIM process check | Unavailable: CIM access denied |
| Approved read-only elevated CIM check | Zero npm-cli/vitest/playwright command matches; zero explicit Track B node/browser matches; known own install sessions already stopped; no processes killed |
| Literal PowerShell `Remove-Item -Recurse -Force` | Exit 0; only the verified ordinary Track B dependency directory removed |
| Separate absence check | Test-Path false and Get-Item ItemNotFound, including no dangling-link entry |
| `npm.cmd ci --no-audit --no-fund` | Exactly one retry, uninterrupted; exit 1, `Exit handler never called!` |
| Raw SHA256 lock comparison | Different hashes; copy paused for a bounded read-only semantic comparison |
| CRLF/LF-normalized text and sorted parsed-JSON comparison | Both exactly equal; 67 package entries each; no package-field, version, resolved or integrity differences |
| First read-only copy-endpoint verification | PowerShell parser error (empty pipe after foreach); parsing failed before command execution or mutation |
| Corrected read-only endpoint check | Exit 0; both literal source and destination are ordinary non-link directories; destination resolves inside Track B |
| Literal canonical-to-Track-B `robocopy` with `/MIR /NFL /NDL /NJH /NJS` | Exit 1: success under the robocopy 0-7 contract; direction was source canonical, destination Track B only |
| Post-copy private-directory guard | Ordinary Directory, no ReparsePoint, empty LinkType/Target |
| `npm.cmd ls --depth=0` | Exit 0; all five expected direct dependencies shown below |
| `npm.cmd run typecheck` | Exit 0 (`tsc --noEmit`) |
| `npm.cmd test` | Exit 1: 25 failed suites, 8 passed files (33 files); 47 tests executed and passed; remaining suites failed during import |

The npm configuration warning about `minimum-release-age` appeared during installation and npm checks. It was nonfatal for npm ls and typecheck. Neither install failure nor test failure has a proven root cause.

### Lockfile identity and copy boundary

- Canonical package-lock SHA256: `03C5833FA64B76DA26CFABF1C9EFF2BFE272DA68A55A3F7C274AF4BBFF1FBC76`.
- Track B package-lock SHA256: `D099A20AD77BDFE3B24681593BCD50D3B5841DF3765815A08E8EE523AE8B741E`.
- Canonical has zero CRLF sequences; Track B has 1168. Normalizing CRLF to LF yields exactly identical text. Recursively sorted parsed JSON is also identical: this is a checkout-line-ending difference, not dependency divergence.
- Source: `C:\Users\dark_\Documents\hack-the-andes-game\node_modules`.
- Destination: `C:\Users\dark_\Documents\hack-the-andes-game-worktrees\track-b\node_modules`.
- Both were verified ordinary and non-link before copying. The source was read only; no canonical repair, deletion, configuration change or process control was performed. Source package-manifest hashes/timestamps were sampled before copying, but whole-source-directory integrity was not independently proven afterward.
- User-reported canonical health (five dependencies and npm ls success) is user evidence, not a check executed by this session. It does not erase the earlier incident evidence below.

### Verified direct dependency versions

| Package | npm ls version |
|---|---|
| phaser | 3.90.0 |
| playwright | 1.62.1 |
| typescript | 5.9.3 |
| vite | 8.3.4 |
| vitest | 5.0.3 |

### Functional stop

All 25 failing suites reported `ENOENT` while opening generated `ssr` module files under a sandbox temporary directory. They failed during module import, before their assertions could run. The observed result is 47 passing executed tests, NOT 347 passing tests. The documented 347-test count remains historical context.

Stop after this result: no assertion weakening, retry, cache cleanup, source/configuration change, build, browser smoke or server was performed. The filesystem/cache/worker relationship may warrant a bounded future diagnostic; this is a recommendation, not a proven sandbox root cause or authorization to proceed.

## Next step

Parent should mirror and spot-check the now-passing TEMP/TMP unit/build baseline before starting B1. The earlier diagnostic failures below are historical and resolved for the observed unit command by the final temporary-directory recovery. WebGL smoke is unavailable at Edge launch; Canvas, screenshots, asset-tool RED/GREEN and visual acceptance remain pending. No review lifecycle or commit was run by this recovery worker.

## Historical scope and incident (superseded, retained as evidence)

The initial tracker covered only B1-B3 at baseline `81124e9`, reserved gameplay/test/README/odd surfaces for Track A, deferred Ajustes and all delivered-sprite gameplay integration, and proposed a local handoff. Those restrictions are historical and superseded by the current continuation scope above. The original dependency incident record follows unchanged; statements about then-current paths and next steps describe that earlier snapshot, not the recovered state.

## Dependency-isolation incident

The first literal junction-removal attempt failed with Windows exit 123. The delegated executor incorrectly started `npm.cmd ci` without verifying successful removal. The installation ran for the initial 10-second tool interval with only an npm config warning observed, then its own session was interrupted (exit 1). A subsequent nonrecursive removal succeeded; Track B `node_modules` is now absent. No private install was restarted.

This was a sequencing error, not an approved relaxation of isolation. Future installation must be a separate invocation gated by successful unlink AND an independently verified absent/non-junction Track B path.

Parent independently confirmed the absent Track B dependency path and intact sampled canonical Vite/TypeScript manifests with prior timestamps. An independent read-only verifier found no matching Track B npm-ci debug log. Neither the removal/reify phase nor complete canonical dependency integrity can be proven from this evidence. Some canonical checks returned zero in available logs, but their ordering relative to this incident is unknown and they are not acceptance proof for B1.

Track B's tracked diff remains empty; this progress document is untracked. No prepared assets, gameplay changes, forbidden-file changes or commits were made. The worktree-local CodeGraph index was initialized by the writer per repository instructions. Canonical ongoing source changes were observed read-only and are not attributed or modified by Track B.

Required checks remain pending: meaningful RED/GREEN, preparation-tool self-test, typecheck, unit tests, build, both renderer smoke runs and all output visual inspections. No server was started, no remote operation occurred, and B2/B3 were not started. Request for Track A: confirm its environment health through its own verification before Track B resumes; do not reinstall or repair live shared dependencies automatically.


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
