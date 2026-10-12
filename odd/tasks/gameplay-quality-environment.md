# Gameplay Quality and Environment

## Objective and authorization

User supplied ground/platform screenshots, reported excessive separation, requested a reusable local videogame-practices skill inspired by Cuphead, Hollow Knight and Space Impact, and authorized continuing the next phase. Deliver the grounding fix and coherent procedural environment while preserving the practice game's mechanics.

## Findings

The prepared 32×40 sprite has alpha bounds (4,9,29,32), bottom exclusive. Origin Y 30 gives visible bottom player.y+2, but preserved collision bottom is player.y+10: an 8 logical-pixel gap. Change visual origin to (0.5,0.55) and body offset to (10,14), keeping the collider 12×18 at relative (-6,-8). Align the lowest visible scarf pixels, not the whole decorative outline.

## Scope and acceptance

- Create `skills/pachabyte-gameplay-quality/SKILL.md` plus a concise sourced reference; register in AGENTS and the skill registry. Do not install or modify global skills.

- Fix visible gap to at most 1 logical pixel on ground and platforms, both directions and restart; preserve original assets and physics/input/camera/projectile tuning.

- Distinguish playable surfaces from decorative town roofs; mute background contrast and retain Kipu/target readability. Procedural scenery remains provisional.

- Keep boss, PachaShift, damage, victory/end-state, audio, touch, backend, publication and event eligibility outside this increment.

- Git metadata now exists but has no HEAD and all files are untracked. Do not bootstrap initial history, mass-stage or publish. Correct stale documentation, not repository state.

## Tasks and route

- [x] QUALITY-1: Create and register compact gameplay-quality skill; validate frontmatter/references/index. Delegated direct: multi-file instructions and researched standards.

- [x] QUALITY-2: Observe meaningful browser RED for the actual 8px alpha-ground gap; correct origin/offset and observe GREEN. Delegated direct: bugfix with regression coverage.

- [x] QUALITY-3: Improve procedural background/platform contrast and surface cues; preserve route geometry. Delegated direct: visual implementation and screenshots.

- [x] QUALITY-4: Typecheck, rules, build, browser regression, independent verification and scene screenshots; close roadmap and evidence honestly.

## Verification

Run `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, and owned free-port preview with `npm.cmd run test:browser` and `PACHA_URL`. Leave user's 4173 server alone; stop only owned processes. Inspect ground and platform screenshots. Skill/doc checks are structural, not a claimed gameplay test.

## Work boundaries and next step

Forecast approximately 300–380 authored lines, generated screenshots excluded; advisory only. RDD is read without toggling. Work-unit commits unavailable without an explicitly authorized initial repository bootstrap; preserve untracked state. Existing human art acceptance and occupied-core collision correspondence remain separate from mathematical bottom alignment. Complete the four tasks, then propose the smallest end-state challenge as the next gameplay phase, not an automatic boss implementation.

## Writer evidence and handoff

- QUALITY-1 implementation and structural validation complete; bundled validator blocked by absent PyYAML in both available runtimes. No installation performed. Independent structural checks and behavioral forward-testing passed; official automated validation remains unavailable, not passed.

- QUALITY-2 observed meaningful RED gap 8, then GREEN exactly 0 px via independent loaded-alpha checks; body 12×18 relative (-6,-8) unchanged.

- QUALITY-3 provisional scenery implemented; ground/platform screenshots inspected. Human visual acceptance pending.

- QUALITY-4 writer typecheck/rules 20/20/build/browser 14 checks passed; independent verifier repeated all functional checks successfully; parent typecheck and screenshot spot checks passed. Existing Phaser chunk/npm configuration warnings retained.

- Captures: `docs/quality-ground.png`, `docs/quality-platform.png`.

- No work-unit commit: initial Git history bootstrap is not authorized. No staging, branch, push or remote operation.

## Closure and next action

All four deliverable outcomes are observed. Official skill validation is unavailable due missing PyYAML; human visual acceptance and core-collider correspondence remain pending. Phase 2 procedural visuals are functionally complete, not polished final art. Phase 3's smallest objective/end-state remains proposed and requires defined scope approval. Parent task and registry memory mirrors are synchronized in Engram.

