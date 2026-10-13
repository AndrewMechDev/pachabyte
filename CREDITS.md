# Credits and provenance

PachaByte is an original project. Nothing here is copied from another game.

| Asset | Source | Notes |
|---|---|---|
| Code | Written for this project | MIT, see [LICENSE](LICENSE). Phaser 3 (MIT) is the only runtime dependency. |
| Kipu (`assets/prepared/kipu-v4-32x40.png`) | Original character, generated with ImageGen, adapted by nearest-neighbor sampling from `assets/incoming/kipu-v1.png` | Concept: `assets/references/kipu-approved-concept.png`. Animation frames are derived row edits of this image at runtime. |
| Amaru head, Arequipa arena | Original art generated with ImageGen | Prompts and preparation: [docs/PHASE3_ASSETS.md](docs/PHASE3_ASSETS.md). Sources preserved in `assets/source/`. |
| HUD font | Original 5x7 pixel glyphs | `src/game/retroFont.ts`. |
| Sound effects | Synthesized in the browser with Web Audio | `src/game/sfx.ts`. No audio files or samples. |
| Palette mode | Four-green palette inspired by classic handheld LCDs | Colors only; no third-party art or code. |

## Rights

The MIT license covers the source code. The art in `assets/` was created for this project; all rights in it are reserved by the project authors until a separate license is chosen. Generated art may carry the usage terms of the tool that produced it.

## Inspiration (principles only)

The Nokia-style horizontal shooter genre inspires a possible future stage. No code, artwork or levels from any existing clone are used.
