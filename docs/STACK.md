# Stack: current and recommended

## Current implementation

| Layer | In this project | Role |
| --- | --- | --- |
| Language | TypeScript 5.9.3 | Typed browser game logic and configuration |
| Game engine | Phaser 3.90.0, Arcade Physics | Rendering, keyboard input, 2D physics, camera, collisions |
| Dev/build server | Vite 8.3.4 | Local development server and static production build |
| Package manager | npm with `package-lock.json` | Reproducible dependency installation |
| Unit/rule tests | Vitest 5.0.3 | Deterministic gameplay-rule tests |
| Browser smoke | Playwright 1.62.1 with installed Edge/Chrome | Real keyboard input against a served build; no browser download |
| Runtime architecture | Static browser-only application | No custom server, API, database, login, or secrets |

Exact pins are recorded in `package.json` and `package-lock.json`. The baseline's prior verification is historical; the copy still needs its own final gate.

## Fit for the intended game

For a 2D side-scrolling arcade game that runs in a desktop browser, this stack is a sound fit for the current scope and the proposed boss, projectile, and scene work. Phaser owns the game loop, rendering, input, camera, and Arcade Physics; TypeScript and Vitest support maintainable, testable gameplay rules; Vite produces static web builds. The stack does not by itself guarantee good frame pacing, mobile controls, native app packaging, or a polished asset pipeline. Those need their own acceptance targets and device testing before they are promised.

Keep this stack for now; there is no evidence-based reason to migrate. First complete the pending checks in `VALIDATION_PLAN.md`. For larger boss behavior or PachaShift, profile and test the actual implementation rather than assuming a technology change is needed. The shared cross-chat and art handoff process is in `SHARED_WORKFLOW.md`.

## Recommended next architecture

Keep this a frontend-only static game while its needs are movement, combat, stages, and local presentation. Add a backend, database, account system, or cloud service only if an approved feature actually needs shared scores, saves, or online play. Every such feature adds deployment, privacy, and operational costs.

Build with `npm.cmd run build`; Vite writes static files to `dist/`. A reasonable later hosting option is GitHub Pages via GitHub Actions, once the repository location and visibility are deliberately chosen. A GitHub Pages project site is public; GitHub Free Pages generally requires a public repository. Never put credentials or secrets in the static bundle. The Vite `base` path must match `/<REPOSITORY_NAME>/` for a project site (or `/` for a user/org root site). See the [official Vite static deployment guide](https://vite.dev/guide/static-deploy.html).

No repository, CI workflow, hosting configuration, or deployment has been created or tested. GitHub Pages is a recommendation, not a selected or authorized destination.
