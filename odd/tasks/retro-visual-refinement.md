# Retro Visual Refinement

## Objective and authorization
The user explicitly approved four visual adjustments: stone/sillar terrain and matching platforms, a compact crisp bitmap HUD, restoration of Kipu's missing eye glint without regenerating the character, and improved background identity/depth. Keep the game playable and preserve all mechanics.

## Scope and acceptance
- Enhance existing editable code-native procedural scenery, not claim final production art or require new generated assets.
- Render sparse stone/gravel details at native pixel spacing without stretching them. Preserve actual ground/platform collision geometry and clearly distinguish decorative roofs.
- Use a real code-generated bitmap glyph atlas rather than rasterized system-font text. Show actual target progress in one compact line; keep existing outside-canvas controls.
- Create `assets/prepared/kipu-v4-32x40.png` from v3 with only pixel (22,19) changed to RGBA (250,250,250,255). Keep v3 and all earlier images intact. Alpha bounds and visible-ground alignment must be identical.
- Preserve scene 320×180, world 960, body 12×18 relative (-6,-8), origin (.5,.55), offset (10,14), platform layout, controls, camera, firing and restart.
- No boss, damage, end-state logic, audio, backend, remote operation or Git bootstrap.

## Tasks and route
- [x] VIS-1: Observe meaningful browser RED for current system Text HUD; implement compact native-scale bitmap glyphs and tests. Delegated direct: new rendering module and browser integration.
- [x] VIS-2: Restore exactly one eye pixel in a versioned asset and prove pixel/alpha invariants. Delegated direct: explicitly approved deterministic correction.
- [x] VIS-3: Improve stone terrain/platform presentation and subdued layered environment while preserving all colliders. Delegated direct: native canvas visual work.
- [x] VIS-4: Run full checks, independent verification and inspect ground/platform screenshots; update art/roadmap/verification records.

## Verification
Run typecheck, deterministic tests, build and real-keyboard browser smoke against an owned free-port preview. Observe meaningful HUD RED before source implementation and GREEN afterward. Verify font native scale/coverage/cache restart, exact one-pixel RGBA difference, unchanged 0px visible-ground gap and original collider bounds. Inspect native scene screenshots at ground and platform. Leave user's 4173 server alone; stop only owned processes.

## Work boundaries
Forecast roughly 300–380 authored lines, generated PNGs/screenshots excluded; advisory only. Git is unborn with all project files untracked: do not create initial history or mass-stage. Native mode/risk checks are read-only; unavailable assessment requires independent functional verification, never fabricated native approval.

## Progress and next step
Read-only scope exploration complete. Deliver the four approved visual changes, then propose the smallest complete target challenge/end-state separately; do not let polish absorb the remaining project time.

## Writer handoff

VIS-1–3 implemented and observed. VIS-4 writer checks complete: typecheck/build exit 0; 22/22 deterministic tests; 17 browser groups in Edge 155.0.4283.45; ground/platform captures inspected. Meaningful HUD RED observed actual Text instead of BitmapText before implementation. Native atlas now measures 102×8 at font size 6; progress/restart pass. Full v3/v4 pixel diff is exactly (22,19), with alpha/bbox unchanged. Runtime independently samples both glints. Existing core mechanics and collider layout unchanged.

Independent verifier observed typecheck/build exit 0, 22/22 unit tests and 17 browser groups with zero errors; actual Phaser objects, atlas, colliders, parallax and independent decoded PNG invariants checked. Parent typecheck and screenshot spot checks passed; VIS-4 is complete. No work-unit commit: explicit unborn-repository bootstrap restriction overrides ordinary ODD commit closure. No Git metadata writes, publishing or native review. Existing npm/bundle warnings remain. A documentation encoding failure truncated VERIFICATION.md; prior documentation worker recovered complete historical sections with normalized whitespace and an explicit recovery note (not original byte identity). The recovered checkpoint byte prefix was preserved unchanged during the safely staged UTF-8 retro append. Parent full task mirror is synchronized in Engram under `odd/retro-visual-refinement/tasks`. Next bounded feature is a separately approved target challenge/end-state.
