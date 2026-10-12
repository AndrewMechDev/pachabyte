# PachaByte art reference

The approved [Kipu concept sheet](../assets/references/kipu-approved-concept.png) is the visual source of truth for Kipu's current identity. It records appearance, not implementation-ready art requirements.

## Approved visual canon

Use the sheet as the guide for Kipu's recognizable appearance:

- A compact, rounded turquoise body with a friendly face and large dark eyes.
- Two curved antennae topped with glowing gold-orange forms.
- Gold geometric ornaments, including a centered diamond-shaped chest emblem.
- A flowing turquoise-and-gold patterned scarf or ribbon that contributes to the silhouette.
- A warm gold, orange, and turquoise accent palette against the turquoise body.

The sheet shows front, side, and back views plus a detail inset. Keep those views consistent when producing future art. Do not infer additional lore, cultural meaning, or unshown poses from the image.

## Concept art is not a game asset

This image is an illustrative concept sheet, not a spritesheet: it has no frame grid, per-frame dimensions, transparent production background, animation sequence, or export specification. Do not slice it into frames or integrate it as game-ready art.

The current procedural Kipu placeholder is 16×20 logical pixels. That is only the placeholder's size, not a production-art limit. Animation states, frame counts, pivots, and final runtime specifications remain undecided; a prepared candidate must be evaluated before integration.

## Flexible source-to-runtime standard

Accept useful source art at a larger resolution. A source PNG does not need to match the final runtime size, and a larger static image can be suitable for preparation without being a ready animation sheet. Preserve the original and prepare separately named candidates; do not reject a source solely because its dimensions differ from a placeholder.

Keep these four specifications independent:

| Specification | Meaning and check |
|---|---|
| Source raster resolution | The original file's pixel dimensions. Enough detail for adaptation is useful, but high resolution alone does not establish pixel-art quality. |
| Uniform runtime frame grid | The prepared animation sheet's cell dimensions and alignment. Frames in a sheet need a consistent grid and pivot; different assets do not need one universal cell size. A static PNG has no animation grid. |
| Displayed logical size | The character's footprint in the 320×180 gameplay scene. Evaluate silhouette, face, scenery contrast, and space for movement at this size. It need not equal source resolution. |
| Physics hitbox | The collision body used by gameplay. It is specified and checked separately from decorative antennae, scarf, and visual bounds; resizing art does not automatically authorize resizing the body. |

### Initial Kipu evaluation target

Use **32×40 logical pixels** as the initial target for comparing a prepared Kipu candidate with the current prototype. This is not a verified final in-game fit, mandatory universal asset size, or approval to change the collider. Compare against the scene before selecting the final display size or integrating art. The approved visual identity must survive simplification, but not every source detail can survive reduction.

### Retro quality and acceptance

Retro character comes from a coherent palette, recognizable silhouette, intentional pixel clusters, and crisp scaling—not from minimizing dimensions. Prefer nearest-neighbor scaling and integer display scaling where feasible; inspect the actual displayed result for uneven or blurred pixels.

1. Preserve the original source and prepare a separate candidate using focused simplification or adaptation when needed.
2. Check transparency, clean edges, complete silhouette, orientation, and any declared frame grid/pivots.
3. Compare at native gameplay size against the existing scene: Kipu should remain recognizable without obscuring targets, platforms, or movement space.
4. Record the selected visual specifications and remaining mismatches before integration; request regeneration only when adaptation cannot reasonably meet the intended appearance.

These art-preparation rules do not approve deferred features, production integration, physics changes, or competition eligibility.

## Related sources

- [Game Design Document](GDD.md) — approved gameplay and visual baseline.
- [Shared production workflow](SHARED_WORKFLOW.md) — asset request, review, and handoff process.

## Active static evaluation — October 12, 2026

`assets/prepared/kipu-v4-32x40.png` is the current playable static candidate, derived from the preserved `assets/incoming/kipu-v1.png` (1122×1402). This integration was authorized as Phase 1, not approved as final production art.

Preparation uses deterministic nearest-neighbor sampling into a native 32×40 frame, then an alpha threshold of 128 for crisp binary transparency (1019 transparent pixels, 261 opaque pixels). Incoming source and earlier candidates remain intact. This is adaptation, not an AI redesign or animation sheet.

Runtime uses scale 1, a separate `kipu-evaluation` key, origin (0.5, 0.55), and the existing 12×18 body with offset (10,14). Observed body position remains (-6,-8) relative to the player, matching the old placeholder. Decorations need not collide; mathematical footprint preservation does not prove the core silhouette is perfectly aligned.

The inspected gameplay screenshot retains the antennae, turquoise face and gold scarf; no clipping is visible at the captured spawn. Original transparent margins reduce the occupied silhouette below the nominal frame size. Grounding now uses the occupied alpha bottom (row 32 exclusive) rather than the frame edge: display origin Y 22 aligns the lowest scarf pixels with body bottom player.y+10. Browser checks independently sampled the loaded image and verified exactly zero logical pixels of separation on floor, left-facing floor, restart and first platform landing. Core silhouette/collider correspondence, human readability acceptance and animation remain pending; no collider position, size or tuning changes were made.

Writer and independent verifier both observed grounded lowest-scarf contact while retaining the original physics footprint; parent screenshots were read back. This does not establish human visual acceptance or a final core-silhouette hitbox. The source resolution/display standard remains flexible, not a universal frame-size rule.

## Approved retro refinement — October 12, 2026

The v4 correction restores the missing left eye glint at zero-based pixel (22,19), changing only RGBA (10,19,43,255) to (250,250,250,255). A full pixel comparison found exactly one changed pixel. The existing right eye glint (26,20), 32×40 dimensions, all alpha values and occupied bounds (4,9)–(29,32 exclusive) are unchanged. V3, incoming v1 and approved concept remain preserved; no AI redraw occurred.

Walkable surfaces now use sparse sillar-inspired seams and gravel at fixed native spacing, a continuous warm top edge and dark underside. Separate Graphics follow the unchanged static collision rectangles, rather than stretching a tiled texture. The layered mountains, foothills and subdued arched buildings remain provisional original procedural art, not final environment assets. A compact original 5×7 glyph atlas in 6×8 cells renders the HUD at native 1× scale; outside-canvas controls remain unchanged.

[Ground](retro-ground.png) and [platform](retro-platform.png) captures show the approved visual direction. Writer and independent checks passed; parent reviewed both screenshots. Human visual acceptance remains separate.

## Phase 3 static evaluation assets

Original Amaru head and arena backdrop are approved local evaluations. Preserve source originals and reference. Head display 64×64 / forgiving body 32×44; backdrop 320×180; Kipu remains 32×40 / 12×18. Cached four-green variants preserve alpha. See [original prompts and preparation](PHASE3_ASSETS.md). Human visual acceptance pending.

## Phase 3 verification versus visual approval

Writer and independent verifier observed 33/33 unit tests, typecheck/build exit 0, and 19/19 real-keyboard browser groups in both actual Canvas and WebGL. Exact four-green Nokia rendering, returned damage, complete challenge outcomes and retained training regressions passed. Parent typecheck and screenshot checks passed. See [verification](VERIFICATION.md) for evidence and retained limitations.

Human visual/game-feel acceptance remains pending. Phase 4 local release/manual QA is proposed; no clean install, wider-device/OS-focus coverage, native approval, official eligibility verification, Git bootstrap or remote delivery is implied.


## Animation polish: approved visual scope, October 12, 2026

Animation is generated from existing assets; no new image generation was requested.

| Subject | Technique | Preserved invariant |
|---|---|---|
| Kipu idle, run, jump, land | Four same-size frames: base, bob (1 row removed), squash (2 rows removed), stretch (2 rows duplicated). Rows below the eyes (rows 24-27) only; bottom occupied row 31 fixed. | Eye glints (22,19) and (26,20), 32x40 frame, occupied bottom 32, 12x18 body at offset (10,14). No sprite scaling, because Arcade bodies follow scale. |
| Amaru | Rotation only: idle sway, rear-back during anticipation, lunge on action, droop in recovery; mouth/column charge; hit-flash silhouette; victory flicker, burst and fade. | Forgiving 32x44 body and display position untouched. Rotation stays within 12 degrees. |
| Effects | Fixed 64-particle pool of hard-pixel squares; dust, muzzle sparks, target and boss bursts, capture/return sparks, confetti on training completion. | Four-green Nokia palette stays exact: every effect maps to one of the four greens while PachaShift is active. |
| Map | Amaru preview sway and a bobbing pixel cursor beside the default action. | No new copy or controls. |

All animation reads each scene's owned clock, so focus pause freezes it. Human acceptance of the look and feel remains pending.
