# Ruta 01 flight MVP (v0.2 to v0.5 combined, deploy last)

## Objective and authorization
User approved on 2026-10-12: pivot to free flight; build every step of `docs/design/LEVEL_DESIGN.md` Ruta 01 without discarding any; in-game text in Spanish; tests applied; deploy only at the end. Canon: `docs/design/` (GDD, COMBAT_DESIGN, LEVEL_DESIGN, NARRATIVE_SCRIPT, CHARACTERS, WORLD_MAP, ART_BIBLE). Gap analysis: `docs/AUDIT_DESIGN_V1.md`.

## Invariants
- Phaser 3.90 + TS + Vite, 320x180, nearest-neighbor, Canvas and WebGL both supported (Canvas ignores sprite tint: derive textures instead of tinting).
- Pure, unit-tested rules for every decision (movement, timeline, score, REVERSE state machine, boss phases, shield). Scenes stay thin.
- Owned clocks only. Two clocks in combat: real clock (player, UI) and world clock (enemies, boss, projectiles) scaled during REVERSE. Focus loss and Esc pause freeze both.
- Bounded pools for every projectile, enemy and particle.
- Exact four-green Nokia palette while REVERSE is active (existing conversion system).
- Existing art is placeholder; procedural placeholders for Glitchling, fragments, Firewall, Marea and Amaru body segments are labelled as such. Asset requests go to the user.
- Reduce-motion, sound (sfx.ts), focus pause, view/DOM bridge keep working.
- In-game and page text in Spanish (uppercase bitmap font gets Spanish glyphs). Code, identifiers, comments and technical docs in English.

## Design values (canon tentative values; tune by playtest, not by inertia)
| Item | Value |
|---|---|
| Kipu flight | 8-direction, normalized speed 110 px/s, no gravity, clamped to play area (y 18..176) |
| Kipu HP | 4, invulnerability 1100 ms after damage |
| Kipu shot | horizontal right, 230 px/s, cooldown 180 ms, pool 12 |
| Controls | Move WASD/arrows; fire Space/J (Z alias); PachaShift Shift/K (X alias); pause Esc (P alias); R retry; M map |
| Route length | about 75 s, timeline by elapsed route time, auto-scrolling parallax |
| Glitchling | spawns right, drifts left 45 px/s, chases Kipu in y (max 40 px/s), 2 HP, contact damage 1, score 75 |
| Fragment | collectible, score 100, +20 REVERSE meter (meter carries into the boss) |
| Firewall obstacle | vertical barrier columns scrolling left with one telegraphed gap; contact damage 1; shots cannot pass |
| Marea del Desfase | purple interference front advancing from the left edge during its segment; contact drains 1 HP per invulnerability window; fragments placed ahead to tempt |
| Threshold | enemies stop, silence, repeating visual pattern, line "ALGO REPITE UN PATRON..." then transition to Amaru |
| Score (provisional, not approved) | 100 x fragments + 75 x bugs + 200 x returns + 10 x max(0, 300 - seconds) |
| REVERSE | meter 0..100, +10 per Kipu hit on boss or enemy, +20 per fragment; Shift when 100; 800 ms real time; world scale 0.2; capture radius 28 px; up to 6 captures; captured orbit Kipu and are harmless; on end auto-return to Amaru as allied shots (3 damage each, break shield); recovery 1500 ms; states CHARGING > READY > SLOW > RELEASE > RECOVERY |
| Capturable vs dangerous | capturable = rhombus bolts; non-capturable = round orbs and the wave (different silhouettes, not only color) |
| Amaru HP | 100; phases by HP: 1 at 100-67, 2 at 66-34, 3 at 33-0 |
| Phase 1 Aprendizaje | triple pulse (3 aimed round orbs, dodge-only); normal shots deal 1 |
| Phase 2 Estrategica | loop pattern of capturable rhombus bolts; shield (6 HP) blocks normal shots; only returned bolts damage the shield; broken shield opens a 4 s vulnerability window; core awakens: first entry fills the meter once with message "EL NUCLEO DE KIPU DESPIERTA" |
| Phase 3 Final | bursts mixing rhombus and orbs, a non-capturable wave with a telegraphed gap, then a vulnerability window (double damage) |
| Liberation | at 0 HP: attacks stop, purple recedes (corrupted texture crossfades to normal), arena color wave, dialogue, Codex entry, result screen |

## Story text (from NARRATIVE_SCRIPT; tentative lines kept tentative)
- Intro: "LAS RUTAS SE ESTAN APAGANDO" (with proper accents once glyphs exist: "ESTÁN").
- Amaru phase 2: "PROTEGER... REPETIR... REINICIAR..."
- Epilogue: "AMARU: OTRA VEZ... ESTABA CONDENADO A REPETIRLO." / "KIPU: ENTONCES CAMBIEMOS EL FINAL."
- Codex: "UN BUCLE REPITE INSTRUCCIONES, PERO REPETIR NO SIEMPRE SIGNIFICA AVANZAR." plus "FRAGMENTO LOOP ENCONTRADO". No cultural facts without sources.
- Map: Arequipa node "SANTUARIO DE LA TRAMA" corrupted before, restored after victory; other routes "BLOQUEADAS" without naming cities (order not approved).

## Tasks
- [x] F1 Foundation and route (delegated writer): free flight, controls, Esc pause, Spanish glyphs and copy, HUD (hearts, energy, score), pure rules (flight, timeline, score, glitchling, firewall, marea), RouteScene replacing ArcadeScene with all route steps 1-6, map update, carried state into GuardianScene, unit tests.
- [x] F2 Amaru and REVERSE (delegated writer): free-flight guardian, REVERSE state machine with world/real clocks, three phases, shield, wave, vulnerability windows, procedural modular body segments, corruption and liberation, dialogue, Codex, result screen with score, unit tests.
- [ ] F3 Verification (delegated): rewrite browser smoke for the new flow in Canvas and WebGL, docs (README, CREDITS, VERIFICATION), asset requests file.
- [ ] F4 Deploy (last, needs user go-ahead): merge, push, Pages, Cloudflare backup.

## Route declaration
F1 and F2 touch many non-trivial files: delegated to one writer each, sequentially (single writer at a time). Parent reviews diffs, spot-checks one command per task, and commits each task as a work unit on `feat/release-polish`.

## Progress
- F1 (delegated writer, mapping+writer triggers): RED observed (23 failing tests, 3 suites missing modules) then GREEN. Writer: typecheck pass, 104/104 unit tests, build pass, headless probe (route runs, no gravity, no errors), full 70 s route reached guardian with carried state. Parent spot check: `npm.cmd test` 104/104, typecheck pass. Known gaps for F2: guardian shift still old cooldown (meter display only). Accented glyphs read like small caps; needs visual sign-off or a taller cell. Browser smoke obsolete until F3.
- F2 (delegated writer): RED observed (3 suites missing modules, 9 failing tests; later 3 in amaruRules). Writer: typecheck pass, 151/151 unit tests, build pass; keyboard-only bot reached victory in WebGL (attempt 2, 41.6 s) and Canvas (attempt 1, 53.0 s) through all phases, REVERSE scale 0.2, captures <= 6, shield damaged only by returns, liberation > dialogue > codex > result > map restored, exact four-green Nokia frame, zero errors. Parent spot check: 151/151, typecheck pass. Risk high by size (1846+/381-): F3 acts as independent verifier. Balance untested by humans; accented glyphs still small-cap looking; AMARU_SEGMENT/TAIL/CORE/RESTORED placeholders.
