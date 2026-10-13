# Preparing user-generated sprites

Image chats rarely hit an exact native size, so requests in `docs/design/ASSET_REQUESTS.md` ask for an 8x pixel grid and accept a flat `#FF00FF` background. Adapt them with:

```bash
python -I tools/prepare_sprite.py <source.png> assets/prepared/<id>-<w>x<h>.png --frame <W>x<H> --cols <n> [--rows <m>]
```

1. Keep the source untouched in `assets/source/` (or `assets/incoming/`); write only the prepared copy.
2. Read the report: integer scale, opaque color count, per-frame occupied bounds. A `touches ... edge` warning means the art was probably cropped; ask for a regeneration instead of guessing.
3. Inspect the prepared PNG at native size in the game scene before integrating; visual size, pivot and hitbox stay separate decisions.
4. Record source, prompt ID, size and status (`review → approved → integrated → verified`) in `docs/design/ASSET_REQUESTS.md` and `CREDITS.md`.

Verified on 2026-10-13: an 8x magenta copy of `kipu-v4-32x40.png` round-trips with 0 pixel differences and the same occupied bounds (4,9)-(29,32).
