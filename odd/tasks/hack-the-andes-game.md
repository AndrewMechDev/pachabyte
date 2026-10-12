# Hack the Andes Game workspace
## Goal
Create a clean, canonical local workspace by copying the previously built and verified PachaByte browser prototype to this user-selected folder, preserving its history of evidence and adding a maintainable project plan. Do not add gameplay features in this bootstrap task.
## Why
User requested one named Documents project directory with organized Markdown documents, a complete stack recommendation, and the final validation stages planned up front.
## Authorized scope
- Copy the known PachaByte project into this already-existing empty destination: C:/Users/dark_/Documents/hack-the-andes-game.
- Exclude node_modules, dist, caches, prior workspace scratch logs, and every .codegraph index; retain source files, lockfile, GDD, screenshot and historical verification record.
- Add or update project-facing Markdown: AGENTS.md, README.md, docs/DECISIONS.md, docs/PROJECT_PLAN.md, docs/STACK.md, docs/VALIDATION_PLAN.md; update copied implementation/verification documents only for accurate status and navigation.
- Recommend static-first architecture and document local Git/GitHub and deployment steps without initializing a repo, using credentials, publishing, or deploying.
- Do not change gameplay/source or install packages in this task. Do not run the final tests now; retain old verified results accurately, identify them as pre-copy baseline, and define the future final verification gate.
## Constraints and evidence
- Existing project source: outputs/pachabyte in the calling workspace; earlier completion verified its install, 20 tests, typecheck/build and Edge browser checks. Preserve contents exactly; verify copy using manifests/checksums instead of rerunning tests.
- Existing requested destination was checked and is an empty directory; preserve it. Never delete or overwrite pre-existing non-empty destination content.
- Hack the Andes 2026: applications closed Oct 9 and event is scheduled Oct 17-18; accepted participant/track status unknown. Check organizer/rules before implying eligibility or submission.
- Use English in technical docs, following existing project.
- Official GitHub Pages/Vite guidance: static Vite project deploys built dist via Actions; for a project path URL, set Vite base to /<REPOSITORY_NAME>/. Publishing makes the website public, even when source repo can be private.
- CodeGraph could not initialize original project because it is not recognized as a project (no Git root); no architecture queries. Use bounded direct copy of prior verified docs/file list and explain the fallback.
- Keep one writer; exact user destination only, no remote host, no repo or deployment mutation.
## Work units
- [x] W1. Copied the existing verified project into destination; excluded generated/cache/old task state. Writer SHA-256 verified 15 untouched source files with 0 mismatches or missing files. No tests rerun by user sequencing.
- [x] W2. Added/read back project guidance, status and docs: AGENTS.md, README.md, docs/PROJECT_PLAN.md, docs/STACK.md, docs/DECISIONS.md, docs/VALIDATION_PLAN.md, and historical-status annotations in docs/IMPLEMENTATION_PLAN.md and docs/VERIFICATION.md. No source code or dependencies changed.
- [x] W3. Parent read back project docs/inventory, confirmed the local task tracker remains present; Engram recovery mirror updated.
## Validation deferred by user
At completion of the later feature implementation stage, run (from this project root) npm.cmd ci, npm.cmd run typecheck, npm.cmd test, npm.cmd run build, and npm.cmd run test:browser against built preview; report exact outcomes. Per behavior, write/update focused tests, then run full final suite at the end. Verify Pages path base, Actions deployment artifact and live game before claiming deployed.
## Delivery
Local filesystem only. No Git repository initialized, GitHub remote, credential/session use, publication, hosting, art generation, code change, test execution or deployment authorized by this task. Copied project's older verification results remain historical, not fresh acceptance of relocated bytes.
## Current step
Bootstrap complete. Next: review the plan and decide event eligibility/repository ownership before new gameplay or publication.