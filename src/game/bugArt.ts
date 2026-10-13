// PLACEHOLDER pixel art for the Corruptor's projectile and the small debug drop. The Corruptor and the Sombra de
// Error themselves are the user's sprites (spriteFrames.ts). Pure rows of characters ('.' is transparent) so sizes
// and silhouettes are unit-tested without Phaser.
export type PixelRows = readonly string[];

// Round corrupted orb: never a rhombus, because rhombus silhouettes are reserved for capturable boss bolts.
export const ORB_COLORS = Object.freeze({ p: 0x8759ad, v: 0xc985ef, w: 0xf1e5c5 });
export const ORB: PixelRows = Object.freeze(['.ppp.', 'pvvvp', 'pvwvp', 'pvvvp', '.ppp.']);
// Small fragment left by every 4th debugged bug: the gold ring of the route fragment, reduced.
export const FRAGMENT_SMALL: PixelRows = Object.freeze(['.gg.', 'gl.g', 'g..g', '.gg.', '.o..']);
