> **Recovery note — October 12, 2026:** Content restored from retained complete sections after a UTF-8 encoding failure truncated this document. Whitespace was normalized; this is content recovery, not original-byte restoration. No new retro implementation outcomes are included.

> **Relocation status — October 12, 2026:** The evidence below is historical and describes the original Sprint 0 source project. It does not prove the relocated copy works. This task has not run dependency installation, tests, typecheck, build, preview, server, or browser checks in this destination. SHA-256 parity matched for all 15 untouched copied files; the README and two historical plan/verification records were intentionally edited. See `VALIDATION_PLAN.md` for the pending final functional gate. The old `work/pachabyte` logs mentioned below were kept outside the canonical folder and are not included in this copy.
# PachaByte — Sprint 0 Verification Record

**Date:** October 11, 2026 (America/Lima).  
**Status:** Writer checks passed, including final actual-browser viewport regression. Independent verification and parent spot check passed. This record is based on observed results only.

## Environment and dependencies

- Windows, PowerShell commands run without the user's shell profile.
- Node **22.15.0**, npm **11.6.2**, confirmed from actual executables.
- `npm.cmd ls --depth=0`: Phaser **3.90.0**, TypeScript **5.9.3**, Vite **8.3.4**, Vitest **5.0.3**, Playwright **1.62.1**.
- npm cache kept under the parent workspace's `work/pachabyte/npm-cache`.
- No repository was initialized. Git commits/native repository review/remote publishing are N/A.

## Command evidence

Commands ran from the project root; cache argument below abbreviates the absolute workspace `work/pachabyte/npm-cache` path used during execution.

| Command | Observed result |
| --- | --- |
| `npm.cmd install --cache <workspace-cache> --fetch-retries=0 --fetch-timeout=30000` | Exit 0, initial install added 40 packages; initial Vite pin had one high-severity vulnerability. |
| Same install after patched Vite pin | Exit 0, changed 5 packages, audited 41 packages, **0 vulnerabilities** reported. |
| `npm.cmd test` before implementing rules | Exit 1, **11 assertion failures / 9 passes**, 20 total tests; intentional meaningful RED. |
| `npm.cmd test` after implementing rules | Exit 0, **20/20 passed**, including final rerun after input corrections. |
| `npm.cmd run typecheck` | Final exit 0; strict TypeScript check. An earlier incorrect Sprite gravity method was found and changed to Body.setAllowGravity. |
| `npm.cmd run build` | Final exit 0, includes typecheck; Vite built 9 modules. JS 1,204.58 kB / gzip 321.80 kB. |
| `node.exe --check tests/browser-smoke.mjs` | Exit 0; runner syntax valid. This alone is not browser verification. |
| `npm.cmd run preview` | Local production server reached `http://127.0.0.1:4173/`. Owned server is stopped at handoff. |
| `npm.cmd run test:browser` | Final exit 0, actual Edge **155.0.4283.45** passed **12 grouped runtime checks**, including viewport containment; no console/page errors. |

The RED run executed valid tests against behavior stubs, not a missing-module failure. For example, right movement expected `{ velocityX: 100, facing: 1 }` and received `{ velocityX: 0, facing: -1 }`. GREEN uses those same assertions against the rules consumed by the actual scene.

## Actual browser coverage

Observed headless Microsoft Edge **155.0.4283.45** executed real keyboard input against the production preview. Opt-in telemetry reads actual Arcade bodies/camera/targets; it does not move the player or bypass gameplay rules.

- Canvas boot at logical 320 × 180, initial grounded body and 12 allocated projectiles.
- A/D and arrow movement, opposite-key cancellation, release and facing retention.
- All three jump bindings, gravity/landing, no airborne second jump and no held auto-jump.
- Landing on an elevated static platform.
- Right/J and left/Z projectiles, target impact exactly once, bounded pool (**observed maximum 9 active / 12 allocated**), TTL and left-edge cleanup.
- Camera-follow in the wider world, fixed HUD, right world bound.
- Blur/focus lifecycle handlers clear held movement/fire; repeated restarts restore spawn, facing, targets and pool.
- Aspect-ratio scaling and containment within a 600-pixel-wide viewport; ordinary launches do not expose the debug getter; no browser console/page errors in the final passing run.

The blur check dispatches real DOM blur/focus events to exercise the lifecycle handlers; it is **not** a claim of exhaustive OS/window-manager focus testing. Subjective feel, every GPU/browser and cultural/art quality remain unverified.

## Corrections and bounded failures

1. Sandbox registry lookups failed with `ENOTFOUND`; an approved registry-access execution succeeded. Installation was not called successful until actual exit 0.
2. Initial Vite 8.0.10 audit found Windows path-disclosure advisories. Pin changed to verified same-major Vite 8.3.4; patched install reported zero vulnerabilities. No blind `audit fix --force` ran. Sources: [Windows alternate paths](https://github.com/advisories/GHSA-fx2h-pf6j-xcff), [UNC handling](https://github.com/advisories/GHSA-v6wh-96g9-6wx3).
3. Sandbox Edge launch failed on isolated-profile file access; approved execution outside sandbox launched. An outside browser could not reach a sandbox-network preview; starting both localhost preview and browser in the same approved execution context resolved it. No existing browser profile/session was reused.
4. An early smoke assertion assumed holding fire could hit only the first target; projectile range also reaches the second. The runner now isolates the first shot and verifies `hits + active targets === 4` under repeated fire. This corrected a test assumption, not a gameplay mechanic.
5. Quick R taps were lost because Phaser's key-up clears `JustDown` before the next scene update. Jump/restart press edges are now queued from key-down events. The runner waits for a new actual scene generation, avoiding old-state false positives. Passing runtime checks include repeated restarts.
6. A missing favicon caused a browser 404; an inline original SVG favicon removed that resource error.
7. Visual screenshot inspection found CSS Grid intrinsic sizing could retain a desktop-width canvas on a narrower viewport. The container now uses a `minmax(0, 1fr)` track and zero minimum item width; the smoke runner additionally asserts viewport containment. Final full browser regression passed, and the actual 600-pixel screenshot was visually read back.

## Warnings, limits and remaining checks

- Vite's **>500 kB chunk warning** remains: Phaser dominates the small prototype's bundle. It is not suppressed; code splitting/performance work is out of Sprint 0 scope.
- npm reports an existing unknown user configuration key, `minimum-release-age`. No global configuration was changed.
- Independent verifier repetition and parent spot check passed.
- Clean-machine `npm ci` and human subjective playtesting have not been independently demonstrated by this writer.
- Hackathon unidentified; prior-development eligibility remains unknown. No submission or publication occurred.
- No boss, PachaShift mechanic, final spritesheets, animation pipeline, mobile input or audio was tested because none was implemented.

## Independent verification

A separate verifier reran checks against the existing installed dependencies and rebuilt production output on October 11, 2026. No source code or dependency pins were changed.

| Command / inspection | Independently observed result |
| --- | --- |
| `node.exe --version`, `npm.cmd --version` | Node 22.15.0, npm 11.6.2 |
| `npm.cmd run typecheck` | Exit 0 |
| `npm.cmd test` | Exit 0, 20/20 tests passed |
| `npm.cmd run build` | Exit 0, 9 modules; retained >500 kB chunk warning |
| `npm.cmd ls --depth=0` and lockfile readback | Exit 0; all five direct package versions match the pins above |
| `npm.cmd audit --json --cache <workspace-cache> --fetch-retries=0 --fetch-timeout=30000` | Exit 0; zero reported vulnerabilities at verification time |
| `npm.cmd run test:browser` against freshly rebuilt local preview | Exit 0; Edge 155.0.4283.45, all 12 grouped checks passed, no console/page errors; observed maximum 9 active bullets / 12 allocated |
| `node.exe ../../work/pachabyte/verifier-extra.mjs` | Exit 0; supplemental real-keyboard checks explicitly verified left player bound x=6 and restart after camera scrolling: spawn (48,154), horizontal velocity 0, initial camera, hits 0 and four restored targets |
| Screenshot inspection | Actual 600x700 browser capture shows contained 16:9 canvas, turquoise/gold placeholder, readable surrounding controls, pale buildings and volcanic silhouettes |
| Documentation / telemetry readback | README scripts and dependency pins match the project; browser actions use actual keyboard events, and telemetry reads the actual body/camera/pool rather than an alternate movement path |

Both browser checks used newly launched isolated headless Edge instances, with temporary profile storage under the workspace `work/pachabyte` directory. The owned preview and browser ran in the same approved execution context; each owned server was stopped in `finally`. No ambient browser session was reused or browser downloaded.

This repetition does not independently recreate historical RED or prove clean-machine installation. The existing smoke runner's restart helper checks scene generation, targets, pool and facing; its descriptive label alone did not assert spawn coordinates, so the supplemental verifier checked actual spawn, camera and hit reset explicitly. Focus testing remains event-handler coverage, not exhaustive OS focus testing. No subjective playtest, other-browser/GPU matrix, hackathon eligibility, publication or submission was verified. Parent separately reported `npm.cmd test` exit 0 with 20/20 tests passing and visually inspected `docs/prototype.png`; this is parent-observed evidence, not an extra verifier execution.

Verifier working evidence: `verifier-checks.log`, `verifier-audit.log`, `verifier-browser.log`, `verifier-preview.log`, `verifier-preview-errors.log`, `verifier-extra.mjs`, `verifier-extra.log`, `verifier-extra-preview.log`, `verifier-extra-preview-errors.log` and `verifier-prototype.png` under the parent workspace `work/pachabyte` directory.

## Evidence locations

Detailed logs are in the parent workspace's `work/pachabyte`: `rules-red.log`, `rules-green.log`, `rules-final.log`, `install-final.log`, `typecheck-final.log`, `build.log`, and `browser-writer-final.log`. They are working evidence, not required runtime assets. [prototype.png](prototype.png) is an actual browser screenshot from the final passing run, not generated concept art.

## Canonical Phase 1 checks — October 12, 2026

The historical records above do not substitute for these newly observed canonical-copy checks. Phase 1 introduces a static Kipu evaluation only; no deferred mechanic or final art approval is claimed.

| Check | Writer-observed outcome |
|---|---|
| Source / prepared image | Original 1122×1402 preserved; output 32×40; actual binary alpha: 1019 transparent / 261 opaque pixels. Nearest-neighbor adaptation with alpha threshold 128. |
| Meaningful browser RED | After adding telemetry/assertions, the unchanged placeholder ran successfully and failed the expected texture assertion: actual `kipu`, expected `kipu-evaluation`; observed 16×20 visual and unchanged 12×18 body at relative (-6,-8). No missing-file failure was called RED. |
| `npm.cmd run typecheck` | Final exit 0. An intermediate PNG import type error was fixed using Vite client types. |
| `npm.cmd test` | Exit 0; 20/20 deterministic rules tests. |
| `npm.cmd run build` | Final exit 0; 10 modules; production output refreshed. Existing >500 kB Phaser chunk warning remains (JS 1206.61 kB, gzip 323.51 kB). |
| Preview / `npm.cmd run test:browser` | Final exit 0 against an owned production preview at 127.0.0.1:4175; Edge 155.0.4283.45; 13 grouped checks; zero browser errors. |
| Art/collision regression | Actual native/display 32×40, actual body 12×18 and relative position (-6,-8); left flip and repeated restart preserve art and collision. All existing movement, jumps, platform landing, shots, pooling, camera, bounds and lifecycle checks passed. |
| Screenshot | [phase1-gameplay.png](phase1-gameplay.png) inspected: recognizable turquoise/gold static Kipu, contained canvas, no clipping at captured spawn. Transparent source margins leave a smaller occupied silhouette and visible hovering gap; final pivot/core alignment and human visual acceptance remain pending. |

The first sandbox browser launch failed before gameplay due isolated Edge profile access. An approved isolated browser plus owned preview in the same execution context produced the actual RED and GREEN results. The user's port 4173 server was untouched; only owned preview processes were stopped.

Independent functional verification and the parent spot check are complete. RDD is globally disabled; native risk assessment was unassessable/high due the untracked inventory, so independent functional checks were used. No native review was started or approval fabricated. No Git initialization, commit, push, publication or submission occurred. Event eligibility and organizer email requirements remain unverified.

### Phase 1 independent verification and parent readback

A fresh verifier reported typecheck exit 0, 20/20 rules tests, build exit 0 (retained 1206.61 kB chunk warning), and Edge 155.0.4283.45 browser exit 0 with all 13 grouped checks, zero browser errors and maximum 9/12 active bullets on an owned port 4174 preview. Only that owned preview was stopped. The initial sandbox browser-profile launch failed, and a separate attempt could not reach a stopped preview; the combined approved preview/browser execution passed. These environmental attempts are not hidden or called successful.

The parent separately observed typecheck exit 0 and reviewed the gameplay screenshot. No deterministic functional blocker remains in Phase 1. Source-margin hovering, final core/pivot alignment and human art acceptance remain pending; later phases remain proposed.

## Grounding and procedural environment — October 12, 2026

| Check | Writer-observed result |
|---|---|
| Meaningful browser RED | Actual loaded-image alpha sampling failed with `initial floor: occupied alpha edge gap 8 logical pixels`; baseline origin Y 30 and body bottom 164 at player.y 154. This was a valid gameplay assertion, not a missing-file failure. |
| Grounding GREEN | Origin (0.5,0.55), offset (10,14), unchanged body 12×18 at relative (-6,-8). Actual alpha bottom row32 aligns with body bottom; floor, left-facing floor, repeated restart and first platform landing satisfy <=1 logical pixel. |
| Typecheck / rules / build | Exit 0 for each; 20/20 rules tests; 10 modules; JS 1206.81 kB / gzip 323.58 kB. Existing  >500 kB chunk and npm user-configuration warnings remain. |
| Real browser | Isolated Edge 155.0.4283.45 on owned port 4176: exit 0, 14 grouped checks, no console/page errors, max 9/12 bullets. Existing movement, jump, focus, camera, pool and lifecycle checks retained. |
| Screenshots | [Ground](quality-ground.png) and [platform](quality-platform.png) inspected: lowest scarf pixels contact surface; muted scenery and distinct playable top edges. No purple overlay is rendered. Human acceptance and core collider fit remain separate. |
| Local skill | Compact entrypoint and sourced supporting reference created; AGENTS and registry point to exact project path. Structural frontmatter/headings/link checks passed. Bundled `quick_validate.py` unavailable in both Python runtimes because PyYAML is absent; no package was installed. |

The initial sandbox Edge launch failed on temporary-profile access. An approved isolated preview/browser pair produced RED then GREEN; only owned processes were stopped. User port 4173 was untouched. No incoming/prepared image was modified. No Git bootstrap, staging, commit, remote operation or native review occurred. Independent functional verification and parent readback are complete. Existing event eligibility and human art acceptance remain unverified.

### Independent closure and parent readback

A fresh verifier independently observed typecheck exit 0, 20/20 rules tests, build exit 0 and 14 browser checks passing in Edge 155.0.4283.45. Actual loaded alpha pixels and actual body geometry show exactly zero logical-pixel separation at spawn, left-facing floor, restart and platform landing: floor body bottom 164, platform body bottom 132, origin Y 0.55/display origin Y 22, body 12×18 relative (-6,-8), native/display frame 32×40. This proves lowest-scarf contact, not perfect core-silhouette collision fit or human art acceptance.

The parent separately observed typecheck exit 0 and inspected both scene screenshots. The skill was independently checked structurally and behaviorally forward-tested. Official automated `quick_validate.py` remains unavailable because PyYAML is absent; no YAML dependency was installed and no automated skill-validator PASS is claimed. Initial verifier sandbox browser/connectivity failures preceded successful approved same-scope preview/browser checks. Existing bundle and npm configuration warnings remain.

RDD mode output indicated off before Git-access failure, leaving the effective status unknown; native assessment was unassessable/high. Independent functional checks were used without starting or toggling native review or fabricating approval. User port 4173 remained untouched. Original incoming v1 and approved reference hashes matched prior parent records; no complete prior hashes are retained for prepared/v2 candidates, so their historical byte identity is not claimed. No new raster modification, repository bootstrap or remote operation occurred.

## Retro visual refinement — October 12, 2026

| Check | Observed writer evidence |
|---|---|
| Meaningful HUD RED | Actual system Text HUD was 171×24, monospace at 8px, with duplicate controls. Real browser assertion expected BitmapText and failed on the actual type before implementation. |
| Bitmap HUD GREEN | Actual BitmapText uses original 5×7 binary glyphs in 6×8 cells, font size 6 (RetroFont uses cell width for native size), measured 102×8. Live hit progress and repeated restart/cache reuse passed. No browser-font rasterization or dependency added. |
| Eye correction | Full decoded RGBA comparison found exactly one change: (22,19), (10,19,43,255)→(250,250,250,255). Both loaded eye pixels independently sample (250,250,250,255). All alpha values, dimensions and bbox (4,9,29,32 exclusive) unchanged. |
| Preserved mechanics | Original 14 browser groups retained: grounded alpha contact, 12×18 body at (-6,-8), movement, jumps, landing, projectile pool/TTL, camera/world bounds, blur, restart and responsive canvas. Static ground plus four platform coordinates and dimensions unchanged; only static sprite visibility is replaced by separate native Graphics. |
| Full checks | Typecheck exit 0; Vitest 22/22 tests; build exit 0, 11 modules, JS 1209.68kB / gzip 324.40kB; Edge 155.0.4283.45 browser exit 0, 17 groups, no page/console errors, max 9/12 bullets. |
| Visual inspection | [Ground](retro-ground.png) and [platform](retro-platform.png) inspected: compact crisp HUD, visible gold/turquoise character, continuous walkable edge, discreet masonry and muted layered scenery. Procedural art and static Kipu remain evaluations; human acceptance/core silhouette fit pending. |

Sandbox Edge temporary-profile launch failed; an outside browser could not reach the sandbox-owned preview. A same-scope isolated preview/browser pair on 4175 produced meaningful RED and GREEN. Initial instrumentation typecheck union error and missing RetroFont config fields were corrected before final checks. A 100px HUD test estimate was corrected to the actual 17×6=102px width and its backing panel enlarged to 110px before GREEN. Existing npm configuration and bundle-size warnings remain. User port 4173 untouched; no Git bootstrap, commit, staging, remote operation, gameplay feature or dependency change.

### Independent closure and documentation recovery

The independent verifier observed typecheck/build exit 0, 22/22 tests, and all 17 real-keyboard browser groups passing in Edge 155.0.4283.45 with zero errors. Fresh actual Phaser objects, not only debug snapshot declarations, confirmed BitmapText 102×8 at font size 6/scale 1, fixed at (9,7), atlas 132×8, no system Text objects or duplicated in-canvas controls, five original platform/ground static colliders plus four targets, parallax 0.25/0.65 and stone Graphics at scale 1. Independent PNG comparison confirmed exactly the one approved pixel change, unchanged alpha/dimensions and bbox [4,9,28,31 inclusive], equivalent to [4,9,29,32 exclusive]. Body 12×18 at relative (-6,-8), origin (0.5,0.55), offset (10,14) and zero occupied-pixel separation on floor/platform/left-facing/restart were retained.

The verifier's first two sandbox starts failed; an approved same-scope owned preview/browser pair succeeded. An additional short-tap facing probe failed due to harness timing; sustained input passed. No functional blocker remains. Human art acceptance is distinct, no clean-install check was run and existing npm/chunk warnings remain. Parent typecheck exited 0 and both screenshots were reviewed. Dist was rebuilt; user port 4173 remained untouched.

A writer documentation encoding error truncated this verification file before delivery. Historical sections were recovered by the prior documentation worker from complete retained sections and a final closure append, with an explicit recovery note and normalized whitespace; this is not a claim of original byte identity. The restored checkpoint was SHA256 4C1F8A3CBBF0D2A99D0EBF1099CBFD2CF9CD1AE78B030924F8500472074B9AD3 (18003 bytes). This retro addition was fully UTF-8 encoded before a validated temporary sibling write; the restored historical byte prefix was checked unchanged before replacement and after readback. No historical section was rewritten by this closure. Parent full task mirror remains pending at documentation handoff.

## Phase 3 local demo — writer evidence (October 12, 2026)

Approved local scope is now map → four training targets → one-phase Amaru → victory/defeat/retry with real PachaShift. Event timing is user-reported, not independently verified; email evidence is waived for this local work. No submission, remote transfer or initial Git history is authorized.

### Observed functional checks

- Valid pure-rule RED against callable stubs: 7 assertion failures and 22 existing passes (not import failures). Final GREEN: 33/33 deterministic tests across 5 files.
- Final typecheck and production build exited 0 in this checkout. Existing npm configuration and large-bundle warnings remain.
- Edge 155.0.4283.45: full real-keyboard smoke suite passed all 19 groups with zero browser errors in BOTH Canvas and WebGL against an owned isolated local preview on port 4175. The user's 4173 server was untouched; owned preview processes were stopped.
- Prior route coverage retained: actual loaded eyes/alpha grounding, body/frame invariants, movement/opposition/release, three jump bindings/no double or held jump, platform landing, directional shots and bounded pool/TTL, wider-world camera/bounds, blur, repeated restart and responsive containment.
- Real flow observed: locked guardian stays on map; four target hits complete training/unlock map; Guardian shows both telegraphed patterns; X captures actual incoming energy; returned bolts reduce actual guardian HP by three each once; regular shots win; stationary play loses; both results clear harmful pools; R retries and M returns to session-progress map. Ordinary no-debug launch remains without a debug getter.
- Blur freezes the owned combat clock and physics during X. Rendered Nokia screenshot RGB membership is exactly {(15,56,15),(48,98,48),(139,172,15),(155,188,15)}. Native images/variant conversion preserve alpha and frame geometry; Kipu remains 32×40 with body 12×18 at relative (-6,-8).

### Evidence-backed fixes and harness limitations

The initial sandbox Edge launch could not create its temporary profile; an approved combined same-scope preview/browser pair succeeded. An initial WebGL pixel probe read the cleared drawing buffer, so actual rendered PNG pixels are inspected instead. Screenshot overhead could outlive the two-second effect; the test now pauses via the real blur listener before capture (not a debug setter). A slow automation single-shot hold fired twice; a bounded 60ms real key press preserves the exact-one-target assertion.

Live combat exposed Phaser's group/single-sprite overlap callback argument reversal. The corrected callbacks identify the actual pool member from both arguments; otherwise the initial code disabled the boss/player instead of the projectile. Restart exposed already-destroyed Phaser groups being cleared again in a later shutdown listener; Phaser-owned group/graphics teardown is now respected, with owned window listeners/debug bindings explicitly removed.

Canvas correctly caught extra blended colors from one-pixel stroke antialiasing, fixed with filled integer-pixel borders and pixel-sampled lines. Canvas BitmapText ignores tint in the installed renderer; a once-cached native green atlas now supplies Nokia HUD pixels. Both fixes passed the exact palette assertion rather than weakening it. Pillow emits an informational getdata deprecation warning.

### Assets and remaining acceptance

Native head 64×64 binary alpha {0,255}; native arena 320×180 opaque alpha {255}; reference copy byte-identical to incoming PNG. Source originals/Kipu assets remain untouched. Exact built-in generation/edit prompts and preparation are in [PHASE3_ASSETS.md](PHASE3_ASSETS.md). Static demo evaluations, not animation spritesheets or polished final art.

Writer visually inspected [map](phase3-map.png), [arena](phase3-arena.png), [Nokia with energy](phase3-nokia.png) and [victory](phase3-victory.png). Independent verification and human art/game-feel acceptance remain pending; no clean install or manual OS-focus sweep was run. No dependency changes, staging, commits, branch bootstrap, publication or remote work occurred. Native review status/assessment was unavailable; this is not a native approval.

### Phase 3 independent and parent closure

Phase 3 functional verification is complete. The independent verifier observed typecheck/test/build exit 0, 33/33 deterministic tests across five files, and 19/19 real-keyboard browser groups independently in both actual WebGL and actual Canvas on Edge 155.0.4283.45. The verification context asserted the active renderer rather than inferring it from a URL.

The observed loop covered locked map selection → four training targets → completion/unlock → guardian → actual capture/return → victory, plus defeat/retry/map cleanup. Each returned projectile caused three HP damage once. Actual Nokia PNG pixels were exactly #0f380f, #306230, #8bac0f and #9bbc0f. Blur froze combat clock/physics; focus resumed them. Existing training regressions passed. Source inspection confirmed active-projectile single consumption, guarded overlaps, bounded capture/pools, cooldown/outcome/shutdown handling and copied read-only debug state, with no severe finding.

The verifier's sandbox Edge profile attempt failed; the approved same-scope owned preview/browser pair passed. An in-memory harness CommonJS import attempt failed, then its corrected ESM entry passed without repository edits. Four independent screenshots were redirected outside the repository. Historical documentation/source-art hashes were unchanged by verification. Owned 4174/4175 previews were stopped; the user's 4173 server remained untouched. Parent spot check: typecheck exit 0 and all four repository screenshots visually reviewed.

Existing bundle-size/npm configuration/Pillow deprecation warnings remain. No clean install, human game-feel/art approval or wider-device/manual OS-focus sweep was performed. This is functional proof, not native review approval or competition eligibility. Preselection before October 14 with winners shown later remains user-reported, not independently verified official rules; email evidence is waived only for the approved local build.

Phase 4 local release/manual QA remains proposed. No Git history bootstrap, staging, remote publication or submission is authorized. Full tracker/Engram mirror synchronization remains parent-owned and pending at this documentation handoff.

## October 12, 2026 — Amaru direct-access correction (writer evidence)

This append preserves all preceding historical bytes. Current demo availability supersedes earlier training-unlock expectations; earned training/guardian flags remain genuine. Details and before/after limits: [access audit](audit-amaru/report.md).

- RED: focused availability test observed false vs expected true before implementation.
- Final `npm.cmd run typecheck`: exit 0. Final `npm.cmd test`: 35/35 tests across six files, exit 0 (scoped escalated local execution after restricted temporary transform-cache ENOENT).
- Final `npm.cmd run build`: exit 0; large minified bundle warning remains (approximately 1.229 MB). Existing npm configuration warning remains.
- Owned production preview on 4174: final `npm.cmd run test:browser` passed 21 groups each in asserted actual Canvas and WebGL, Edge 155.0.4283.45, zero page/console errors. Direct Enter/1/2/buttons, native DOM Enter/Space and Tab-focus pause/refocus, truthful achievements, contextual copy, refresh, repeated scenes, actual existing assets and 470px overflow checks supplement all retained movement/grounding/pool/combat/Nokia regressions. Scoped local escalation was required for restricted Edge launch/connectivity.
- Intermediate NodeList iteration typecheck failure and browser-test closure failure were fixed; platform landing input now stops above the platform to avoid timing-dependent overshoot without modifying movement or collision. Two restricted Vitest cache runs failed before final successful execution. Pillow getdata deprecation warning remains.
- Owned 4174 preview stopped; user 4173 preview untouched. No clean install, new dependency/assets, combat tuning, Git operation or remote delivery. Native review remains unavailable with unborn history.
- Pending: independent verification, parent actual in-app-browser post-fix captures, full accessibility/OS-focus/device coverage and human visual/game-feel acceptance. ACCESS-4 intentionally remains open.


## Amaru access correction — final independent and IAB evidence, October 12, 2026

Independent typecheck/build exit 0; 35/35 unit tests; actual Canvas/WebGL original runner 21 groups each, zero successful-run browser errors. Additional airborne navigation physics and guardian clock/HP/projectile pause checks passed. One concurrent Canvas run failed exact hit count (2 vs 1 at tests/browser-smoke.mjs:224); final serial rerun passed, cause unproven. Restricted cache/browser/preview failures required scoped local execution; known warnings remain.

Parent ordinary4173 IAB reload observed fresh direct boss button/defaultEnter, nativeSpace route and nativeEnter boss switching, applied existing route backdrop and actual X Nokia view. Captures docs/audit-amaru/11-after-choice through16-final-amaru saved and inspected; current708px viewport, automated470px separately verified. Error/warning logs empty. Final boss paused on native Retry focus, HP3. Parent typecheck spot check exit0. Scoped ACCESS-4 complete, human polish/performance/native review/clean install not certified. User4173 process untouched; owned verification previews stopped. No Git/bootstrap or remote delivery.


## Animation and feedback polish, October 12, 2026

User approved visual animation and feedback polish with existing art (see `odd/tasks/animation-polish.md`). Audio, new regions, saves and new mechanics were not added.

Observed in this checkout, parent run: `npm.cmd run typecheck` exit 0; `npm.cmd test` 58/58 across 8 files (23 new: pose selection, row reshape, bounded particle pool, boss rotation ranges, Nokia color mapping, animator landing/takeoff/run dust, derived-frame identity); `npm.cmd run build` exit 0 with the known large-bundle warning; `test:browser` against owned preview 4175, run serially: actual WebGL passed all 22 groups and actual Canvas passed all 22 groups. The exact four-green Nokia pixel check still passed with particles, derived Kipu frames and the Amaru hit-flash silhouette on screen. Parent in-app-browser captures of map cursor, Amaru anticipation rear-back with mouth charge, and Kipu mid-jump dust were inspected.

RED/GREEN: `tests/animation.test.ts` failed on the missing module (RED), then passed 16/16. `tests/kipuAnimator.test.ts` was written after its implementation, so no RED was observed for it; its 7 tests pass.

One deliberate test change: `checkKipu` no longer requires the texture key to equal `kipu-evaluation`; it requires one of the four derived frames (same 32x40 size). Dimensions, 12x18 body, offset, flip and occupied-alpha grounding assertions are unchanged, and a new group asserts the idle, bob, squash and stretch frames each render while those invariants hold.

Limits: derived frames are row edits of the preserved art, not a hand-drawn spritesheet. Amaru animates by rotation, flash and effects on the static head, not an articulated boss. Camera shake and particle timing are tuned by inspection only; human game-feel acceptance is still pending. No clean install, wider device coverage, Git history or remote delivery was performed. User preview 4173 untouched; owned 4175 preview stopped after verification.


## Synthesized sound effects, October 12, 2026

User approved WebAudio effects. All 16 effects are generated at runtime from oscillators and filtered noise (`src/game/sfx.ts`); there are no audio files, samples or third-party material, so no licenses or credits are required. Master gain 0.16, 12-voice cap, 50 ms per-effect rate limit, context created lazily from input, suspended on focus loss, session-only mute button.

Observed in this checkout: typecheck exit 0; unit tests passed including 7 new sfx tests and the animator event test; build exit 0; `test:browser` serial on owned port 4175 passed in WebGL and in Canvas, including a new group that asserts effects fire from real input, the mute button silences them and focus returns to the game. Tests were written before `sfx.ts` but not executed before implementing, so no RED is claimed.

Limits: automation proves that sounds are scheduled and gated, not how they sound. Loudness, pitch and taste need a human listening pass. No music. Real output-device behavior across browsers and OSes is untested.


## Reduced motion and polish pass, October 12, 2026

Added: reduce-motion option (OS `prefers-reduced-motion` initialises it; page button overrides; gates shake, flicker, sway, particles, squash/stretch and button transitions, never gameplay telegraphs); once-per-session typed title and breathing Kipu on the map; victory panel with time, remaining HP and session best; button press feedback with named-property transitions. Principles were read from Emil Kowalski's and Hallmark's `SKILL.md` files without installing anything (see `skills/pachabyte-gameplay-quality/references/ui-motion-principles.md`). Hit-stop was deliberately not added because it would alter the owned combat clock.

Observed: typecheck exit 0; 71/71 unit tests (5 new motion tests, RED observed on the missing module first); build exit 0; browser smoke passed in WebGL and Canvas, including a new reduced-motion group and a victory-stats assertion; the relative Vite base was also verified by serving the build under a `/pachabyte/` subpath and running the full smoke against it.

Retained failures: during this pass four serial smoke runs failed intermittently (WebGL: "airborne repress must not reset jump velocity" at the `w` jump binding; Canvas: waitForFunction timeouts at three different stages). They coincided with about 49% machine CPU load and an idle game tab still running in the in-app browser; a 12-iteration jump loop reproduced 0 misses in each renderer, and after the tab was released and load fell to about 13%, Canvas passed twice and WebGL passed twice. Cause is plausible (wall-clock timing between Playwright round trips under CPU load) but not proven; the assertions were not weakened. Same class as the earlier single-hit flake.


## Ruta 01 flight MVP — F3 independent verification, October 13, 2026

Scope: independent check of F1 (route, commit 91dec77) and F2 (Amaru-01 and REVERSE, commit cc4c43d), with a rewritten browser smoke. Only results observed in this checkout are listed.

### Commands

| Command | Observed result |
|---|---|
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd test` | 151/151 tests, 16 files |
| `npm.cmd run build` | exit 0; known large-chunk and npm `minimum-release-age` warnings |
| `test:browser` WebGL run 1 (owned preview 4177) | passed, 12 groups; fight won on attempt 1 |
| `test:browser` Canvas run 1 | passed, 12 groups; fight lost once (boss HP 7, phase 3), won on attempt 2 |
| `test:browser` WebGL run 2 | passed, 12 groups; fight lost once (boss HP 35, phase 2), won on attempt 2 |
| `test:browser` Canvas run 2 | passed, 12 groups; fight lost once (boss HP 51, phase 2), won on attempt 2 |

Runs were serial against `vite preview --port 4177`, Edge 155.0.4283.45, renderer asserted from the live canvas context. Every run reported zero page or console errors. The Pillow `getdata` deprecation warning remains.

### What the smoke now covers

Real keyboard and pointer input only; `pachaDebug` is read, never written. Timing checks use in-page `requestAnimationFrame` samplers.

1. Map: `lang="es"`, Spanish copy, corrupted node on a fresh session, six DOM buttons with native Enter/Space activation returning focus to the game.
2. Route: no gravity, 8 directions at 110 px/s with normalized diagonals, top/bottom/left/right clamps, Esc and focus-loss freeze of clock/anim/camera, Glitchling wounded then destroyed (+10 meter per hit, +75), fragment (+100, +20), Firewall contact damage and blocked shots, Marea advance and contact damage, silent threshold line, transition carrying hp/score/fragments/meter (observed hp 2, score 2700, fragments 12, meter 100 in all four runs).
3. REVERSE: READY only at meter 100, Shift/K/X rejected while charging, SLOW at 800–806 ms of real clock with world scale exactly 0.2, captures within reach and never harmful, at most 6, shield drops only with returned bolts, rhombus capturable and orb not.
4. Exact four-green frame: the first SLOW frame frozen through the blur handler; PIL found only the four Nokia colors in every run.
5. Phases 1→2→3 by HP, core-awakening message, victory, liberation order (recede, restore, two dialogue lines, codex, result), score breakdown adds up, Enter to a restored map node; defeat shows "KIPU SE DESCONECTA" and R resets the fight.
6. Reduced motion (OS preference and toggle): no particles, sway, tilt or Kipu frames while telegraphs remain.
7. Sound toggle mutes and unmutes and returns focus. 8. 16:9 canvas without overflow at 1000, 600 and 470 px. 9. Debug only with `?debug=1`.

Read-only snapshot fields were added for the test (route shot and fragment positions, boss angle, bolt texture, head overlay alpha). No gameplay code changed.

### Review findings (not fixed)

- Canvas renderer ignores BitmapText tint: map labels, route caption and HUD text render white in Canvas (observed in the Canvas `docs/ruta01-map.png`). Visual only.
- Clicking the page background moves focus to `body` but the game keeps running and still reads the keyboard (probe: `focused: true`, clock advancing, `velocityY 110`). Only Tab/button focus and window blur pause it.
- `RouteScene` uses an uncapped frame delta while `GuardianScene` caps it at 100 ms; a long stall can let a Firewall pass Kipu without a contact frame.
- Direct entry to Amaru counts route time as 0, so its time bonus is larger than a full run's (score formula is provisional).

### Limits

The scripted pilot lost its first fight in three of four runs before winning; this proves the fight is winnable by keyboard, not that its balance is right. Screenshots `docs/ruta01-*.png` were last written by Canvas run 2. No human playtest, clean install, other browsers or devices, or remote deployment was performed. User preview 4173 untouched; owned 4177 preview stopped.
