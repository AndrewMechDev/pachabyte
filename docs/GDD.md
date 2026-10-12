# PachaByte — Minimal Game Design Document

The current local build extends the historical Sprint 0 foundation with map progression, one-phase Amaru and PachaShift (see the Phase 3 extension below). Sprint 0 originally proved: move Kipu, jump across a short provisional route, and shoot inert practice targets. It proves the core interaction loop, not a complete game or hackathon-ready submission.

**Status:** Implemented design baseline; observed functional coverage and limitations are recorded in [VERIFICATION.md](VERIFICATION.md).  
**Source:** Explicit user brief, October 11, 2026 (America/Lima), continuing “Juego Nokia clásico.”

## Player experience

**Loop:** Explore a side-view route → jump onto platforms → face a target → shoot → observe a hit → continue or restart.

The prototype should feel readable and responsive at a logical resolution of **320 × 180**. A wider world allows horizontal camera-follow to be tested without adding level progression. A safe continuous floor prevents softlocks; platforms and targets create a small practice space. There is no victory screen, health system, or failure state in Sprint 0.

## Approved direction

| Element | Decision |
| --- | --- |
| Format | Horizontal 2D arcade, desktop keyboard controls, 320 × 180 logical canvas |
| Protagonist | Kipu, an original Peruvian mascot with turquoise and gold identity |
| Visual direction | Hybrid retro Andean aesthetic, implemented here with simple generated shapes |
| Location cue | Provisional Arequipa-inspired scenery: pale sillar-like structures, warm ground, distant volcanic silhouettes |
| Approved local guardian | Amaru-01, one static phase and two telegraphed attacks |
| Approved signature mechanic | PachaShift: two-second capture/slowing and real reversal, four-green Nokia arena |
| Implementation | Phaser + TypeScript + Vite, with small modules and independently testable rules |

Scenery is an evocative original placeholder, not an accurate reconstruction of Arequipa or a claim about a specific cultural symbol. The current brief is authoritative; inaccessible assistant references do not establish extra approved mechanics or art specifications.

The approved [Kipu concept sheet](../assets/references/kipu-approved-concept.png) records Kipu's visual identity; see the [Art Bible](ART_BIBLE.md) for its visual boundaries. It is concept art, not a production spritesheet or frame-ready asset.

## Controls and feedback

| Action | Keys | Behavior |
| --- | --- | --- |
| Move | A/D or Left/Right | Constant horizontal speed; opposing inputs cancel |
| Jump | W, Space, or Up | One jump per key press, only while grounded |
| Shoot | J or Z | Hold to fire at a bounded cadence in the last facing direction |
| Restart | R | Reset Kipu, targets, projectiles, camera, and feedback |

Initial facing is right. Releasing movement stops horizontal motion while preserving facing. A fixed HUD shows controls and hit feedback. Shooting produces visible projectiles; an impacted target visibly changes or disappears and increases a hit counter once. Targets are inert, not enemies. The page explains that the canvas must have focus for keyboard input.

## Sprint 0 scope

- Horizontal movement, gravity, grounded jumping, floor/platform collisions, and world bounds.
- Directional projectiles with cooldown, a fixed pool, and cleanup after impact, expiry, or leaving the world.
- A short wider-than-screen practice world with camera-follow and static targets.
- Original generated Kipu placeholder and layered provisional scenery; readable nearest-neighbor scaling.
- Local Windows/PowerShell setup, production build, available automated tests, and an honest verification record.

### Historical Sprint 0 non-goals

No Amaru-01 fight, PachaShift implementation, enemy AI, combat damage, mobile controls, audio, menus, saves, final animation, external art pipeline, hosting, publishing, or hackathon submission. The approved Kipu concept sheet is **not** a usable spritesheet or frame-ready game asset.

## Acceptance criteria

| ID | Observable outcome |
| --- | --- |
| G1 | The local app boots to a visible 320 × 180 logical game canvas without runtime errors in an available tested browser. |
| G2 | Both movement key sets work; opposite directions cancel; released controls stop motion; Kipu remains inside world bounds. |
| G3 | Each supported jump key starts an upward jump only from the ground; Kipu lands on the floor or a platform without passing through it. |
| G4 | Projectiles travel toward the retained facing direction, respect cooldown, hit a target once, and never exceed the pool limit. |
| G5 | The camera follows Kipu into the wider world while HUD information remains fixed on screen. |
| G6 | Restart restores the initial practice state; losing focus does not leave held movement/fire active. |
| G7 | A reader can install, run, test, and build using the documented Windows/PowerShell commands. |
| G8 | Verification distinguishes rules tests, typechecking, build, browser integration, and any unavailable manual checks. |

## Development method and provenance

Apply the [obra/superpowers](https://github.com/obra/superpowers) sequence: establish the design, write an exact-file plan, implement test-first where a meaningful deterministic test exists, and verify before claiming completion. The user explicitly requested documentation followed by implementation; proceeding without another design approval pause is a disclosed adaptation. This does not claim the plugin is installed or that every approval gate of its workflow was followed verbatim.

The approved Kipu concept sheet is documented in the [Art Bible](ART_BIBLE.md); it does not define production sprite dimensions or animation requirements. New creative or gameplay scope requires a separate decision.

## Event boundary for the approved local build

The user clarified local preselection before October 14, with winners shown later, waived email evidence and approved local Phase 3. This is user-reported, not independently verified official rules. Do not block the approved local build on the stale email gate or declare competition eligibility. Publishing, submission, remote transfer and initial Git history remain separately unauthorized.

## Historical next-sprint proposals (Phase 3 now approved below)

1. Validate movement feel and technical stability; define a real art/animation specification and cultural-reference review.
2. Add an enemy/combat slice and define Amaru-01 behavior only after the core loop is validated.
3. Prototype PachaShift's monochrome transition and its gameplay purpose as a separate mechanic.

Actual sequencing depends on playtesting, scope approval, and any applicable hackathon restrictions. See [the implementation plan](IMPLEMENTATION_PLAN.md) for exact files and checks.

## Approved Phase 3 local extension

Preceding Sprint 0 scope is the historical foundation, not the current content limit. Map → four training targets → unlocked one-phase Amaru → victory/defeat/retry is now approved. Other regions are future/non-playable. Session-only registry progress resets on refresh. Training movement, jump, collision, camera and shot tuning are preserved.

Amaru alternates sampled aimed triple pulses and a sampled marked falling-rune column, with anticipation/action/recovery. Hero HP 3; Amaru HP 12; ordinary damage 1; returned damage 3; invulnerability 900ms. X activates for 2s, slows enemy velocity to 0.35×, captures up to three bolts within radius 52, then returns them once; cooldown 4s after expiry. Excess bolts remain harmful. Nokia mode transforms the complete arena into four greens without changing alpha, frames or hitboxes.

R retries; M returns to map; Enter returns after an outcome. Terminal combat stops harmful spawning/projectiles. Blur freezes owned combat clock/physics and clears held input. No audio, backend, full animation, extra worlds or three-phase boss is approved.

## Phase 3 functional closure

Writer and independent verifier observed 33/33 unit tests, typecheck/build exit 0, and 19/19 real-keyboard browser groups in both actual Canvas and WebGL. Exact four-green Nokia rendering, returned damage, complete challenge outcomes and retained training regressions passed. Parent typecheck and screenshot checks passed. See [verification](VERIFICATION.md) for evidence and retained limitations.

Human visual/game-feel acceptance remains pending. Phase 4 local release/manual QA is proposed; no clean install, wider-device/OS-focus coverage, native approval, official eligibility verification, Git bootstrap or remote delivery is implied.

## Phase 3 functional closure

Writer and independent verifier observed 33/33 unit tests, typecheck/build exit 0, and 19/19 real-keyboard browser groups in both actual Canvas and WebGL. Exact four-green Nokia rendering, returned damage, complete challenge outcomes and retained training regressions passed. Parent typecheck and screenshot checks passed. See [verification](VERIFICATION.md) for evidence and retained limitations.

Human visual/game-feel acceptance remains pending. Phase 4 local release/manual QA is proposed; no clean install, wider-device/OS-focus coverage, native approval, official eligibility verification, Git bootstrap or remote delivery is implied.

## October 12, 2026 — direct demo access correction

The preceding gated Phase 3 loop is a historical record, superseded for this local demo. Both challenges are immediately available: Enter/2 or Play Amaru enters the guardian, and 1 or Explore Arequipa enters training. Training completion and guardian victory still represent real earned session achievements; access never fabricates them.

Contextual DOM controls/title/outcomes use typed scene events, with navigation focus pausing physics and owned clocks. Existing Amaru/arena art previews identify the choices; the arena source repeats at its native aspect ratio as a muted parallax route background. All terrain, collider and combat tuning stays unchanged. Human visual/game-feel acceptance and parent live-browser audit remain separate checks.
