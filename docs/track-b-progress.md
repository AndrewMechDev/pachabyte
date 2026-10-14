# Track B continuation progress

Status: task 1 branch synchronization, private dependencies and full unit baseline are verified: 33 files/347 tests pass with the same-invocation TEMP/TMP prefix. Build passes; one WebGL smoke attempt is unavailable at Edge launch. B1 source and asset work has not started.

## Authority and current scope

`docs/CONTINUATION_PLAN.md` is the source of truth for the 16 ordered tasks. Track A is frozen; this session owns all remaining development in the Track B worktree on `feat/track-b-ui-map`. Current baseline: `cd80afae86d436f24dddd877150f095f26117ad3`.

The user authorized ordered dependency recovery, recording observed outcomes here, then B1. This bounded recovery task made no gameplay, asset, lockfile or configuration changes. Later work remains task-by-task with tests and documentation, local Conventional Commits and no AI attribution. Push, main-folder changes, merge to main, deployment and other remote destinations require separate current-session authorization.

The old parallel split, forbidden gameplay/README/smoke surfaces, deferred Ajustes, and handoff-to-Track-A delivery rules are superseded by the continuation plan. Its detailed B3 smoke scope still applies to that task; later pilot/Pulso tasks authorize their own changes. This tracker remains the recovery locator. No `odd/tasks/*` file was changed during environment recovery.

## Ordered tasks and observed progress

| # | Task | State / next evidence |
|---|---|---|
| 1 | Branch synchronization and private dependencies | Verified: refs equal, private dependencies and npm ls/typecheck; TEMP/TMP-prefixed full unit run passes 33 files/347 tests. WebGL smoke independently unavailable at browser launch |
| 2 | B1: prepare six sources, integration notes, statuses and credits | Not started; delegated writer required for preparation/tool/docs work |
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

No task commit was created in this recovery. Task 1 environment acceptance is verified by the TEMP/TMP recovery recorded below; its commit remains parent-owned and pending. B1 has no source writes or prepared outputs. Preserve originals under `assets/incoming/`; future preparation outputs belong under `assets/prepared/`.

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
