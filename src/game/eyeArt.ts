// The Bucle node is an ORIGINAL all-seeing eye relic: a gold stepped-chakana frame, a turquoise iris around a glowing violet
// core and a vertical slit pupil, with dark-purple cables hanging from the lower rim. Nothing here is taken from any film,
// comic or game.
//
// B5 (2026-10-14): the procedural placeholder that lived in this file (pixel-row strings) was replaced by the prepared
// LOOP_NODE_EYE sheet (assets/prepared/loop-node-eye-v1-40x56.png). Slicing and anchor math: eyeSheets.ts; loading and the
// per-frame textures: fxTextures.ts; frame choice, origin and the shatter burst: eyeRelic.ts. This file only keeps the
// frame names, in sheet order: cells 0-3 idle (the slit dilates, the cables sway), 4 hit (ivory flash), 5 cracked (HP 2),
// 6 breaking (HP 1, the last frame before the shatter burst).
export type EyeFrameName = 'idle0' | 'idle1' | 'idle2' | 'idle3' | 'hit' | 'crack' | 'break';
