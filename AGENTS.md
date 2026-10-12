# Project contribution guidance

## Purpose and scope

This folder is the canonical local PachaByte project. Preserve the approved MVP in `docs/GDD.md`: 320 × 180 side-view arcade, original turquoise-and-gold Kipu, movement, jump, shooting, practice targets, and provisional Arequipa-inspired scenery. The user approved a local Phase 3 slice: training completion, two functional map nodes, one-phase Amaru with two telegraphed attacks, HP/outcomes, and PachaShift capture/reversal. This local build does not require email evidence; preselection before October 14 with winners shown later is user-reported, not independently verified official rules. On 2026-10-12 the user also approved visual animation and feedback polish using existing art (`odd/tasks/animation-polish.md`). The user then approved synthesized WebAudio sound effects (generated in code, no audio files; `src/game/sfx.ts`). Hand-drawn production spritesheets, music, extra worlds, touch and backend remain deferred. Remote publication/submission still requires separate authorization.

## Project map

- `src/main.ts`: browser bootstrap and Phaser setup.
- `src/game/ArcadeScene.ts`: scene, input, physics, camera, targets, lifecycle.
- `src/game/rules.ts`: pure gameplay decisions and tuning.
- `src/game/textures.ts`: procedural placeholder art.
- `tests/`: deterministic rules and browser smoke tests.
- `docs/`: design baseline, project plan, decisions, and verification.

## Working method

Use the approved design as the source of truth. Before behavior changes, state the intended acceptance criteria, add or update a focused test, observe meaningful failure when a runnable deterministic test applies, implement the smallest coherent change, and run relevant checks. Before delivery, follow `docs/VALIDATION_PLAN.md`; never report a check as passed unless it was run in this checkout and its result observed. Keep tests and explanatory docs with their behavior changes.

Use English for code and technical documentation, matching the existing project. Keep placeholder geometry clearly distinguished from production artwork and spritesheets. Avoid introducing a backend, database, framework layer, or external service without a concrete approved requirement.

## Gameplay quality skill

Before gameplay, visual integration or input changes, read `skills/pachabyte-gameplay-quality/SKILL.md` and relevant supporting references. This project-local skill guides quality; it does not authorize deferred content or imply global installation.

## Art preparation policy

Follow [the Art Bible](docs/ART_BIBLE.md). Placeholder dimensions are not production-art limits: separate source resolution, runtime frame grid, displayed logical size, and physics hitbox. Preserve original assets and adapt usable larger sources rather than repeatedly requiring exact-sized image generation. Validate Kipu's identity and readability in the gameplay scene with crisp scaling; changing visual size never automatically authorizes collider or gameplay changes. The initial 32×40 logical-pixel evaluation target is provisional, not a universal asset size or a verified final fit.

## Repository and deployment boundaries

The canonical folder currently has Git metadata but no initial history (no HEAD). Do not bootstrap an initial commit, mass-stage files, create delivery branches, publish, push, deploy, use ambient credentials, or transfer files remotely without separate explicit authorization for the exact operation and destination. Conventional commit messages are appropriate after a repository is deliberately authorized and initialized; never add AI attribution or `Co-Authored-By` lines.

## Methodology

The project adapts obra/superpowers design, planning, test-first, and verification practices. Do not claim that Superpowers is installed or that its exact approval workflow was executed.
