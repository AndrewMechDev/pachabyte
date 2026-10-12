# PachaByte functional phases



Deliver visible, playable increments before adding content. Phase 1 is authorized and implemented as a static art evaluation in the existing practice prototype; Phase 2 is now authorized and implemented as a provisional procedural environment; Phase 3 now has bounded local approval; broader gameplay remains deferred.



## Roadmap



| Phase | Functional result | Acceptance / scope gate |



|---|---|---|



| 1 — Playable visual practice prototype | Kipu's supplied art appears in the current route; movement, jumping, shooting, targets, camera and restart continue working. | Local typecheck, rules, build and keyboard browser checks; inspect art at runtime. Static evaluation only, not final animation approval. |



| 2 — Coherent environment (proposal) | Muted layered scenery and distinct walkable platform edges improve the same playable route. | Real-input regression and floor/platform captures passed; human visual acceptance remains pending. Layout and gameplay are unchanged. |



| 3 — Approved local PachaShift demo | A bounded objective with readable progress and an end-state makes one short replayable experience. | Four targets unlock one-phase Amaru, two attacks, HP/outcomes and capture/reversal. Local checks; no publication or eligibility claim. |



| 4 — Local release candidate (proposal) | Verified production build, controls/instructions, asset provenance and a local delivery package. | Full validation and human playtest; confirm the requested submission format. Publishing, initial Git history bootstrap, deployment and remote submission require separate explicit authorization. |



## Deadline and priority



On October 12, 2026 the user clarified local preselection **before October 14**, with winners shown later, waived email evidence and approved the local Phase 3 build. This is user-reported, not independently verified official rules; no remote submission is authorized.



Prioritize a stable playable route and complete small objective over a boss, animation volume or new systems. No boss, PachaShift, audio, touch, backend or competition-eligibility claim is included in Phase 1.



## Phase 1 evidence



- Prepared `assets/prepared/kipu-v3-32x40.png` from the original incoming PNG without changing incoming assets.



- Loaded it with an independent texture key so bullet, target and platform placeholder generation still runs.



- Kept the 320×180 scene, player coordinates, controls, physics tuning and 12×18 body unchanged.



- Writer observed typecheck, 20/20 deterministic tests, production build and 13 grouped real-keyboard browser checks passing.



- Screenshot shows recognizable turquoise/gold Kipu and no viewport clipping at the captured spawn. The static source leaves transparent margins: the visible figure floats above the ground and occupies less than the full 32×40 frame. Final pivot/core silhouette alignment, animation and human art acceptance are pending.



- Independent verification and parent typecheck/screenshot spot checks passed; Phase 1 functional checks are complete, with final art acceptance pending. See [verification](VERIFICATION.md) and [task progress](../odd/tasks/phased-playable-demo.md).



## Next action



Inspect the grounded Kipu and provisional Phase 2 environment. Next define and approve the smallest complete challenge/end-state; later proposed phases do not authorize deferred gameplay.



## Grounding and Phase 2 evidence



The October 12 quality increment removes the observed 8px gap by changing visual origin and compensating body offset, retaining the same 12×18 body at (-6,-8). Background mountains/town are muted, decorative roofs differ from gold walkable edges, and platform undersides are darker. Collider layout, camera/parallax, controls and target mechanics are unchanged.



Writer and independent verifier observed typecheck, 20 rules tests, build and 14 grouped browser checks passing. Exact occupied-alpha separation is 0 logical pixels on floor, facing left, after restart and on the first platform. Parent typecheck and screenshot spot checks also passed. [Ground](quality-ground.png) and [platform](quality-platform.png) captures were inspected. Final human art acceptance remains pending; these are procedural placeholders, not polished environment assets. See [quality task](../odd/tasks/gameplay-quality-environment.md).





## Approved retro refinement evidence



The October 12 visual pass adds native-spacing sillar terrain/platform slabs, subdued mountain depth and arched city variation, a compact one-line bitmap HUD with live target progress, and one versioned Kipu eye-glint pixel restoration. It changes no route, hitbox, controls, projectile rules or camera/parallax factors. These environment visuals remain provisional, not production art or authorization for further gameplay.



Writer checks: typecheck/build exit 0, 22 deterministic tests and 17 browser groups passed. [Ground](retro-ground.png) and [platform](retro-platform.png) captures were inspected. Independent verification and parent checks passed; human visual acceptance remains pending. Next propose a small complete target challenge/end-state without automatically adding a boss.


## Phase 3 local work

See [Phase 3 tasks](../odd/tasks/phase3-wow-demo.md) and [asset prompts](PHASE3_ASSETS.md). Historical Phase 1/2 evidence is retained above.

## Phase 3 functional closure

Writer and independent verifier observed 33/33 unit tests, typecheck/build exit 0, and 19/19 real-keyboard browser groups in both actual Canvas and WebGL. Exact four-green Nokia rendering, returned damage, complete challenge outcomes and retained training regressions passed. Parent typecheck and screenshot checks passed. See [verification](VERIFICATION.md) for evidence and retained limitations.

Human visual/game-feel acceptance remains pending. Phase 4 local release/manual QA is proposed; no clean install, wider-device/OS-focus coverage, native approval, official eligibility verification, Git bootstrap or remote delivery is implied.

## Phase 3 functional closure

Writer and independent verifier observed 33/33 unit tests, typecheck/build exit 0, and 19/19 real-keyboard browser groups in both actual Canvas and WebGL. Exact four-green Nokia rendering, returned damage, complete challenge outcomes and retained training regressions passed. Parent typecheck and screenshot checks passed. See [verification](VERIFICATION.md) for evidence and retained limitations.

Human visual/game-feel acceptance remains pending. Phase 4 local release/manual QA is proposed; no clean install, wider-device/OS-focus coverage, native approval, official eligibility verification, Git bootstrap or remote delivery is implied.

## October 12, 2026 — direct access and view clarity

Current local demo access supersedes the earlier training unlock requirement, without expanding gameplay. Amaru is the default Enter choice and direct key 2 destination; Arequipa is optional via key 1 or its semantic button. Header/help/outcomes follow the active scene. Session achievements remain earned, reset on refresh, and never gate demo availability. See [access tasks](../odd/tasks/amaru-accessibility-flow.md) and [audit](audit-amaru/report.md) for observed checks and remaining live/manual validation. No Git initialization, publication or remote delivery is authorized.
