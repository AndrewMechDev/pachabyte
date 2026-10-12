# Phase 3 original demo assets

Original static evaluation art was generated with built-in ImageGen, not a CLI/API credential workflow. These files are not animation spritesheets or final human-approved artwork.

| Role | Preserved source | Prepared runtime asset |
|---|---|---|
| Amaru head | assets/source/amaru-head-v1-source.png, transparent RGBA | assets/prepared/amaru-head-v1-64x64.png, 64×64 binary alpha |
| Arena | assets/source/arequipa-arena-v1-source.png, opaque | assets/prepared/arequipa-arena-v1-320x180.png, opaque |
| User concept | assets/references/pachabyte-phase3-concept.png | Reference only; original copied unchanged |

Head occupied-alpha bounds cropped and fitted completely inside 60×60 with centered padding in 64×64, nearest-neighbor scaling and binary alpha threshold. Native prepared images were inspected before integration. Display center (260,126), origin (0.5,0.5); separate forgiving body 32×44, offset (8,20), center (252,136). Backdrop resized nearest-neighbor from its near-16:9 composition. Existing Kipu v4 frame/body unchanged. Cached Nokia variants preserve alpha/frame dimensions and work in Canvas/WebGL.

## Exact reusable generation and edit prompts

Head prompt:
Use case: original pixel-art game asset. Asset type: isolated Amaru-01 guardian head for PachaByte, a 320x180 side-view arcade game. Input image: supplied Kipu/Amaru concept sheet is character identity reference ONLY; do not reproduce the sheet or its text. Generate ONE complete Amaru-01 HEAD and a very short neck only, facing LEFT in a readable neutral attack-ready pose. Preserve the original turquoise/teal armor, warm gold and orange horns/trim, cream teeth and violet eye/core accents shown for Amaru. Compact dragon/serpent guardian profile, eye and open mouth clearly legible, intimidating but stylized and playful. Intended native gameplay frame 64x64 pixels, crisp intentional pixel clusters, limited palette, dark teal outline. Simplify ornamental details for that size; output may be a larger source raster but must visually obey a low-resolution pixel grid, not smooth painted or 3D art. Keep the complete head, horns and jaw inside the image with small transparent margin. Real transparent RGBA background; no background, ground, body segments, full serpent, glow outside silhouette, cast shadow, text, UI, border, watermark, extra poses or sprite grid. Do not copy any existing commercial game character. Return one head asset only.

Arena prompt:
Use case: original retro pixel-art game backdrop. Asset type: ONE opaque 16:9 background for PachaByte's Arequipa guardian arena, intended to be adapted to a 320x180 logical canvas. Input image: supplied concept sheet is palette/atmosphere reference only, especially the bottom colorful arena; do not copy its exact layout, characters, text, or sheet panels. Create an original atmospheric side-view Andean/Arequipa-inspired backdrop: distant layered volcanic silhouettes, evening warm peach horizon, muted violet/blue foothills, pale sillar-inspired abandoned arches and restrained stone terraces near the side edges. Strong readable depth; central and lower gameplay corridor mostly open and low contrast so a small turquoise/gold hero and violet/orange projectiles stand out. Reserve the upper 20% for an overlaid HUD: no bright details there. No playable foreground ground, floor strip, floating platforms, hazards, characters, dragon, Kipu, bullets, magical effects, map nodes, labels, text, UI, borders, watermark. Pure background scenery only, not an illustrated game screenshot. Crisp intentional pixel clusters, restrained palette, no blurry gradients or photorealistic material. Target wide 16:9 composition; larger source resolution is fine. No transparency. Preserve original setting and don't reproduce identifiable art from other games.

Targeted background edit:
Edit this background only: remove the close foreground staircases, walkable-looking ledges, masonry floor and sharp platform-like surfaces at the bottom left and bottom right. Fill those removed foreground areas with the same subdued distant valley/foothill atmosphere so the lowest 20% remains open behind separately drawn game terrain. Keep the volcanic mountains, sunset sky, original pixel-art style, wide composition and distant ruined arches recognizable. Arches may remain only as decorative distant scenery along side edges, not traversable foreground. No new floor, platforms, characters, HUD, text or effects. Preserve the 16:9 composition, colors and opaque background. This image is scenery behind a separate interactive floor.

## Acceptance still required

Human approval of native silhouette, readability and game feel remains distinct from automated verification. Future animations, extra worlds and polished art require separate approval.

