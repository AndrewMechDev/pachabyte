// The three pickups themselves are the user's sprites (spriteFrames.ts). This keeps only the HUD shield icon.
export type PixelRows = readonly string[];

// 5x6 shield icon for the HUD, drawn next to the hearts ('1' = pixel), same binary mask format as HEART.
export const SHIELD_ICON: PixelRows = Object.freeze(['01110', '10001', '10001', '10001', '10001', '01110']);
