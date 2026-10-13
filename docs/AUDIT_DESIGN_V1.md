# Audit: Design package v1 vs. current build (October 12, 2026)

**Verdict.** The user's package `PachaByte_Documentacion_v1/` is the canon to build and present. The current build is a sound technical base but implements a different genre: a gravity platformer with a training route, where the canon is a free-flight horizontal shooter route that ends in a restorative boss fight. Keep the engine, systems and tests; change the player model, the route and the Amaru fight in deployable phases.

## Gap table

| Area | Canon (package v1) | Current build (verified in code) | Gap |
|---|---|---|---|
| Player movement | Kipu floats, moves freely in screen (GDD "Interacciones"; no legs in ART_BIBLE) | Gravity 750, jump 250, platforms (`src/game/rules.ts:5`, `src/main.ts:36`) | **Critical**: core pivot to free flight |
| Route | Arequipa route: Glitchlings chase Kipu, fragments, score, one obstacle, optional Marea, sanctuary threshold, then Amaru (LEVEL_DESIGN) | Four static targets on platforms; separate scene; Amaru is a sibling choice, not the destination | **Critical**: route must become the path to the boss |
| Enemies | Glitchling (1 species for MVP), purple base, distinct silhouette | None | Missing; needs placeholder + asset request |
| Score / fragments | Fragments, simple score, HUD with life, energy, score, boss HP | None (`grep` finds no score/fragment code) | Missing |
| PachaShift | Meter charged by hits or pickups, 0.8 s real time, world at 20 %, radius 28 px, up to 6 captures orbiting, auto-return, recovery; Shift/K | Timer cooldown 4 s, active 2 s, world slow 0.35, radius 52, capacity 3; key X (`combatRules.ts:1`) | Rework values and states; keep the Nokia palette system |
| Amaru | 3 health-based phases (triple pulse, loops + capturable shots + shield, bursts + non-capturable wave + vulnerability window); shield breaks only with returned shots; freed, not killed | 1 phase, 2 attacks, 12 HP, fades on victory | Expand; add restoration ending |
| Restoration / story | Intro line, Amaru "Proteger... repetir... reiniciar...", purple recedes, color returns, Codex entry, LOOP as discovery | None | Missing; cheap and high value |
| Controls | WASD/arrows move, Space/J fire, Shift/K PachaShift, Esc pause | A/D/arrows, W/Space/Up jump, J/Z fire, X shift, R/M | Rebind; keep old keys as aliases where they don't conflict |
| Player HP | 4 lives (illustrative) | 3 | Tuning only |
| Art | Kipu ~32×32 in 48×48 cell; Amaru modular (head 48, segments 24, tail 32, core 16); corrupted and restored states | Kipu 32×40 static, Amaru head 64×64 static, arena backdrop | Usable as placeholders; asset requests needed for Glitchling, Amaru segments/tail/core, restored head |
| Asset policy | Agent must issue an ASSET REQUEST before definitive assets | Derived Kipu frames and flash silhouettes are runtime edits of existing art | Label them as placeholders; no new definitive art was introduced |
| Accessibility | Avoid intense flashes and extreme camera; pause; visual tutorial | Reduce-motion toggle, focus pause; no Esc pause, no tutorial | Add Esc pause and contextual hints |
| Language | Design docs in Spanish | Code/tech docs English; UI copy English | Decide in-game language |
| Policies | Package `AGENTS.md` (asset requests, report format) | Repo `AGENTS.md` | Merge: package rules add to, not replace, repo boundaries |

## What stays (no rework)

Phaser + TS + Vite, 320×180 pixel scaling, four-green Nokia conversion, bounded pools, owned scene clocks and focus pause, telegraph drawing, particles, synthesized sound, reduce motion, browser smoke harness, Pages workflow, existing Kipu/Amaru/arena art as placeholders.

## Phased delivery (each phase deployable)

| Version | Player-facing result | Main work |
|---|---|---|
| v0.1 preview | Current build online so people can try PachaShift and Amaru now | Merge + push (pending user) |
| v0.2 Flight route | Kipu flies; 60–90 s Arequipa route with Glitchlings, fragments, score, HP 4; route ends at Amaru | Free-flight movement, auto-scroll route scene, enemy spawner, score/HUD, intro line, Esc pause |
| v0.3 REVERSE | Canon PachaShift: charged meter, 0.8 s at 20 %, capture 6 in 28 px, orbit, auto-return | Separate world/real clocks, state machine CHARGING→READY→SLOW→RELEASE→RECOVERY, capturable rhombus vs. non-capturable shapes |
| v0.4 Amaru freed | 3 health phases, shield broken by returns, restoration ending with dialogue and color wave | Phase controller, shield, non-capturable wave, restored state, result screen |
| v0.5 Route depth | One obstacle (Firewall), short Marea sequence, Codex entry, Arequipa node restored on map | Only if earlier phases are solid |

## Decisions needed from the user

1. Approve the pivot from platformer to free flight (blocks v0.2).
2. In-game text language (Spanish matches the design docs; current UI is English).
3. Where the package lives in the repo (proposal: `docs/design/` as the Spanish canon, linked from README) and how its `AGENTS.md` merges with the repo one.
4. Asset requests to send to the art chat: `BUG_GLITCHLING` first (placeholder until delivered).
