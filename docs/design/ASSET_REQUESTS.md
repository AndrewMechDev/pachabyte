# Asset requests (Ruta 01)

Status flow: `requested → review → approved → integrated → verified`. Until an asset arrives the game uses a labelled procedural placeholder.

**How to use:** open a new image chat, attach the approved sheet `assets/references/pachabyte-phase3-concept.png` (plus any extra reference listed), paste the prompt exactly, and bring the result back. The project adapts sizes itself: prompts ask for an 8× pixel grid so the image can be reduced to its native size with nearest-neighbor sampling. If the tool cannot produce real transparency, a flat `#FF00FF` magenta background is accepted and keyed out during preparation.

| Priority | ID | Native size | Used for | Status |
|---|---|---|---|---|
| 1 | `BUG_GLITCHLING` | 4 frames × 16×16 | Route enemy | requested |
| 2 | `AMARU_BODY` (segment, tail, core) | 24×24, 32×32, 2 × 16×16 | Amaru's modular body | requested |
| 3 | `AMARU_RESTORED` | 64×64 | Head after liberation | requested |
| 4 | `BG_AREQUIPA_ROUTE` | 3 layers, 640×180 each | Route parallax background | requested |
| 5 | `KIPU_FLY_ACTIONS` | 2 × 4 frames × 32×40 | Kipu shooting and PachaShift | requested (optional) |
| 6 | `BUG_CORRUPTOR` | 4 frames × 24×24 | Ranged route enemy | requested |
| 7 | `BUG_SOMBRA_DE_ERROR` | 4 × 20×20 + 2 × 12×12 | Splitting route enemy | requested |

---

## 1. BUG_GLITCHLING

Attach: the approved sheet.

```text
Original pixel-art game sprite for "PachaByte", a 320x180 side-scrolling arcade. Use the attached concept sheet ONLY as a style and palette reference; do not copy its characters.

Subject: a "Glitchling", a small living software bug enemy. Compact, angular, jagged body with a dark outline, base color muted purple #8759AD with darker purple shading, one bright glowing eye or core in light violet #C985EF, and a few displaced pixel fragments around the edges that suggest digital glitch interference. It must read clearly by SHAPE alone (also when the whole screen turns monochrome green), and must look nothing like the hero Kipu (Kipu is round, turquoise, with two golden antennae).

Facing: LEFT (it flies in from the right side of the screen).

Layout: one horizontal strip of 4 animation frames (floating / jittering idle loop). Each frame is a 16x16 logical-pixel sprite drawn at exactly 8x scale, so every logical pixel is a perfectly square 8x8 block of one flat color. Each frame cell is 128x128 px; the full strip is 512x128 px. Same center pivot and same body position in every frame; only small jitter and the displaced fragments change.

Style: crisp hard-edged pixel art, limited palette (max 8 colors), no anti-aliasing, no gradients, no blur, no glow outside the pixel grid.

Background: real transparent PNG. If true transparency is impossible, use a single flat #FF00FF magenta background with no shadows or noise.

Do NOT include: text, labels, grid lines, frame borders, ground, shadows, weapons, logos, mascots of programming languages, or any character from existing games.
```

## 2. AMARU_BODY (segment, tail, core)

Attach: the approved sheet and `assets/prepared/amaru-head-v1-64x64.png`.

```text
Original pixel-art game assets for "PachaByte", a 320x180 side-scrolling arcade. The attached concept sheet shows the boss Amaru-01, a serpent guardian, and its modules panel (SEGMENTO A, SEGMENTO B, COLA, NUCLEO). Match its palette and scale style exactly: turquoise/teal scales #35B9AE with dark teal outline, warm gold #E7BD67 rings and trim, small violet #8759AD gem accents. The second attached image is the existing head these parts must connect to.

Produce ONE image containing three separate parts on one row, evenly spaced, each centered in its own cell, drawn at exactly 8x scale (every logical pixel is a square 8x8 block of one flat color):
1. BODY SEGMENT: 24x24 logical pixels (192x192 px cell). A round serpent body segment seen from the side, scales plus one gold ring and a small violet gem.
2. TAIL: 32x32 logical pixels (256x256 px cell). The tapered tail end of the same serpent, pointing to the RIGHT (the head faces left).
3. CORE: two frames of 16x16 logical pixels (128x128 px cells each), a glowing violet crystal core, frame 2 slightly brighter for a pulse.

Total image: 192 + 256 + 128 + 128 = 704 px wide, 256 px tall, parts vertically centered.

Style: crisp hard-edged pixel art, no anti-aliasing, no gradients outside the pixel grid, no blur.
Background: real transparent PNG, or a single flat #FF00FF magenta if transparency is impossible.
Do NOT include: the head, text, labels, borders, ground, shadows, glow outside the shapes.
```

## 3. AMARU_RESTORED

Attach: the approved sheet (see its "RESTAURADA" head frames) and `assets/prepared/amaru-head-v1-64x64.png`.

```text
Original pixel-art game sprite for "PachaByte". The second attached image is the current 64x64 head of Amaru-01, a serpent guardian, which is corrupted during the boss fight. Redraw the SAME head in its RESTORED, serene state, as in the "RESTAURADA" frames of the attached concept sheet.

Keep identical: silhouette, outline, size, framing, horns position, facing LEFT, and the eye position, so the two heads can crossfade pixel-perfectly. Change: mouth closed or only slightly open, calm eye with a soft turquoise/gold glow instead of violet, and absolutely no purple corruption anywhere. Palette: turquoise #35B9AE, dark teal outline, gold #E7BD67, ivory #F1E5C5 teeth if visible.

Size: 64x64 logical pixels drawn at exactly 8x scale (512x512 px image, every logical pixel a square 8x8 block of one flat color).
Style: crisp hard-edged pixel art, no anti-aliasing, no blur.
Background: real transparent PNG, or flat #FF00FF magenta if transparency is impossible.
Do NOT include: text, body segments, background, shadows, effects.
```

## 4. BG_AREQUIPA_ROUTE

Attach: the approved sheet (its 320x180 comparison panels) and `assets/prepared/arequipa-arena-v1-320x180.png`.

```text
Original pixel-art background for "PachaByte", a 320x180 side-scrolling arcade set in a fantasy, tech-touched version of Arequipa, Peru ("Santuario de la Trama"). Use the attached images only as palette and mood reference; create a new composition.

Produce THREE separate parallax layers stacked vertically in one image, each layer 640x180 logical pixels drawn at exactly 2x scale (1280x360 px per layer, total image 1280x1080 px). Every layer must tile seamlessly left-to-right (its left and right edges connect).
1. FAR layer (opaque): evening sky with warm peach horizon, the snow-capped Misti volcano and two neighboring volcano silhouettes, faint turquoise digital "Trama" threads in the sky.
2. MID layer (transparent above its skyline): stylized white sillar-stone arches, terraces and church-like domes in muted ivory and lavender, low contrast, a few softly glowing turquoise thread lines connecting them.
3. NEAR layer (transparent except the bottom 30 px): low stone walls, molle-tree silhouettes and broken digital cables along the bottom edge only.

Keep the central band (y 20 to 150 of each layer) calm and low-contrast so small purple enemies, a turquoise hero and gold collectibles stay readable. Reserve the top 16 px for a HUD: no bright details there.
Style: crisp pixel art, limited palette, no anti-aliasing, no gradients smoother than pixel dithering, no photographic texture.
Transparency: real transparent PNG where stated, or flat #FF00FF magenta for transparent areas if impossible.
Do NOT include: characters, enemies, text, UI, platforms, logos, or any recognizable art from other games.
```

## 5. KIPU_FLY_ACTIONS (optional for the MVP)

Attach: the approved sheet (panels "DISPARAR" and "PACHASHIFT ACTIVO") and `assets/prepared/kipu-v4-32x40.png`.

```text
Original pixel-art animation frames for "PachaByte". The second attached image is the current in-game sprite of the hero Kipu (32x40). Keep his exact identity: round turquoise body, two curved antennae with golden tips, large dark eyes with white glints, golden diamond on the chest, flowing turquoise-and-gold patterned ribbon. Kipu FLOATS; he has no legs.

Produce TWO horizontal strips, one above the other, facing RIGHT:
1. SHOOT: 4 frames — small recoil, a golden energy flash at the front, return to neutral.
2. PACHASHIFT: 4 frames — a turquoise energy ring forming around him and pulsing.
Each frame is 32x40 logical pixels drawn at exactly 8x scale (256x320 px per frame). Each strip is 1024x320 px; total image 1024x640 px. Same framing and pivot as the attached sprite in every frame, and the lowest ribbon pixels must stay on the same row in every frame.

Style: crisp hard-edged pixel art, no anti-aliasing, no blur, palette taken from the attached sprite.
Background: real transparent PNG, or flat #FF00FF magenta if transparency is impossible.
Do NOT include: legs, clothes, weapons, text, borders, ground, shadows.
```

## 6. BUG_CORRUPTOR

Attach: the approved sheet. Native: 4 frames × 24×24 (strip 768×192 at 8x).

```text
Original pixel-art game sprite for "PachaByte", a 320x180 side-scrolling arcade. Use the attached concept sheet ONLY as a style and palette reference; do not copy its characters.

Subject: a "Corruptor", a medium software-corruption enemy that hovers at a distance and spits slow corrupted orbs. It looks like a heavy, armored cluster of broken data blocks fused with a dark purple organic core: a squat rounded-square body, two short tendril-like cables hanging below, a single round "mouth" vent on its LEFT side that glows when it fires, and a few cracked stone-like tiles (inspired by white sillar stone, partly infected) stuck to its back. Colors: dark purple #4A2E63 body, muted purple #8759AD plates, light violet #C985EF glowing vent and cracks, a little ivory #F1E5C5 on the stone tiles, dark outline. It must read clearly by SHAPE alone (also in monochrome green), and look clearly different from the small angular Glitchling and from the round turquoise hero Kipu.

Facing: LEFT.

Layout: one horizontal strip of 4 frames: frames 1-2 idle hover (tendrils sway), frame 3 vent charging (vent brighter, body slightly compressed), frame 4 firing (vent open, small recoil to the right). Each frame is 24x24 logical pixels drawn at exactly 8x scale (every logical pixel a square 8x8 block of one flat color): 192x192 px cells, full strip 768x192 px. Same center pivot in every frame.

Style: crisp hard-edged pixel art, max 8 colors, no anti-aliasing, no gradients, no blur, no glow outside the pixel grid.
Background: real transparent PNG, or a single flat #FF00FF magenta background if transparency is impossible.
Do NOT include: projectiles, text, labels, grid lines, borders, ground, shadows, logos, programming-language mascots, or characters from existing games.
```

## 7. BUG_SOMBRA_DE_ERROR

Attach: the approved sheet. Native: large 4 frames × 20×20 and small 2 frames × 12×12 (one image).

```text
Original pixel-art game sprites for "PachaByte", a 320x180 side-scrolling arcade. Use the attached concept sheet ONLY as a style and palette reference; do not copy its characters.

Subject: a "Sombra de Error" (Error Shadow), an evasive anomaly that flickers and, when destroyed, splits into two smaller copies. It is a hooded, ghost-like silhouette made of dark corrupted pixels with two small glowing eyes, a ragged lower edge that dissolves into a few loose pixels, and a faint "duplicate" offset outline (a 1-pixel echo of its silhouette shifted to the right, drawn as solid pixels, not transparency). Colors: near-black purple #241631 body, deep purple #4A2E63 shading, violet #C985EF eyes and echo outline, dark outline. It must read by SHAPE alone (also in monochrome green) and look clearly different from the angular Glitchling, the boxy Corruptor and the round turquoise hero Kipu.

Facing: LEFT.

Produce ONE image with two rows:
Row 1 - LARGE form: 4 frames of 20x20 logical pixels (drift loop; frame 3 shows the echo outline jumping to the left side, like a glitch blink).
Row 2 - SMALL form (what it splits into): 2 frames of 12x12 logical pixels, same design simplified.
Draw everything at exactly 8x scale (every logical pixel a square 8x8 block of one flat color). Row 1 cells are 160x160 px (strip 640x160). Row 2 cells are 96x96 px, left-aligned under row 1. Total image 640x256 px. Same center pivot within each form.

Style: crisp hard-edged pixel art, max 6 colors, binary alpha only (no semi-transparent pixels), no anti-aliasing, no blur.
Background: real transparent PNG, or flat #FF00FF magenta if transparency is impossible.
Do NOT include: text, labels, borders, ground, shadows, weapons, logos, programming-language mascots, or characters from existing games.
```
