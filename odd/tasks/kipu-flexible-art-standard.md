# Flexible Kipu Art Standard

## Objective and authorization
The user requested a less rigid art standard that keeps Kipu recognizable and retro, and authorized correcting project instructions if needed. The 16×20 procedural placeholder is not a production-art limit.

## Scope
Documentation only: `AGENTS.md`, `docs/ART_BIBLE.md`, `docs/SHARED_WORKFLOW.md`, and this tracker. Do not change gameplay, source images, physics, global skills, Git configuration, or submission eligibility rules.

## Acceptance criteria
- Separate source-image resolution, native sprite/frame dimensions, on-screen size, and physics body.
- Accept larger source PNGs as inputs; validate prepared runtime assets instead of rejecting source art solely by dimensions.
- Use 32×40 logical pixels as an initial Kipu evaluation target, not a mandatory project-wide size or a verified final in-game fit.
- Preserve turquoise/gold identity, silhouette, crisp pixels, and readability; preserve originals and allow focused art adaptation.
- Do not change collider size automatically with visual size.

## Tasks and route
- [x] ART-1: Correct the flexible art policy in the three documents. Delegated direct: multi-file documentation requiring analysis. Added a concise AGENTS policy, four independent art specifications and evaluation criteria in the Art Bible, and a source-adaptation path in the shared workflow. Forecast under 150 authored lines.
- [x] ART-2: Read back the policy, verify links and no conflicting fixed-size requirement, and record observed checks. Passive documentation: no meaningful runnable RED test.

## Verification
Check modified Markdown references and consistent wording. Confirm no gameplay or image files were changed by this task. No commits: this local folder is not a Git repository and initialization is not authorized.

Observed checks: read back all three changed policy sections; checked 10 relative Markdown file links with zero broken targets; searched the changed documents for 16×20, 32×40, exact-size, universal-size, and hitbox statements and found no conflicting fixed-size demand. Confirmed `.git` is absent. This task wrote only the three policy documents and this tracker; no gameplay, images, or global skills were modified. Tests/builds were not run because this is passive documentation, and the 32×40 scene comparison remains pending. No Git diff or commit evidence is available. Parent readback confirmed the corrected policy; the complete tracker is mirrored in Engram under `odd/kipu-flexible-art-standard/tasks`.

## Next step
Prepare and visually compare a 32×40 candidate against the current prototype before authorizing runtime integration or physics changes.

