# Phased Playable Demo

## Objective and authorization
The user authorized organizing the project into functional phases and starting work. Phase 1 integrates a static Kipu visual evaluation into the existing practice route. Later gameplay/environment phases remain proposals, not authorization to implement deferred mechanics.

## Scope and acceptance
- Reuse `docs/PROJECT_PLAN.md` as the public roadmap.
- Preserve incoming art; prepare a separately named transparent PNG with a 32×40 native evaluation frame.
- Load Kipu under a distinct texture key without preventing procedural bullet/platform/target textures from being generated.
- Keep player position, input, camera, shooting arithmetic, and the existing 12×18 collision footprint; compensate visual origin and body offsets explicitly.
- Show the new static candidate in gameplay and verify restart and both directions. It is an art evaluation, not final animation or final visual approval.
- No boss, PachaShift, new enemy AI, victory flow, backend, audio, Git initialization, publishing, or event-eligibility claim.

## Tasks and route
- [x] PH1-1: Update the existing roadmap with functional phases, clear deliverables and the user-reported deadline. Delegated direct: documentation analysis.
- [x] PH1-2: Prepare and integrate Kipu, with meaningful browser RED then GREEN. Delegated direct: multi-file behavior change.
- [x] PH1-3: Run full local checks and independent verification; inspect a gameplay screenshot. Record partial/unavailable checks honestly.

## Verification
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- Owned free-port preview and `npm.cmd run test:browser` with `PACHA_URL` set to that server; do not stop or replace the user's server.
- Browser assertions: 32×40 visual/native dimensions, unchanged 12×18 body, unchanged relative body position, restart, left/right, movement, jump and firing.
- Screenshot inspection: Kipu recognizable, no clipping/undue occlusion, decorative pixels distinguished from collider.

## Work boundaries
Forecast under 250 authored lines, generated art excluded. No commits because `.git` is absent and initialization is not authorized. Native review status/assessment may be unavailable in this local copy; never fabricate approval. Source-art adaptation is explicitly authorized by the user's earlier direct resize request and continuation.

## Progress and next step
Phase 1 functional implementation and checks are complete. Review human art acceptance and final core/pivot alignment before approving the proposed Phase 2 environment brief.

## Writer handoff
PH1-1 and PH1-2 observed complete. Typecheck exit 0; rules 20/20; final build exit 0 (retained chunk warning); actual Edge browser GREEN 13 grouped checks and zero errors after meaningful RED on old kipu texture. Prepared PNG32x40 has 1019 transparent and 261 opaque pixels; original preserved. Native/display32x40 and body12x18 at relative(-6,-8) observed on restart and both facing directions. Screenshot inspected; hovering gap/source margins and final core alignment remain pending art evaluation. PH1-3 independent verification/parent spot check complete. No Git or native review. Next: human visual acceptance and proposed Phase 2 environment brief.


## Verified closure
Independent verifier: typecheck exit 0, rules 20/20, build exit 0 (1206.61 kB warning retained), Edge 155.0.4283.45 browser 13 grouped checks exit 0, zero errors, maximum 9/12 bullets on owned port 4174. Initial isolated-profile launch and separate stopped-preview connection attempts failed; final combined approved execution passed. Parent typecheck exit 0 and screenshot reviewed. No deterministic functional blocker remains; final art/core/pivot acceptance is pending. RDD globally off; assessment unassessable/high due untracked inventory; independent functional verification used, no native approval. No Git actions. Complete tracker mirrored by parent in Engram under `odd/phased-playable-demo/tasks`. Phase 2 remains proposed.

