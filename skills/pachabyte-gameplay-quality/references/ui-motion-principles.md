# UI and motion principles adopted for PachaByte

Source: principles read (not installed) from the `SKILL.md` files of Emil Kowalski's skills (MIT) and Nutlope's Hallmark (MIT), October 12, 2026. They target web UI, so only the parts that fit a canvas game with a small HTML shell were adapted. No code or text was copied; nothing third-party was installed.

| Principle | How it applies here |
|---|---|
| Ask how often users see it. Never animate high-frequency, keyboard-initiated actions | Retry (R), map (M) and scene changes have no transitions. The title types in once per session only. |
| Every animation needs a purpose: feedback, state, spatial consistency | Dust and bursts confirm landing, hits and captures. Amaru's rear-back, lunge and charge telegraph attacks. Nothing is decoration-only on a loop except idle breathing and sway. |
| Entrances use ease-out, never ease-in; UI under 300 ms | Page buttons use `cubic-bezier(0.23, 1, 0.32, 1)` at 120 ms. Hit flashes are 80-150 ms. |
| Name the properties; never `transition: all` | Buttons transition `transform`, `background-color`, `border-color` only. |
| Press feedback on controls | Buttons scale to 0.97 on `:active`. |
| Respect reduced motion | `prefers-reduced-motion` and a page toggle disable shake, flicker, sway, squash/stretch, particles and the transition. Gameplay telegraphs stay. |
| Avoid the "AI look": gradients, pure black/white, card grids | The shell keeps its tinted teal and gold palette, no gradients, no cards. |
| Taste is trained: study why it feels right, then iterate | Human playtest stays the acceptance gate; automation proves behavior only. |

Not adopted: React/Framer Motion springs, Tailwind or component-library advice, SwiftUI skills, and hit-stop (it would change the owned combat clock and attack timing, which this project keeps untouched).
