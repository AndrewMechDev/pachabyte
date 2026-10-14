# Project contribution guidance

## Purpose and scope

This folder is the canonical PachaByte project. **The design canon is `docs/design/` (Spanish, package v1, adopted 2026-10-12)**: read `docs/design/AGENTS.md` and `docs/design/DECISIONS.md` first. Its rules add to this file; where they conflict on game design, `docs/design/` wins, and on repository, Git and remote boundaries this file wins.

Approved by the user on 2026-10-12: pivot from the old gravity platformer to free flight; build the full Ruta 01 of `docs/design/LEVEL_DESIGN.md` (arrival, Glitchlings, fragments and score, one obstacle, Marea del Desfase, sanctuary threshold, Amaru-01 with three health phases and REVERSE, liberation, Codex and score) before deploying; in-game text in Spanish (code, identifiers and technical docs stay English). Older docs in `docs/` (GDD, PROJECT_PLAN, VALIDATION_PLAN) are historical where they describe the platformer. The gap analysis is `docs/AUDIT_DESIGN_V1.md`.

Missing definitive art follows `docs/design/ASSET_PIPELINE.md`: issue an ASSET REQUEST to the user and keep a clearly labelled procedural placeholder meanwhile. Remote publication requires separate authorization; the user asked for deploy last.

## Project map

- `src/main.ts`: browser bootstrap and Phaser setup.
- `src/game/` scenes (map, route, guardian), pure rules, animation, sound.
- `src/game/rules.ts`: pure gameplay decisions and tuning.
- `src/game/textures.ts`: procedural placeholder art.
- `tests/`: deterministic rules and browser smoke tests.
- `docs/design/`: canon design package (Spanish). `docs/`: audit, art bible, verification and history.

## Working method

Use the approved design as the source of truth. Before behavior changes, state the intended acceptance criteria, add or update a focused test, observe meaningful failure when a runnable deterministic test applies, implement the smallest coherent change, and run relevant checks. Before delivery, follow `docs/VALIDATION_PLAN.md`; never report a check as passed unless it was run in this checkout and its result observed. Keep tests and explanatory docs with their behavior changes.

Use English for code and technical documentation, matching the existing project. Keep placeholder geometry clearly distinguished from production artwork and spritesheets. Avoid introducing a backend, database, framework layer, or external service without a concrete approved requirement.

## Gameplay quality skill

Before gameplay, visual integration or input changes, read `skills/pachabyte-gameplay-quality/SKILL.md` and relevant supporting references. This project-local skill guides quality; it does not authorize deferred content or imply global installation.

## Art preparation policy

Follow [the Art Bible](docs/ART_BIBLE.md). Placeholder dimensions are not production-art limits: separate source resolution, runtime frame grid, displayed logical size, and physics hitbox. Preserve original assets and adapt usable larger sources rather than repeatedly requiring exact-sized image generation. Validate Kipu's identity and readability in the gameplay scene with crisp scaling; changing visual size never automatically authorizes collider or gameplay changes. The initial 32×40 logical-pixel evaluation target is provisional, not a universal asset size or a verified final fit.

## Repository and deployment boundaries

The repository has history on `main` and a public remote `origin` (https://github.com/AndrewMechDev/pachabyte). `main` deploys to GitHub Pages through `.github/workflows/pages.yml` (live: https://andrewmechdev.github.io/pachabyte/). Work on a feature branch or git worktree and commit per work unit with Conventional Commits; never add AI attribution or `Co-Authored-By` lines. **Pushing to `main` (which deploys) needs the user's explicit go-ahead in the current session.** Never force-push, never use ambient credentials, and never transfer files to other destinations without separate explicit authorization. Never delete a `node_modules` that may be a junction with `rm -rf`. Everything that is left to do, with the exact order and rules, is in `docs/CONTINUATION_PLAN.md`.

## Methodology

The project adapts obra/superpowers design, planning, test-first, and verification practices. Do not claim that Superpowers is installed or that its exact approval workflow was executed.
