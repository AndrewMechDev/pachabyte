# Final validation plan

This is the checklist for the final verification phase in `C:\Users\dark_\Documents\hack-the-andes-game`. It is not a test report. Every check below remains pending until executed here and recorded in `VERIFICATION.md`.

## Stage 1 — transfer integrity (current phase)

- [ ] Compare SHA-256 hashes for every copied source/config/test/document file against the original Sprint 0 source.
- [ ] Confirm no `node_modules`, `dist`, scratch logs, or stale task tracker was copied; preserve this destination's own task tracker.
- [ ] Read back the docs, confirm links and commands point to this canonical project, and distinguish historical evidence from current results.
- [ ] Do not run install, tests, build, server, or browser during this planning/copy stage.

## Stage 2 — reproducible install and deterministic checks (final gate)

From the project root, in PowerShell:

```powershell
node.exe --version
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Record command, exit status, observed summary, Node/npm versions, warnings, and environment limits. `npm ci` uses the lockfile and registry access; do not claim clean install if it did not run.

## Stage 3 — actual served game checks (final gate)

1. Start the production preview with `npm.cmd run preview`.
2. Open `http://127.0.0.1:4173/` and confirm the game renders; do not open built files using `file://`.
3. With preview still running, use a second PowerShell window to run `npm.cmd run test:browser` with the documented installed browser.
4. Observe console/page failures and record whether the browser was available. A browser-runner startup failure is unavailable evidence, not a pass.
5. Manually play the route and note subjective movement/jump/fire feedback separately from automated assertions.

## Acceptance checklist

- [ ] 320 × 180 logical view scales proportionally and remains in the viewport.
- [ ] Left/right movement, facing, key release, jump-on-press, gravity, and platform landing behave correctly.
- [ ] Directional fire creates bounded projectiles; collision removes targets and updates the HUD.
- [ ] Camera follows the player; HUD stays fixed; right bound and restart are correct.
- [ ] README setup/controls correspond to current scripts and observed behavior.
- [ ] Production build serves correctly; record the known large-bundle warning if it remains.
- [ ] No claim that provisional art is a spritesheet, nor claim that deferred features exist.
- [ ] Hack the Andes acceptance/track/prior-work rules are confirmed before challenge-specific work; this is an eligibility gate, not a software test.

## After changes

For behavior changes, apply the test-first workflow when a relevant deterministic test has clear expected behavior: observe meaningful RED, implement GREEN, then refactor while tests remain green. Docs-only or genuinely non-testable edits should use proportionate structural verification and explain the exception. Re-run applicable final checks after the last source change; old results do not transfer to changed bytes.

## Phase 3 acceptance extension

Retain all training checks after map entry. Exercise locked guardian → four actual shots → completion/unlock → guardian through real keyboard input. Verify two attacks, HP/invulnerability, capture capacity/single consumption/real returned damage, rendered four-green palette, alpha/body invariants, focus-clock pause, victory/defeat/retry and terminal cleanup. Capture map/color/Nokia-with-energy/victory. Read-only debug only, no gameplay setters. Refresh resets session progress.

## Phase 3 observed closure

Writer and independent verifier observed 33/33 unit tests, typecheck/build exit 0, and 19/19 real-keyboard browser groups in both actual Canvas and WebGL. Exact four-green Nokia rendering, returned damage, complete challenge outcomes and retained training regressions passed. Parent typecheck and screenshot checks passed. See [verification](VERIFICATION.md) for evidence and retained limitations.

Human visual/game-feel acceptance remains pending. Phase 4 local release/manual QA is proposed; no clean install, wider-device/OS-focus coverage, native approval, official eligibility verification, Git bootstrap or remote delivery is implied.

## October 12, 2026 — access correction acceptance

Earlier transfer and gated-loop sections are historical scope. For the current local demo verify fresh default Enter, direct keys 1/2, both visible buttons, native Tab/Enter/Space activation, contextual help/results, true achievement flags and repeated scene switching. Moving focus to navigation must pause physics/clocks and clear held inputs; refocusing the game resumes safely. Refresh resets achievements, not availability.

Check the actual existing Amaru/head assets and muted aspect-preserving route parallax, while retaining grounding, movement, projectile pools, HP, capture/return, cooldown, outcomes, retry and exact Nokia greens. Test real Canvas and WebGL plus no horizontal overflow at 470px. Use an owned free preview port; never stop the user's 4173 preview. Final parent in-app-browser screenshots and human visual/game-feel acceptance remain distinct from automation.
