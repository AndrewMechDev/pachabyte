# Decisions and tradeoffs

These decisions preserve the current approved Sprint 0 scope. They do not authorize the deferred phases in `PROJECT_PLAN.md`.

| Decision | Why | Alternative and tradeoff |
| --- | --- | --- |
| Keep a static browser game; no backend now | The MVP is a local single-player movement/combat prototype. No server-side requirement exists. | A backend could support online scores/saves later, but adds accounts, hosting, security, privacy, and maintenance before those are needed. |
| Use Phaser 3 Arcade Physics | It provides a practical 2D scene, input, camera, collision, and physics loop for this prototype. | Canvas built directly could reduce dependency weight, but requires hand-built scene, input, collision, and lifecycle infrastructure. |
| Keep TypeScript + Vite + npm lockfile | Existing prototype uses this reproducible browser development/build stack; Vite serves locally and emits static assets. | Plain JavaScript or another bundler may be simpler initially, but changing now adds migration work without a demonstrated benefit. |
| Retain procedural placeholders for now | Generated simple shapes make the current mechanics testable without mistaking concept art for game-ready assets. | Production pixel art/spritesheets improve identity but require defined dimensions, animation states, transparent backgrounds, licensing/ownership review, and integration/testing. |
| Defer image generation until an art brief exists | Kipu's palette and Andean-retro direction are known, but usable sprite specifications and animation requirements are not. | Concept images could help explore visual direction, but should be labeled concept-only and not silently substituted for sprite sheets. |
| Defer Amaru-01 and PachaShift | Both are later concepts outside the movement/shooting MVP; Hack the Andes eligibility is unresolved. | Implementing them now might create more showable content, but increases scope and could conflict with event rules or tracks. |
| Treat the prior Superpowers work as a methodology adaptation | Existing artifacts show a design baseline, implementation plan, test-first record, and verification record. | Installing the Superpowers skill package could make future workflow instructions directly available, but installation is not needed for this copy and was not requested. |

No concept-image generation is needed for the relocation and planning task. No new artwork was generated here.

## October 12, 2026 — show the approved demo directly

- Separate availability from achievement: both demo scenes are available fresh, but four hits and actual victory alone earn their session flags. Keeping the gate would obscure the approved Amaru slice.
- Use typed game view/focus events and semantic DOM buttons, not exposed Phaser commands or debug polling. Native navigation focus pauses scenes; game focus resumes, with held keys cleared.
- Reuse prepared Amaru/head previews and the arena source as muted native-aspect route parallax; preserve source assets, terrain/colliders and combat balance. New artwork and a full page redesign are unnecessary for this correction.
