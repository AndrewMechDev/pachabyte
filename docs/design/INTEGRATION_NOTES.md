# B1 prepared art: integration handoff

All six received sources are prepared, **not integrated**. Originals remain unchanged in `assets/incoming/`. B1 changes no game, page, physics, animation timing or input code. Sizes below are asset preparation choices; final native-scene and human acceptance belongs to B2/B3/B4/B5/B6.

## Quick selection

| Source | Prepared output under `assets/prepared/` | Decision |
|---|---|---|
| `MAP_TRAMA.png` (1672x941 RGB) | `map-trama-v1-320x180.png` | Provisional game-native map: all six sockets and connections remain readable. Add selection markers/cards in B2, not labels baked into art. |
| Same map | `map-trama-v1-640x360.png` | Higher-detail comparison/reference; not automatically preferable when displayed at 320x180. |
| `LOGO_PACHABYTE.png` (2172x724 RGBA) | `logo-pachabyte-v1-320x107.png` | Binary alpha; full composition, all letters and chullo retained. Occupied bounds `(4,16)-(316,85)`; do not crop the chullo to force the requested 160x40 aspect ratio. |
| `PAGE_BG.png` (1672x941 RGB) | `page-bg-v1-640x360.webp` | Lossless WebP, **359124 bytes**, below approximately 600 KB; richer side architecture than the 320x180 comparison. Keep a calm dark game surround in B3. |
| Same page | `page-bg-v1-320x180.png` | Native-size evaluation copy, 116819 bytes. Not the selected page delivery. |
| `LOOP_NODE_EYE.png` (1659x948 RGBA) | `loop-node-eye-v1-40x56.png` | Seven padded frames; preserve eye, tentacles and flying shards. Larger cell is not permission to alter hitbox. |
| `SHOTS.png` (1448x1086 RGBA) | `shots-v1-normal-16x12.png`, `shots-v1-rafaga-24x20.png`, `shots-v1-impact-16x16.png` | Three measured source rows, four frames each; separate output sheets. |
| `BG_ROUTE_NEON.png` (1672x941 RGB) | `bg-route-neon-v1-320x180.png` | Full opaque composition, 112050 bytes. Neon colors are retained rather than chroma-keyed. |

`docs/review/b1-review-manifest.json` records exact source SHA256, dimensions, output hashes, bytes and native/zoom review pairs. Every final sprite has binary alpha and padding on every side; metadata reports `cropped: false`. No original was overwritten.

## Reproduce images

From the repository root, use Python with Pillow. B1 used `C:\Users\dark_\AppData\Local\Programs\Python\Python311\python.exe`; the commands below used its available `python` alias with isolation (`-I`).

```powershell
python -I tools/prepare_sprite.py --self-test
python -I tools/prepare_sprite.py assets/incoming/MAP_TRAMA.png assets/prepared/map-trama-v1-320x180.png --opaque-resize --target 320x180
python -I tools/prepare_sprite.py assets/incoming/MAP_TRAMA.png assets/prepared/map-trama-v1-640x360.png --opaque-resize --target 640x360
python -I tools/prepare_sprite.py assets/incoming/PAGE_BG.png assets/prepared/page-bg-v1-320x180.png --opaque-resize --target 320x180
python -I tools/prepare_sprite.py assets/incoming/PAGE_BG.png assets/prepared/page-bg-v1-640x360.webp --opaque-resize --target 640x360
python -I tools/prepare_sprite.py assets/incoming/LOGO_PACHABYTE.png assets/prepared/logo-pachabyte-v1-320x107.png --frame 320x107
python -I tools/prepare_sprite.py assets/incoming/LOOP_NODE_EYE.png assets/prepared/loop-node-eye-v1-40x56.png --auto --target 40x56 --colors 8 --merge 0 --pitch 8
python -I tools/prepare_sprite.py assets/incoming/SHOTS.png assets/prepared/shots-v1-normal-16x12.png --auto --row 0 --target 16x12 --colors 6 --factor 2
python -I tools/prepare_sprite.py assets/incoming/SHOTS.png assets/prepared/shots-v1-rafaga-24x20.png --auto --row 1 --target 24x20 --colors 6
python -I tools/prepare_sprite.py assets/incoming/SHOTS.png assets/prepared/shots-v1-impact-16x16.png --auto --row 2 --target 16x16 --colors 6 --factor 2
python -I tools/prepare_sprite.py assets/incoming/BG_ROUTE_NEON.png assets/prepared/bg-route-neon-v1-320x180.png --opaque-resize --target 320x180
```

Opaque mode performs nearest-neighbor sampling of the entire image: no crop, no palette quantization, no magenta key. Input ratio 1.77683 becomes 1.77778 (approximately 0.05% difference); sources are not exact pixel grids. Lossless describes output compression, not a lossless reduction from the original. A rejected 960x540 page candidate was 728960 bytes; it was removed after selecting the smaller output.

## Eye: actual frame contract

The source really contains **one left-to-right row of seven unevenly spaced silhouettes**, not equal 256x256 cells. Source measured bounds and output alpha bounds live in `loop-node-eye-v1-40x56.json`.

| Index, zero-based | Observed content | Proposed integration slot |
|---|---|---|
| 0, 1, 2, 3 | Intact eye with changing pupil and tentacle poses | Idle frames 0-3 |
| 4 | Ivory-white flashed frame | Hit |
| 5 | Violet cracks across the eye | Cracking |
| 6 | Split gold/teal fragments, loosened tentacles | Shattering |

Output: **280x56**, seven **40x56** cells, eight shared opaque colors, alpha threshold 128. Auto alignment uses the largest connected source component, placed at cell center `(20,28)` / normalized origin `(0.5,0.5)`; this is **not a measured anatomical pupil pivot**. The intact eye sits above the tentacles within that component. Integrators must check the visual core against the existing node center without moving its physics body.

Automatic pitch estimation produced 36.61 source px with only 0.08 alignment, shrinking the eye to unreadable 5-7 px. `--pitch 8` is an explicitly inspected sampling choice, **not proof of an exact source grid**. `--merge 0` preserves all seven bodies instead of joining adjacent silhouettes. The largest output silhouette is 30x48 with padding, so forcing a 32x32 cell would sacrifice the delivered tall design or substantially shrink it. Cell size is provisional; B5 must validate scene readability, effects overlap and visual origin while preserving HP, location, bob and hitbox. No animation durations are guessed in JSON (`timing: null`).

## Shots: measured rows and anchors

Source rows are normal gold bolts, turquoise Ráfaga bolts, then a four-stage impact; each has four frames left-to-right. All bolts point right. Natural art pitch estimate is 9.71 source px with alignment 0.34, not a clean 8x grid. Alpha threshold 128 removes soft halo pixels; six shared opaque colors are allowed per row.

| Sheet | Dimensions | Native cell / origin | Occupied sizes |
|---|---|---|---|
| Normal | 64x12 | 16x12 / `(8,6)` | Approximately 9-11x5 |
| Ráfaga | 96x20 | 24x20 / `(12,10)` | Approximately 15-16x10-11 |
| Impact | 64x16 | 16x16 / `(8,8)` | Starts approximately 6x5, expands to 12x12, then fragments |

Each corresponding `.json` records source boxes, output bounds, reduction scale, frame order and origin. Anchors are the largest connected body center, **not projectile-head alignment**. Do not apply one frame-grid size to all three sheets. Normal/impact explicitly reduce by factor 2 with the existing coverage vote; Ráfaga automatically chooses factor 2 to fit the target. Intact tails and loose impact particles remain visible in the reviewed outputs; palette reduction intentionally drops redundant source shading.

B4 should map indices 0-3 to the existing normal/Ráfaga loops and one-shot impact, retaining current timing, reduced-motion frame 0, invisible 6x3 physics bodies and speeds. Derive separate four-green twins for both renderers; Canvas ignores tint. No timing or hitbox metadata was invented.

## Neon backdrop integration caveat

Use the prepared 320x180 image as a visual-only backdrop in B6, retaining the current world geometry and ambient layers. The source's volcano skyline is not proven to match the existing arena exactly. Its magenta horizon/moon is also brighter than the requested calm central band; confirm bullets, Kipu, pickups, captions and HUD against it **in the actual scene** before selecting fade/opacity. A source-image review cannot prove gameplay contrast.

Tie any approved cross-fade to route segments, not a new rigid story trigger. Reduced motion needs a non-animated state change. Maintain the existing Misti smoke/glow and mist layering. No `RouteScene` change belongs to B1.

## Visual evidence and pending acceptance

All ten retained prepared image outputs were inspected with `view_image` at native resolution and nearest-enlarged zoom. `docs/review/b1-review-*-zoom.png` composites transparent art over dark indigo solely for inspection, at 4x (or 2x for 640-wide images). These are review artifacts, not runtime textures. Full backgrounds retain their borders; sprite alpha bounds stay strictly inside every final cell. Logo text/chullo, eye state distinctions and the three shot silhouettes read clearly in this asset-only review.

Native game fit, human acceptance, both-renderer integration and responsive page acceptance are still pending. B1 browser regression checks exercise the unchanged game, not these unreferenced assets: WebGL W1 lost the route pilot; its single classification rerun W2 and Canvas C1 each passed 22 groups. Six `docs/review/b1-review-webgl-*.png` / `docs/review/b1-review-canvas-*.png` captures retain the unchanged map, procedural bolts and procedural eye for renderer inspection. Full run/permission/screenshot-restoration evidence is in `docs/track-b-progress.md`; there is no claim of two green WebGL runs. Art license remains **all rights reserved**, pending the user's decision; preparation does not grant a new license.

## B4 integrated: Kipu's bolts and the impact burst (2026-10-14)

Normal bolt, Ráfaga bolt and impact burst are now drawn from the prepared sheets in both the Route and the Guardian scenes, in WebGL and Canvas. **Integrated, not human-approved.** No reduced-size derivative sheet was made: the in-game captures show the prepared sizes (normal about 11x5, Ráfaga about 16x11 occupied) do not cover Kipu, the Glitchlings or enemy projectiles, so the originals are used as they are. Gameplay is unchanged: the pooled physics shots keep their invisible 6x3 body (`SHOT_BODY`), speeds, damage, cooldowns and pool sizes; the bolt art is drawn by separate, never-scaled display images that follow them.

| Piece | Decision |
|---|---|
| Loading | `loadShotSheets(scene)` in each scene's `preload()` queues the three PNGs (Vite bundles `assets/prepared/shots-v1-*.png`) as `sheet-shots-<name>`; skipped when they already exist (scene restarts). |
| Bolt textures | `createShotTextures(scene, nokia)` slices every 4-frame sheet into `shot-<kind>-<frame>`; with `nokia` it derives `shot-<kind>-<frame>-nokia` through `derive(...)` + `convertPixels` (Canvas ignores tint). Alpha is binary, so every REVERSE pixel is one of the four greens with alpha 255. |
| Display anchor | Computed from the real alpha of the PNGs by `headAnchor()` in `src/game/shotSheets.ts` (the tests recompute it and compare). The prepared JSON origins are the centre of the largest body, not the head, so they are not used. x: the tip (rightmost occupied edge of the sheet) sits on the front edge of the physics body, 3 px ahead of the body centre, as the old placeholders did and where impacts spawn (`shot.x + 3`). y: the mean row centre of each frame's three rightmost columns, rounded to half a pixel. Same for all four frames, so the bolt does not jitter. Normal: cell 16x12, anchor (9, 6.5) (tip at x=12; frame 0 ends at 11). Ráfaga: cell 24x20, anchor (15, 11) (tip at x=18 on every frame). |
| Flicker | 4 frames, `SHOT_FLICKER_MS` 60 ms each (a 240 ms loop); reduced motion keeps frame 0. |
| Impact burst | Option (a): each 16x16 frame is decoded once into an opaque-pixel list (own color plus its exact Nokia green) and painted by the unchanged `drawImpacts` as whole 1x1 squares, centred on the rounded hit point at cell pixel (8, 8) (the prepared origin). `IMPACT.ms` 180 / 4 frames, reduced motion shows one static frame (`IMPACT.reducedFrame`) for `IMPACT.reducedMs`, pool capacity 12 and the debug counters are unchanged. The placeholder star grew with the Ráfaga (`IMPACT.arm`); the delivered sheet has one burst, so normal and Ráfaga hits now share it. |

Reproduction: no new image was produced. The sheets are the B1 outputs listed above (same `tools/prepare_sprite.py --auto --row N` commands). If the Ráfaga proves too busy at launch (three overlapping 24x20 cells), the derivative would be: `python -I tools/prepare_sprite.py assets/incoming/SHOTS.png assets/prepared/shots-v1-rafaga-18x15.png --auto --row 1 --target 18x15 --colors 6`, keeping the 24x20 file, then recomputing the anchor with `headAnchor()`. Not needed so far.

Verification: `tests/shotFx.test.ts` decodes the real PNGs (`tests/pngDecode.ts`) and checks grid, binary alpha, margins, anchors, REVERSE greens and the impact drawing. In-game captures in both renderers and the unmodified WebGL smoke are recorded in the B4 report; the Canvas smoke and a human look at the Ráfaga volley are still pending.

## B5 integrated: the Bucle's eye relic (2026-10-14)

The Bucle node is drawn from the prepared `loop-node-eye-v1-40x56.png` (7 cells of 40x56) instead of the procedural `eyeRows()` pixel strings, in WebGL and Canvas. **Integrated, not human-approved.** Gameplay is unchanged: node HP 5, position (`LOOP.node`), bobbing, the 12x12 hitbox, depth 5, the frame choice `eyeFrameFor` (hit flash first, break at HP <= 1, crack at HP <= 2, idle loop 220 ms, reduced motion keeps idle0), the `loop-eye-<frame>` texture keys and the programmatic shatter burst (`shatterPieces`/`drawShatter`, constants untouched). The eye is a never-scaled display image; its size is independent of the hitbox.

| Piece | Decision |
|---|---|
| Size | The full 40x56 sheet is used as prepared (disc 26x27, relic 26x42 with cables). A reduced `--target 24x32` derivative was generated and rejected (scratch only, not kept): both 24x32 and 28x40 reduce by 2 (about 13x21 occupied) and lose the slit pupil and the stepped chakana, so the Bucle stops reading as an eye. A to-scale mock-up over a real capture showed the 40x56 eye is about Kipu's size, covers neither Kipu, the bolts (depth 6, drawn over it) nor the Glitchling formation (30+ px to its right), while the 24x32 one is a small blob. Known cost: the visible disc is about twice the 12x12 hitbox (bolts reach the gold frame about 7 px before registering); the hitbox was deliberately left untouched. |
| Loading | `loadEyeSheet(scene)` in `RouteScene.preload()` queues the PNG (Vite bundles it) as `sheet-loop-eye`, skipped when it already exists (scene restarts). `createEyeTextures(scene)` slices the seven cells into `loop-eye-idle0..3`, `loop-eye-hit`, `loop-eye-crack`, `loop-eye-break` (`createCanvas` + `drawImage`, skipped for keys that exist). Same pattern as `loadShotSheets` / `createShotTextures`. |
| Anchor | `EYE_SHEET.anchor = (20, 21)` in edge coordinates, computed from the real alpha (`src/game/eyeSheets.ts`; the tests re-measure it per frame with `eyeDiscCenter()`). The prepared JSON origin (20,28) is the centre of the largest connected body (disc plus cables), 7 px below the visual eye, so it is not used. The idle gold frame spans x 7..33, y 8..34, so its centre is (20, 21); measured per frame: idle (20, 20..20.5), hit (20, 22), crack (20, 20), break (20, 22.8, loose shards bias it), all within the test tolerances (1 px; 1.5 hit; 2.5 break). The same anchor for the seven frames, so the relic does not jitter; the origin is `anchor / cell` = (0.5, 0.375). The cables hang below it as before. |
| HP pips | The disc reaches 14 px above the node (15 in the hit frame, 18 for the loose shards of the break frame), so the pips moved 3 px up (`EYE.pipsAbove = 18`, rows -18..-17) in the one `RouteScene` line that draws them; the test asserts the clearance for every frame but the break one. |
| Shatter burst | Same mechanism (`shatterPieces`/`drawShatter`, 10 shards, 4 cables, 650 ms, reduced-motion static frame). Captures showed the old constants undersized for the larger relic, so only the geometry was scaled: shard speed 40/56/72 -> 52/72/92 px/s, shard size 2/1/1 -> 3/2/1 px, loosened cables start at row +14 (where the tentacles hang) instead of +8, at x -7/-3/3/7 instead of -5/-2/2/5. Counts, timings, slots and determinism are unchanged. |
| REVERSE | The eye exists only in the Route scene (no `GuardianScene` code draws it), so no Nokia twin is made; the test still checks that every opaque pixel converts to an exact four-green with alpha untouched. |
| Placeholder | The `eyeRows()` strings, `EYE_COLORS` and the symmetry/palette tests of the procedural art were removed (`eyeArt.ts` keeps the frame names); the tests now read the real PNG bytes (`tests/pngDecode.ts`). |

Reproduction: no new image is kept. The sheet is the B1 output (`python -I tools/prepare_sprite.py assets/incoming/LOOP_NODE_EYE.png assets/prepared/loop-node-eye-v1-40x56.png --auto --target 40x56 --colors 8 --merge 0 --pitch 8`). The rejected derivative came from the same command with `--target 24x32`.

Verification: `tests/eyeRelic.test.ts` (grid, binary alpha, margins, palette, anchor against the measured disc centre, pip clearance, frame choice), in-game captures in both renderers (WebGL and Canvas) of the idle, hit, crack, break and shatter frames, recorded in the B5 report. The Canvas smoke and a human look are still pending.
