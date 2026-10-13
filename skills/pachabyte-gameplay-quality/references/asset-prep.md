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

## Auto mode (sheets not on an exact grid)

Image chats usually ignore the requested 8x grid and draw on a finer one (8-18 source px per art pixel), with frames at uneven positions and sometimes a soft halo. Use:

```bash
python -I tools/prepare_sprite.py <source.png> assets/prepared/<id>.png --auto [--row N] [--target WxH] [--factor F] [--colors 8] [--anchor center|bottom]
python -I tools/prepare_sprite.py --self-test
```

It splits sprites by transparent gaps (loose particles merge into their frame), picks a binary alpha threshold above the halo population (128 for all sheets so far), estimates the art-pixel pitch per sprite body, reduces by a whole factor with a coverage vote when the natural size exceeds the target, and places frames in equal cells aligned on each frame's main body. Exact commands used for each integrated asset are recorded in `docs/design/ASSET_REQUESTS.md`.
