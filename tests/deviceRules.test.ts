import { expect, it } from 'vitest';
import { DEVICE_NOTICE, needsKeyboardNotice } from '../src/game/deviceRules';
const fit = { coarsePointer: false, canvasWidth: 320, canvasHeight: 180, viewportHeight: 900 };
it('does not warn for a fine pointer when the actual canvas fits at native size', () => {
  expect(needsKeyboardNotice(fit)).toBe(false);
});
it('warns touch-first users even when the complete native canvas fits', () => {
  expect(needsKeyboardNotice({ ...fit, coarsePointer: true })).toBe(true);
});
it('uses the native320 pixel width boundary, not a user-agent guess', () => {
  expect(needsKeyboardNotice({ ...fit, canvasWidth: 319.99 })).toBe(true);
  expect(needsKeyboardNotice({ ...fit, canvasWidth: 320 })).toBe(false);
});
it('uses the native180 pixel height boundary', () => {
  expect(needsKeyboardNotice({ ...fit, canvasHeight: 179.99 })).toBe(true);
  expect(needsKeyboardNotice({ ...fit, canvasHeight: 180 })).toBe(false);
});
it('warns when the viewport itself cannot contain the native-height game', () => {
  expect(needsKeyboardNotice({ ...fit, viewportHeight: 179 })).toBe(true);
});
it('keeps470px fine-pointer fit separate from coarse-pointer input support', () => {
  const narrow = { ...fit, canvasWidth: 438, canvasHeight: 438 * 180 / 320 };
  expect(needsKeyboardNotice(narrow)).toBe(false);
  expect(needsKeyboardNotice({ ...narrow, coarsePointer: true })).toBe(true);
});
it('preserves the exact approved Spanish advisory, without claiming touch controls', () => {
  expect(DEVICE_NOTICE).toBe('PachaByte se juega con teclado: ábrelo en una computadora.');
});
