# Polish phases (from the 2026-10-13 playtest, after v0.5 went live)

Live: https://andrewmechdev.github.io/pachabyte/ (GitHub Pages from `main`). Playtest verdict: fun, Amaru beatable but costly; route longer and harder; UX/UI and visuals need polish. The user authorized pushing each verified phase to `main` to deploy ("ir deployando fast"). Every phase ends playable and deployable.

## Phase P1 — Survivability and balance (deploy v0.6)
Goal: a casual player reaches Amaru healthy and can beat him in about 2-3 minutes.
- Umbral: +1 heart (max 4) and the REVERSE meter raised to at least 60 when the threshold starts; shown with a short Spanish cue.
- One extra Corazón on the route (about 70 s, after Memory Leak) while keeping at most 2 on screen.
- Ráfaga: duration 6 s → 9 s, each Ráfaga shot deals 2 damage to enemies and to Amaru (the shield still deflects normal and Ráfaga shots).
- Amaru: maxHP 100 → 80 with phase thresholds derived as fractions (phase 2 at 2/3, phase 3 at 1/3); Kipu enters the fight with at least 3 hearts and one Escudo; an extra Corazón at phase 3 start.
- Racha vs Amaru: at racha ×3 and ×4 each boss hit charges the meter more (15 → 25), so REVERSE comes back faster.
- Tests first; keep the browser pilot green; document the new values as "playtest 2026-10-13 round 2".

## Phase P2 — Juice (deploy v0.7)
- Ráfaga and normal bolts: animated sprite-like bolts with flicker tails and an impact burst (procedural now; swap to the `SHOTS` asset when delivered).
- Amaru liberation: when he falls, small Glitchlings, Corruptors and Sombras (the real sprites) burst out of him, fly away and dissolve into sparkles while the purple recedes and he is freed.
- Loop node: redesign as an original all-seeing eye relic with tentacle cables (procedural placeholder now; `LOOP_NODE_EYE` later), with hit, crack and shatter feedback. It must not copy any existing named artifact.

## Phase P3 — Energy has a use on the route (deploy v0.8)
- "Pulso de la Trama": Shift/K on the route with at least 60 meter spends it for a radial pulse (about 80 px): clears enemy orbs and embers' damage in range, deals 2 damage to bugs in range, short invulnerability window; HUD hint "SHIFT: PULSO" when available. In the Amaru fight Shift keeps its REVERSE meaning (meter 100). Pure rule and tests first; reduced-motion safe; sound and an effect.

## Phase P4 — UX/UI and visual identity (deploy v0.9)
- Map screen: declutter. A title, the selected node as a card (name, state, one action line) and a short key bar; far less text. Show Arequipa restored, other routes locked with an "EN CONSTRUCCIÓN" feel (flicker, scaffolding) so it reads as a living, unfinished world. Procedural map now; `MAP_TRAMA` art later.
- Page buttons: thematic restyle (neon edges, chakana-step cut corners, cyberpunk-Andean palette beyond turquoise). Sound and Reducir movimiento move into one "Ajustes" disclosure.
- Reduce motion: keep it (it honors the OS preference and helps people sensitive to motion, flashes and shake), but out of the main button row.
- Page background: cyberpunk-Andean night in CSS now; `PAGE_BG` later. Title wordmark with a chullo: styled text now; `LOGO_PACHABYTE` later.
- Route backdrop: corrupted neon-night sky that fades in as the route progresses (`BG_ROUTE_NEON` when delivered).

## Phase P5 — Final (deploy v1.0)
- Integrate delivered art through `tools/prepare_sprite.py` (`--auto` for uneven sheets), update CREDITS, README screenshots and VERIFICATION.
- Full serial smoke in WebGL and Canvas, then human playtest, then push.

## Working rules for every phase
Single writer per task; tests first (observe RED); parent spot-checks typecheck and unit tests, reads at least one capture, commits as a work unit with a Conventional Commit message (no AI attribution); then merge fast-forward to `main` and push; confirm the Pages run finished and the live bundle hash matches.

## Status
- [x] v0.5 live (`530296e`).
- [x] P1 (v0.6): umbral heal, 3rd Corazón at 71.95 s, Ráfaga 9 s x2 damage, Amaru 80 HP (53/26), entry with >=3 hearts + Escudo, phase 3 Corazón, racha x3/x4 charges +25. RED observed; 308/308; pilots won first attempt in WebGL x3 and Canvas x1.
- [x] P2 (v0.7): animated Kipu/Ráfaga bolts with impact bursts (invisible 6x3 physics bodies, separate display images), Amaru liberation burst (10 real bug sprites fly out inside the recede stage), loop node as an original eye relic (HP 5, hitbox unchanged), all procedural placeholders for SHOTS and LOOP_NODE_EYE. RED observed; 347/347; smoke passed WebGL x2 and Canvas x1 (parent re-run). Writer saw 2 pilot-dependent failures in 4 WebGL runs (baseline shows the same kind).
- [ ] P3
- [ ] P4
- [ ] P5
Art requested (round 2): `docs/design/ASSET_REQUESTS_V2.md`.

## Parallel tracks (from 2026-10-13, images received)
- **Track A (main folder, branch `feat/polish-phases`)**: all gameplay code. P2 in progress, then P3, merge Track B, Ajustes disclosure + smoke update, integrate `SHOTS`, `LOOP_NODE_EYE`, `BG_ROUTE_NEON`, README, final QA, deploy.
- **Track B (worktree `hack-the-andes-game-worktrees/track-b`, branch `feat/track-b-ui-map`)**: prepare the 6 received images, MapScene redesign with `MAP_TRAMA`, page UI with logo and `PAGE_BG`. Brief: `docs/PARALLEL_BRIEF.md`. Never pushes; no overlap with Track A files.
- Merge order: Track A merges P2, then merges `feat/track-b-ui-map` (disjoint files), runs the full smoke, then deploys.
