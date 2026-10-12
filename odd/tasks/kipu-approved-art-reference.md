# Approved Kipu Art Reference

## Goal
Register the user-approved Kipu concept image as the official visual reference and document clear boundaries between concept art and production sprite assets.

## Instructions
- Keep technical artifacts in English.
- Do not initialize Git or publish/transfer anything remotely.
- Preserve the approved MVP; do not expand gameplay scope.
- When requesting future generated art from the user, provide a precise, PachaByte-specific copy-ready prompt.

## Discoveries
- The approved image is a concept sheet with front/side/back views and a detail inset, not a production spritesheet.
- The existing procedural player placeholder is 16×20 logical pixels; final sprite cell size and animation requirements are undecided.

## Accomplished
- User explicitly approved the attached Kipu concept sheet as the official design reference.
- Feature tracker created and Engram mirror saved under `odd/kipu-approved-art-reference/tasks`.
- Copied the approved image to `assets/references/kipu-approved-concept.png` and added `docs/ART_BIBLE.md` to distinguish visual canon from production sprite requirements.
- Updated the GDD and shared workflow to link the approved reference and remove obsolete Kipu-reference status claims.

## Next Steps
No further work remains for this registration task. Production sprite requirements remain undecided; any future image request must include a copy-ready PachaByte-specific prompt.

## Relevant Files
- `docs/GDD.md` — approved design baseline and character scope.
- `docs/SHARED_WORKFLOW.md` — shared contribution and art workflow.
- `src/game/textures.ts` — current procedural 16×20 Kipu placeholder.
- `odd/tasks/kipu-approved-art-reference.md` — this feature tracker.

## Scope and Constraints
Authorized files:
- `docs/ART_BIBLE.md`
- `docs/GDD.md`
- `docs/SHARED_WORKFLOW.md`
- `assets/references/kipu-approved-concept.png`
- `odd/tasks/kipu-approved-art-reference.md`

Excluded: gameplay/source implementation, sprite-sheet generation, new character lore, changing placeholder rendering, Git initialization, publishing, deployment, remote transfer.

## Acceptance Criteria
- The approved reference image is copied byte-for-byte into the repository.
- Docs identify Kipu concept sheet as approved reference while clearly stating it is not a game-ready spritesheet.
- Existing GDD/workflow links and status are consistent.
- No gameplay or source code changed.
- Validation confirms matching image hashes and resolving Markdown links. No Git diff is available because this folder has no `.git` metadata.

## Checks
- [x] Source and destination SHA-256 match: `68A7D97C3313003B57F5EC2C187DB05FC12F97A9F013BD7517D5BD2F8FFF5C1A`.
- [x] Checked relative Markdown links in the three changed docs: zero broken links; no obsolete Kipu-reference status claims remain.
- [x] No source/gameplay files were edited by this task. `.git` is absent, so Git status/diff could not be used as an independent check.

## Progress
- [x] User approval received.
- [x] Tracker and Engram mirror created.
- [x] Art reference and documentation updated.
- [x] Structural checks completed; Git diff unavailable because this folder has no `.git` metadata.

## Route and Forecast
- Delegated direct, because documentation analysis spans multiple non-trivial files and adds an approved image asset.
- Forecast: approximately 150–250 authored documentation lines; generated image asset excluded.

## Next Step
No remaining steps for this task. Future production-art work requires approved technical requirements and a copy-ready PachaByte-specific prompt.
