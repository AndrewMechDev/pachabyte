---
name: pachabyte-gameplay-quality
description: "Trigger: PachaByte gameplay, input, sprite alignment, scenery, combat readability. Preserve responsive, readable playable increments."
license: Apache-2.0
metadata:
  author: "PachaByte project team"
  version: "1.0"
---

## Activation Contract
Load before PachaByte gameplay, visual integration, input or scene changes. Apply only to approved scope, not permission to add bosses or systems.

## Hard Rules
- Separate source resolution, frame grid, display size, alpha bounds, origin and hitbox; never impose universal sprite dimensions.
- Preserve originals; adapt usable sources before requesting regeneration. Supply an exact project-specific prompt whenever requesting new art.
- Measure occupied-pixel grounding, not frame edges. Change visuals independently of collision and tuning unless separately authorized.
- Distinguish decorative roofs from walkable surfaces; keep Kipu, targets and HUD readable at native gameplay size.
- Require observed evidence before reporting a check passed; finish each increment playable.

## Decision Gates
| Situation | Action |
|---|---|
| Apparent hovering | Compare loaded alpha edge, pivot and body bottom before editing. |
| Art resize | Preserve body footprint; inspect native scene readability. |
| Approved future combat | Specify anticipation, action, recovery and a readable player response before implementation. |
| Inspiration | Extract principles, not copied artwork, characters or mechanics; do not expand scope. |

## Execution Steps
1. Read relevant project baseline and [design principles](references/design-principles.md).
2. State one observable result and preserved gameplay invariants.
3. Exercise movement/release, focus, shot rate/pool, landing and restart through real input when affected.
4. Inspect ground and platform captures at native size; record remaining human acceptance separately.

## Output Contract
Return changed behavior, preserved invariants, observed checks, unavailable checks and next bounded increment. Distinguish evidence from design inference.

## References
- [Design principles](references/design-principles.md): sourced inspiration and project-specific interpretation.
- [UI and motion principles](references/ui-motion-principles.md): adapted web-UI/animation rules, reduced motion, what was deliberately not adopted.
