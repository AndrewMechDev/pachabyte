# Animation and Feedback Polish

## Objective and authorization
User asked (2026-10-12): "agregale las animaciones y demas". Treated as explicit scope approval for **visual animation and hit/feedback polish** using the existing prepared art. Audio, new regions, persistent saves, new mechanics and new image requests are NOT covered (AGENTS.md: still deferred); audio is raised as a separate question.

## Constraints (preserved invariants)
- Kipu identity: 32x40 frame, occupied alpha bottom row 32, eye glints at (22,19)/(26,20), body 12x18 offset (10,14). No sprite scaling on physics sprites (Arcade body follows scale).
- Combat balance, timings, HP, capture/return unchanged. Animation reads state; it never writes gameplay state.
- Exact four-green Nokia palette must hold while PachaShift is active: every effect/frames has a Nokia variant, no blended colors.
- All animation time comes from each scene's owned clock so focus pause freezes it. Bounded particle pool; no unbounded allocation.
- No new image assets: Kipu frames are derived row-edits of `kipu-v4-32x40.png` (bottom row fixed, eye rows untouched); Amaru uses rotation/flash on the existing head.

## Tasks
- [x] ANIM-1: Pure rules `src/game/animation.ts` (pose selection, row reshape, particle pool step, boss pose by attack stage) + unit tests (RED first).
- [x] ANIM-2: Kipu derived frames (idle/bob/squash/stretch + Nokia variants), pose-driven in ArcadeScene and GuardianScene; run/jump/land/idle breathing; dust + muzzle flash.
- [x] ANIM-3: Training feedback: target hit burst/flash, target glint, completion sparkle.
- [x] ANIM-4: Amaru: idle sway, anticipation rear-back + mouth charge, action lunge, recovery droop, hit flash, shot sparks, defeat/victory burst; hero hit feedback; PachaShift aura breathing + capture/return particles.
- [x] ANIM-5: Map scene: Amaru idle sway, blinking Enter prompt.
- [x] ANIM-6: Update browser smoke (Kipu texture family, new anim assertions), run unit/type/build + Canvas/WebGL serial on an owned port; docs (GDD/ART_BIBLE/VERIFICATION) with honest limits.

## Route declaration
Inline direct by parent: full source and tests were already read into parent context; a writer handoff would duplicate ~25k tokens of reading. Full-suite output kept to tails. No commits: repository has no initial history and Git bootstrap is not authorized.

## Verification plan
`npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:browser` in Canvas and WebGL against an owned preview port (never 4173), run serially. Human game-feel acceptance stays pending.


## Progress, October 12, 2026
- [x] ANIM-1 pure rules + tests (RED observed for animation.test.ts; kipuAnimator tests written after implementation, no RED claimed).
- [x] ANIM-2 Kipu derived frames, pose-driven in both scenes; dust, muzzle sparks.
- [x] ANIM-3 Training: target burst and glint, HUD flash, completion burst and confetti.
- [x] ANIM-4 Amaru pose/charge/flash/bursts, hero hit burst and camera shake, PachaShift ring, aura breathing, capture/return sparks, victory/defeat sequences.
- [x] ANIM-5 Map head sway and pixel cursor.
- [x] ANIM-6 Browser smoke updated (texture family, new frame/angle/victory assertions), docs appended. Serial WebGL and Canvas passed 22 groups each on owned port 4175; typecheck, 58/58 unit tests and build passed.

Evidence and limits live in docs/VERIFICATION.md. No commits (no HEAD). Not done: audio, screen transitions (fades risk the exact-pixel Nokia sampling), articulated Amaru, hand-drawn Kipu spritesheet.
