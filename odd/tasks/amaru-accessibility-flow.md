# Amaru Demo Access and View Clarity

## Objective and authorization
User requested a live audit and fixes because Amaru/new environments were not visible and the header/control instructions were confusing. Change local demo navigation so Amaru is directly reachable, while retaining optional Arequipa gameplay, session completion and all combat/physics behavior.

## Current-run audit evidence
Captured the user's actual in-app browser at `http://127.0.0.1:4173/`, narrow 470px view. Evidence lives in `docs/audit-amaru/`:
- 01 current map, 02 Amaru selection, 03 Enter blocked, 04 route-only procedural scenery.
- 05–08 real keyboard target progress and completion; 09 map return; 10 Amaru and generated arena actually visible after the old gate.
- No console errors/warnings were observed. Assets are not missing; access and static copy hide them.
Source confirms gates in both MapScene and GuardianScene, default training selection, number keys selecting only, session reset on refresh and identical header/footer across views.

## Accepted correction
- Initial choice favors Amaru; visible semantic `Play Amaru` and `Explore Arequipa` buttons enter correct scenes in one click. Both views remain available on a fresh session/refresh, without falsely completing training.
- Remove both demo gates. Keep actual completion achievement flags meaningful; four targets and guardian victory still set their own statuses.
- Default Enter and direct map hotkey 2 enter Amaru; 1 enters the optional route. Clearly label names, active view and outcomes. Remove obsolete unlock/selection-combo copy.
- Header/help/actions derive from typed current-view events, not debug polling. Keep the Phaser instance private; no test-only navigation or progress setter.
- DOM buttons work with Tab/Enter/Space without Phaser stealing their activation. Scene changes stop the previous scene, clear held keys, focus the game and clean up listeners. Focusing page navigation pauses combat clocks/physics rather than allowing unseen damage.
- Show prepared Amaru/arena assets in the choice UI and both relevant environments. Reuse the existing arena image as the route's low-contrast parallax backdrop, preserving native aspect ratio and terrain/collider layout; no new art required.
- Preserve English technical/UI copy matching the existing project, with concise proper view names and contextual instructions; no full-page redesign, new mechanics, balance changes, dependency, backend or persistent save.

## Tasks and route
- [x] ACCESS-1: Live screenshot audit and source-backed root cause. Delegated read-only mapping + parent IAB capture; detailed report saved in docs/audit-amaru/report.md.
- [x] ACCESS-2: Meaningful RED for fresh-session direct access and UI activation; implement direct entry, event bridge and focus-safe navigation. Delegated direct: multi-file behavior change.
- [x] ACCESS-3: Contextual page/map names and controls, existing asset previews and shared route backdrop; preserve mechanics and responsive layout. Delegated direct: visual/navigation integration.
- [x] ACCESS-4: Full unit/type/build, Canvas/WebGL regression, independent checks and parent live IAB post-fix audit. Save before/after report and screenshots; mark only observed results complete.

## Verification
Retain existing movement/jump/HP/capture/return/palette/pool/blur/retry assertions. Replace old locked-access expectations deliberately with current user-approved availability semantics, not weaken mechanics. Assert fresh direct button/default Enter/hotkey entry, unchanged completion flags, route/boss/menu switching, current header/help, keyboard button activation, focus pause/resume, actual asset presence and no horizontal overflow at 470px. Run typecheck, tests, build and browser smoke in both real Canvas/WebGL; parent additionally exercises the same user IAB ordinary no-debug URL after rebuild.

## Boundaries and next step
Forecast approximately 400–600 authored lines, advisory only; no commit/PR until separately authorized initial history. No Git/bootstrap, publishing or external transfers. Use explicit UTF-8 and staged append/prefix guards for historical docs. Existing user 4173 server remains untouched. After observed fixes, leave the actual Amaru view available to the user and report audit limits without claiming full WCAG or human game-feel approval.

## Writer evidence — October 12, 2026

- ACCESS-2/3 implemented locally: fresh default Enter/direct 2 and semantic Play Amaru, optional direct 1/Explore Arequipa, truthful completion flags, typed view/focus events, contextual titles/help/results, native navigation keyboard activation and focus-safe paused clocks/physics. Existing artwork previews and muted native-aspect route parallax replace the old procedural backdrop; collider/terrain and combat tuning unchanged.
- RED: `npm.cmd test -- tests/challengeRules.test.ts` observed expected true vs actual false for fresh guardian availability, before implementation. GREEN: final `npm.cmd test` outside sandbox passed 35/35 tests across 6 files; typecheck and build exit 0. Known npm configuration and large bundle warnings remain.
- Final real Canvas run against owned preview 4174 passed 21 groups, including direct entry, DOM Enter/Space, nav focus clock/HP/position freeze, unchanged gameplay/grounding/pools, exact four-green Nokia, outcomes and responsive 470px. Final actual WebGL also passed the same 21 groups; the runner asserted the renderer. Parent live post-fix audit remains pending.
- Intermediate failures retained: initial typecheck NodeList iterator mismatch corrected using Array.from; browser-test closure argument fixed; timing-sensitive platform landing input stabilized by releasing movement above platform, not changing physics. Sandbox Edge launch/connect and Vitest temporary transform-cache failures were environmental; scoped escalated local checks resolve them.
- No commit identity: initial history and Git delivery are explicitly not authorized. ACCESS-4 remains open for independent checks and parent live user-browser audit. User preview 4173 untouched.

## Final independent and user-browser evidence — October 12, 2026

- Independent typecheck/build exited 0, unit tests 35/35, actual Canvas and WebGL 21 browser groups each. Supplementary airborne navigation pause checked both coordinates, guardian clock/HP/projectile freeze and native Enter/Space activation. No confirmed functional defect; successful runs had zero browser errors.
- Retained failure: one concurrent Canvas execution reported 2 hits instead of 1 at tests/browser-smoke.mjs:224. Final serial original-command rerun passed; timing sensitivity is plausible, not established causality. Restricted test/cache/browser/preview failures required scoped local execution. No native review approval, clean install or human game-feel acceptance claimed.
- Parent reloaded the actual ordinary user URL http://127.0.0.1:4173/ and directly entered Amaru with a button and default Enter, switched to the route using click and native Space, returned to boss using native Enter, activated actual green Nokia view with X and observed no error/warning logs. Screenshots 11-after-choice through 16-final-amaru saved and inspected. Current browser width was 708px; automated narrow 470px proof remains separate.
- Final user browser left on Amaru, full HP, paused by native Retry focus; click the game to resume. Assets are static demo art, not the complete articulated boss or production spritesheets.
- Parent typecheck spot check exited 0. ACCESS-4 closes scoped access/visibility checks only; native review is unavailable, initial Git history remains unauthorized and broader performance/art polish remains pending.