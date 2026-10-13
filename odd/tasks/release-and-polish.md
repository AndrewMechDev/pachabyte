# Release and Polish (Oct 12-13, 2026)

## Objective
Ship a publicly playable PachaByte before the Oct 14 deadline: Pages deploy, public docs, accessibility, adapted UI/game-feel polish, optional Andean flight stage, human playtest and delivery package. User authorized: public repo, GitHub Pages path, principles-only use of external UI skills (no third-party installs).

## Tasks
- [x] REL-1: Pages workflow (`.github/workflows/pages.yml`); relative Vite base verified under a `/pachabyte/` subpath (browser smoke passed).
- [x] REL-2: Public README, LICENSE (MIT code), CREDITS, refreshed screenshots.
- [x] REL-3: Reduced-motion option (respect `prefers-reduced-motion`, disable shake and flicker).
- [x] REL-4: Extract 5-8 principles from Emil Kowalski / Hallmark SKILL.md files (read only, no install).
- [x] REL-5: Game-feel and shell polish (typed title, map Kipu, victory stats, button feedback). Hit-stop dropped: it would alter the owned combat clock.
- [ ] REL-6: Optional Andean flight stage (spec, tests, code). Needs spec approval; drop if REL-3..5 slip.
- [ ] REL-7: Human playtest, fixes, delivery package (link, short video, description, Cloudflare/Netlify backup).

## Route
Parent inline for small config/docs units; delegate larger multi-file work to a writer.

## Boundaries
No push without confirmation. No third-party skill install. Art license choice pending the user (CREDITS reserves art rights).
