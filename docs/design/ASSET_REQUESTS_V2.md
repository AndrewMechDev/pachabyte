# Asset requests, round 2 (polish phases)

Same rules as [ASSET_REQUESTS.md](ASSET_REQUESTS.md): open a new image chat per request, attach the references listed, paste the prompt exactly, save the result in `assets/incoming/` with the suggested file name, and tell the agent. The project adapts sizes itself with `tools/prepare_sprite.py` (`--auto` handles uneven sheets), so a larger source is fine. A flat `#FF00FF` background is accepted if real transparency is impossible.

| Order | ID | Suggested file | Native target | Used for |
|---|---|---|---|---|
| 1 | `MAP_TRAMA` | `assets/incoming/map-trama-v1.png` | 320×180 (opaque) | Map screen background with locked and in-progress routes |
| 2 | `LOGO_PACHABYTE` | `assets/incoming/logo-pachabyte-v1.png` | 160×40 (transparent) | Title wordmark with a chullo |
| 3 | `LOOP_NODE_EYE` | `assets/incoming/loop-node-eye-v1.png` | 7 frames × 32×32 | The "rompe el nodo" loop node |
| 4 | `SHOTS` | `assets/incoming/shots-v1.png` | 3 rows of 4 frames | Kipu bolts, Ráfaga bolts, impact bursts |
| 5 | `BG_ROUTE_NEON` | `assets/incoming/bg-route-neon-v1.png` | 320×180 (opaque) | Corrupted neon-night version of the route sky |
| 6 | `PAGE_BG` | `assets/incoming/page-bg-v1.png` | 1920×1080 (opaque) | Website background around the game |

Priority if time is short: 1, 2, 3, then 4 to 6.

## Estado de recepción y preparación — B1 (2026-10-14)

Los seis originales recibidos se conservan sin cambios en `assets/incoming/`, con los nombres en mayúsculas de la tabla siguiente. **Preparado no significa integrado ni aprobado en la escena**. Comandos, grillas medidas, anclas, límites y evidencia visual: [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md).

| ID / original recibido | Estado | Salida preparada |
|---|---|---|
| `MAP_TRAMA.png` | Recibido → preparado; integración B2 pendiente | `map-trama-v1-320x180.png`; comparación `map-trama-v1-640x360.png` |
| `LOGO_PACHABYTE.png` | Recibido → preparado; integración B3 pendiente | `logo-pachabyte-v1-320x107.png`, alfa binaria y chullo completo |
| `LOOP_NODE_EYE.png` | Recibido → preparado; integración B5 pendiente | `loop-node-eye-v1-40x56.png`, 7 celdas con margen; orden real confirmado |
| `SHOTS.png` | Recibido → preparado; integración B4 pendiente | Normal 16x12, Ráfaga 24x20, impacto 16x16; 4 cuadros por hoja |
| `BG_ROUTE_NEON.png` | Recibido → preparado; integración B6 pendiente | `bg-route-neon-v1-320x180.png`; contraste jugable todavía no verificado |
| `PAGE_BG.png` | Recibido → preparado; integración B3 pendiente | `page-bg-v1-640x360.webp`, compresión sin pérdida, 359124 bytes; comparación 320x180 PNG |

Las dimensiones solicitadas arriba describen el prompt, no los bytes recibidos. El ojo entregado es más alto: la celda 40x56 preserva tentáculos y fragmentos sin cambiar la colisión. La escala final requiere revisión en el juego. La licencia artística continúa pendiente; se mantienen todos los derechos reservados.

---

## 1. MAP_TRAMA

Attach: `assets/references/pachabyte-phase3-concept.png` and `assets/prepared/arequipa-arena-v1-320x180.png` (palette and mood only).

```text
Original pixel-art map background for "PachaByte", a retro Andean digital-fantasy arcade game. Use the attached images ONLY as palette and mood reference; create a new composition.

Subject: a stylized, NOT geographically exact "Trama de Pacha" map of a fantasy Peru, seen from above, on a dark night-teal and deep-violet ground. A glowing network of thin woven threads (quipu-like cords with small knots) connects six EMPTY circular stone sockets (pedestals) where level nodes will be placed by the game. Draw the sockets as empty rings, with NO glow, NO characters and NO icons inside them.

Layout, in a 16:9 frame. Put the stylized Peru silhouette (coast on the left, Andes ridge in the middle, Amazon jungle on the right) so it fills the frame, with these socket centers as fractions of the image width and height (x from left, y from top):
- Arequipa (south, first level): x 0.40, y 0.78
- Puno (south-east, near a small lake): x 0.62, y 0.84
- Cusco (south-central): x 0.55, y 0.60
- Lima (central coast): x 0.28, y 0.52
- Trujillo (north coast): x 0.24, y 0.30
- Iquitos (north-east Amazon): x 0.70, y 0.24
Connect them with the threads: Arequipa-Cusco, Arequipa-Puno, Cusco-Lima, Lima-Trujillo, Cusco-Iquitos. Draw the Arequipa area (and the thread leaving it) a little brighter, warm and turquoise, as if recently restored. Draw the OTHER regions dimmer with a "work in progress" feel: faint grey-violet static noise patches, tiny scaffolding or construction-crane silhouettes made of pixels, and broken, flickering thread segments. Fill the rest with subtle terrain: snow-capped volcano silhouettes (the Misti near Arequipa), coast waves, jungle canopy, a small Titicaca lake, and faint circuit-board traces blended into the ground.

Keep the top 14 percent and the bottom 22 percent calm and low-contrast, because the game overlays a title and menu text there. No text, no letters, no numbers, no labels, no UI, no border.

Format: draw it at exactly 4x scale of a 320x180 logical-pixel grid, so the image is 1280x720 px and every logical pixel is a square 4x4 block of one flat color. Opaque (no transparency).
Style: crisp hard-edged pixel art, limited palette (teal #35B9AE, dark teal #173D32, gold #E7BD67, terracotta #C66D49, violet #8759AD, ivory #F1E5C5), no anti-aliasing, no gradients smoother than pixel dithering, no blur, no photographic texture.
Do NOT include: real map borders, country names, text, characters, logos, or any recognizable artwork from other games.
```

## 2. LOGO_PACHABYTE

Attach: `assets/prepared/kipu-v4-32x40.png` and the concept sheet (palette only).

```text
Original pixel-art game logo for "PachaByte", a retro Andean digital-fantasy arcade game. Draw the single word PACHABYTE in bold, chunky, tech-flavored pixel lettering: blocky letters with small circuit-trace notches and one-pixel data nodes cut into the strokes, mixed with Andean textile geometry (stepped chakana-like cuts and woven zig-zag bands) along the letter edges. The letters must read clearly and be spelled exactly P-A-C-H-A-B-Y-T-E.

Place a small colorful Peruvian chullo (knitted Andean cap with ear flaps, a pom-pom on top, and a woven geometric band in turquoise, gold, terracotta and ivory) sitting on top of the letter "A" in the middle of the word (the second A), slightly tilted, as a playful mascot touch. Do NOT put a face on the cap.

Colors: letters turquoise #35B9AE with dark teal #173D32 outline and a lower shade, gold #E7BD67 highlights, a thin neon magenta #C985EF rim light on the lower edge, ivory #F1E5C5 sparks. Flat colors only.

Format: one wide image, the wordmark filling the frame with a 1-logical-pixel transparent margin, drawn at exactly 8x scale of a 160x40 logical-pixel grid: 1280x320 px, every logical pixel a square 8x8 block of one flat color.
Style: crisp hard-edged pixel art, max 8 colors, binary transparency only, no anti-aliasing, no gradients, no blur, no glow outside the pixel grid.
Background: real transparent PNG, or a single flat #FF00FF magenta background if transparency is impossible.
Do NOT include: any other text or tagline, borders, drop shadows, backgrounds, logos or mascots of programming languages or of existing games.
```

## 3. LOOP_NODE_EYE

Attach: the concept sheet (palette only). Native frame 32×32.

```text
Original pixel-art game sprite sheet for "PachaByte". Create a "loop node", a mystical all-seeing eye relic that the player must shoot to break a repeating loop. It is an ORIGINAL design inspired by Andean motifs and digital circuits: a large round eye with a gold chakana-stepped frame, an iris made of concentric turquoise rings with a glowing violet core, a vertical slit pupil, and a few thin cable-like tentacles in dark purple (ending in glowing tips) curling out from the lower half of the frame. Small woven-thread patterns on the frame. It must NOT resemble any existing named artifact or character from films, comics or games.

One horizontal strip of 7 frames, centered in equal cells: frames 1-4 idle loop (iris rings rotate by a step, pupil dilates, tentacles sway), frame 5 hit flash (everything ivory-white tinted, slightly bigger), frames 6-7 breaking (frame 6: cracks of violet light across the eye, frame 7: the eye splits into shards with tentacles loosening). Each frame is 32x32 logical pixels drawn at exactly 8x scale (every logical pixel a square 8x8 block of one flat color): 256x256 px cells, strip 1792x256 px. Same center pivot in every frame.

Style: crisp hard-edged pixel art, max 8 colors, binary transparency only, no anti-aliasing, no gradients, no blur, no glow outside the pixel grid. Palette: gold #E7BD67, turquoise #35B9AE, dark teal #173D32, violet #8759AD, light violet #C985EF, ivory #F1E5C5, near-black purple #241631.
Background: real transparent PNG, or a single flat #FF00FF magenta if transparency is impossible.
Do NOT include: text, borders, grid lines, ground, shadows, or logos.
```

## 4. SHOTS

Attach: `assets/prepared/kipu-v4-32x40.png` (palette) and the concept sheet.

```text
Original pixel-art projectile sprites for "PachaByte", a 320x180 side-scrolling arcade shooter. The player is a small turquoise-and-gold creature; these are ITS shots, flying to the RIGHT. Produce ONE image with three rows, 4 animation frames each (looping), every frame centered in an equal cell:
Row 1, NORMAL SHOT: a small golden energy bolt, about 12x6 logical pixels, with a bright ivory core and a short fading tail of 2-3 pixel sparks; the tail flickers between frames.
Row 2, RAFAGA SHOT (power-up version): a slightly longer bolt, about 16x8 logical pixels, turquoise with a gold core and a spiral of tiny turquoise sparks around it, clearly different from row 1 by color and shape (a pointed arrow-like head).
Row 3, IMPACT BURST (played once when a shot hits): 4 frames of a small star-shaped burst, ivory then gold then terracotta, growing from 6x6 to 14x14 logical pixels and breaking into 4-5 loose pixels.
Cell size: 16x16 logical pixels, drawn at exactly 8x scale (every logical pixel a square 8x8 block of one flat color): 128x128 px cells, image 512x384 px. Keep the bolts vertically centered; bolts point RIGHT.
Style: crisp hard-edged pixel art, max 6 colors per row, binary transparency only, no anti-aliasing, no gradients, no blur.
Background: real transparent PNG, or a single flat #FF00FF magenta if transparency is impossible.
Do NOT include: text, borders, grid lines, shadows, or weapons.
```

## 5. BG_ROUTE_NEON

Attach: `assets/prepared/arequipa-arena-v1-320x180.png` (the current route sky; keep the same composition).

```text
Original pixel-art background for "PachaByte". The attached image is the current calm sunset backdrop of the Arequipa route. Redraw the SAME composition (same skyline, same positions of the Misti volcano, the two neighboring volcanoes, the sillar arches and the hills) but as a CORRUPTED NEON NIGHT version, as if the digital anomaly "El Desfase" had taken over: a deep indigo and near-black purple sky with a huge magenta-violet moon, neon magenta #C985EF and electric cyan #35B9AE streaks in the clouds, orange #C66D49 lava veins glowing on the Misti like circuit traces, faint horizontal glitch scanlines and a few floating data-block fragments in the sky, and neon-edged ruins. Cyberpunk-Andean mood: epic, dramatic, high contrast in the sky, but keep the central horizontal band (from 22 to 82 percent of the height) calmer and darker so small bright bullets, enemies and pickups stay readable. Keep the top 14 percent dark and quiet for a HUD. No characters, no text, no UI.
Format: drawn at exactly 4x scale of a 320x180 logical-pixel grid: 1280x720 px, every logical pixel a square 4x4 block of one flat color. Opaque.
Style: crisp hard-edged pixel art, limited palette (max 20 colors), no anti-aliasing, no gradients smoother than pixel dithering, no blur.
Do NOT include: text, characters, logos, or recognizable artwork from other games.
```

## 6. PAGE_BG

Attach: the concept sheet (palette) and `assets/prepared/arequipa-arena-v1-320x180.png`.

```text
Original wide pixel-art background for the web page that frames the browser game "PachaByte". Epic cyberpunk-Andean night: a vast dark indigo sky, a huge distant volcano silhouette (the Misti) with orange lava veins like circuit traces, layered mountain ridges in deep violet and teal, stylized sillar-stone arches and temple terraces edged with thin neon magenta and cyan lines, floating glowing data cubes and a few digital rain streaks falling softly, and faint Andean woven geometric patterns in the sky. The CENTER of the image (a rectangle covering 56 percent of the width and 70 percent of the height, centered slightly above the middle) must stay very dark, quiet and low-contrast, because a game window is placed over it; put the visual interest on the left and right sides and at the bottom.
Format: 16:9, drawn at exactly 4x scale of a 480x270 logical-pixel grid: 1920x1080 px, every logical pixel a square 4x4 block of one flat color. Opaque.
Style: crisp hard-edged pixel art, limited palette (max 24 colors), no anti-aliasing, no gradients smoother than pixel dithering, no blur, no photographic texture.
Do NOT include: text, characters, logos, UI, or recognizable artwork from other games.
```
