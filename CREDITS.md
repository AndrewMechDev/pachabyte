# Credits and provenance

PachaByte is an original project. Nothing here is copied from another game.

| Asset | Source | Notes |
|---|---|---|
| Code | Written for this project | MIT, see [LICENSE](LICENSE). Phaser 3 (MIT) is the only runtime dependency. |
| Kipu (`assets/prepared/kipu-v4-32x40.png`) | Original character, generated with ImageGen, adapted by nearest-neighbor sampling from `assets/incoming/kipu-v1.png` | Concept: `assets/references/kipu-approved-concept.png`. Animation frames are derived row edits of this image at runtime. |
| Amaru head, Arequipa arena | Original art generated with ImageGen | Prompts and preparation: [docs/PHASE3_ASSETS.md](docs/PHASE3_ASSETS.md). Sources preserved in `assets/source/`. |
| HUD font | Original 5x7 pixel glyphs, including Spanish accents | `src/game/retroFont.ts`. |
| Sound effects | Synthesized in the browser with Web Audio | `src/game/sfx.ts`. No audio files or samples. |
| Palette mode | Four-green palette inspired by classic handheld LCDs | Colors only; no third-party art or code. |

## Procedural placeholders (Ruta 01)

These are drawn in code at runtime as stand-ins. They are original, but they are **not** final art; each one waits for an approved asset listed in [docs/design/ASSET_REQUESTS.md](docs/design/ASSET_REQUESTS.md).

| Placeholder | Code | Pending request |
|---|---|---|
| Glitchling (two wiggle frames and a hit flash) | `src/game/textures.ts` | `BUG_GLITCHLING` |
| Fragment (gold ring with a hanging knot) | `src/game/textures.ts` | none yet |
| Firewall column | `src/game/textures.ts` | none yet |
| Marea del Desfase strip | `src/game/textures.ts` | none yet |
| Amaru body segment, tail and core | `src/game/amaruArt.ts` | `AMARU_SEGMENT`, `AMARU_TAIL`, `AMARU_CORE` |
| Amaru bolts (rhombus, round orb, returned bolt) | `src/game/amaruArt.ts` | none yet |
| Corrupted Amaru head, arena dim and hit flash | Derived at runtime from the Amaru head and arena art (`src/game/amaruTextures.ts`) | — |
| Restored Amaru head | The original Amaru head art, shown once the corruption overlay recedes | `AMARU_RESTORED` |
| Four-green variants of every sprite | Derived at runtime by palette mapping (`src/game/nokiaPalette.ts`) | — |

## Rights

The MIT license covers the source code. The art in `assets/` was created for this project; all rights in it are reserved by the project authors until a separate license is chosen. Generated art may carry the usage terms of the tool that produced it.

## Inspiration (principles only)

Nokia-style horizontal shooters, boss-driven action games and atmospheric exploration games inspire the pacing and readability goals (see `docs/design/GAME_VISION.md`). No code, artwork, characters or levels from any existing game are used.
