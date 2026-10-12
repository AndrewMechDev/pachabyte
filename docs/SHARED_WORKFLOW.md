# PachaByte shared production workflow

This document coordinates development, visual production, and design tools around the same game identity. It complements the approved [GDD](GDD.md), [decisions](DECISIONS.md), and [stack assessment](STACK.md); it does not silently approve deferred mechanics or replace existing scope gates.

## Project identity

PachaByte is an original 2D arcade game with a retro-Andean identity. Its current playable baseline is the small desktop-browser movement, jump, and practice-shooting slice in the GDD. The broader creative direction proposed for future work combines:

| Reference | Borrow only as a high-level principle | Do not reproduce |
|---|---|---|
| Nokia-era *Space Impact* | Simple controls, side-scrolling arcade rhythm, readable survival pressure, monochrome nostalgia | Sprites, layouts, levels, sounds, or distinctive compositions |
| *Cuphead* | Expressive bosses, telegraphed attacks, theatrical combat | Character designs, animation, poses, or recognizable attack sequences |
| *Hollow Knight* | Environmental storytelling, mystery, exploratory atmosphere | Characters, maps, silhouettes, or distinctive environmental compositions |

The original identity is Kipu, original technology-inspired Andean guardians, Peruvian landscapes, and a proposed Nokia-like monochrome PachaShift. These expanded elements are **direction proposals**, not proof that they are implemented or already approved in the MVP. See the GDD and project plan for scope and eligibility gates.

## Decision status

| Status | Meaning | Examples |
|---|---|---|
| Baseline | Already recorded in the current GDD/decisions | Phaser + TypeScript + Vite; 320×180; Kipu; provisional scenery; movement/jump/practice targets |
| Proposed direction | Useful shared intent, but requires a focused design pass before implementation | Cuphead-like boss expressiveness; Hollow Knight-like atmosphere; PachaShift capturing and returning projectiles; specific Amaru-01 fight behavior |
| Not yet evidenced | Must be supplied or verified; do not imply it exists | Approved Amaru reference, final sprites, animation-ready sprite sheets, event eligibility |

The proposal's named `PachaShift REVERSE` behavior (slow time, free movement, capture and return projectiles), first-boss details, regional content, and future programming-themed guardians need explicit design/acceptance criteria before they become implementation scope. Preserve the approved baseline in the meantime.

## Shared source of truth

1. Read `AGENTS.md` for mandatory project boundaries and working rules.
2. Read `docs/GDD.md` for current playable scope and approved creative baseline.
3. Read `docs/DECISIONS.md` for recorded tradeoffs.
4. Read this workflow for cross-chat coordination and asset handoffs.
5. Read `docs/STACK.md`, `docs/PROJECT_PLAN.md`, and `docs/VALIDATION_PLAN.md` for technical constraints, gates, and verification.

When decisions conflict, do not silently rewrite one source to match another. Identify the conflict, preserve the current approved baseline, and ask for the specific product decision before implementation.

## Asset request and acceptance protocol

Do not turn procedural placeholders or concept art into production art by implication. When a task depends on a missing visual asset:

1. Identify the asset and its gameplay purpose; check the current art reference and constraints.
2. Prepare an **Asset Request** containing an ID, role, style/silhouette/palette, source-resolution guidance, intended displayed logical size, and (for animation) uniform per-frame cell size, frame count/states, and pivot/orientation. Include transparency, file format, reference links, originality limits, and objective acceptance checks. Keep the physics hitbox separate from all visual dimensions.
3. Give the user a copy-ready image-generation brief and state whether it asks for concept exploration or production-ready files.
4. Classify each file as concept reference, usable preparation source, prepared static sprite, or prepared animation sheet. Larger source PNGs are not rejected solely for their dimensions; a static PNG is not automatically an animation sheet. Validate prepared runtime dimensions, alpha, alignment, frame order where applicable, and in-game readability before integration.
5. Preserve originals and adapt usable sources into separate candidates where practical, rather than repeatedly asking for exact-sized generated rasters. If adaptation cannot meet the intended appearance, report concrete mismatches and request a targeted revision. Keep placeholders explicitly temporary and independent work moving where safe.

Follow the [Art Bible's flexible standard](ART_BIBLE.md): 32×40 logical pixels is an initial Kipu evaluation target only, not a verified final fit or a universal size for bosses, scenery, and other assets. Crisp pixel clusters and a coherent silhouette/palette preserve retro identity; collision changes require separate acceptance criteria and authorization.

The user-approved [Kipu concept sheet](../assets/references/kipu-approved-concept.png) is the current visual reference; read the [Art Bible](ART_BIBLE.md) for its scope. It is concept art, not a spritesheet. No approved Amaru reference or production-ready Kipu asset is established. Add another reference only when the user supplies or identifies the exact approved file; do not infer that a pasted remote image URL is locally available.

## Cross-chat handoff

Chats and tools do not share reliable implicit memory. Every art or design handoff should include the relevant source-of-truth excerpts, the exact approved reference files, the asset request, and its version/status. The development chat owns code integration and technical validation; the art chat owns visual exploration and exports; the user approves creative direction and final assets. Do not assume a file is visible to another chat unless it was actually attached or shared there.

## Engineering workflow

- Keep the first goal a complete, verified, small playable loop; add one coherent slice at a time.
- Write observable acceptance criteria before behavior changes. When a deterministic test applies, observe a meaningful failing test, implement, then rerun it.
- Verify in this checkout and distinguish automated tests, browser checks, and subjective playtest feedback.
- Keep browser-only play static and backend-free until an approved feature truly requires accounts, shared saves, or online play.
- Do not expand competition-specific work until acceptance, track, rules for prior work/AI/assets, and deliverables are confirmed from official sources.

## Suggested production sequence

1. Complete the pending Sprint 0 install, test, build, served-browser, and manual-play validation in `docs/VALIDATION_PLAN.md`.
2. Resolve the event-eligibility gate if the project is intended for Hack the Andes.
3. Hold a focused design approval for the next playable slice (combat/boss, atmosphere/level, or PachaShift) and write acceptance criteria.
4. Approve a small art specification, then request and validate only the assets needed for that slice.
5. Implement and verify the slice; update the GDD, decisions, asset status, and verification evidence together.

## Superpowers and methodology

The project already has explicit design, planning, test-first, and verification practices. Superpowers is an optional agent-workflow package, not a game runtime dependency. Avoid installing/updating it mid-task unless the user chooses to standardize on its current Codex plugin and resolve any overlap with the repository's existing `AGENTS.md` workflow. Methodology compliance must never be claimed unless the corresponding steps were actually performed.
