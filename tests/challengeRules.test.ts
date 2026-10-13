import { expect, it } from 'vitest';
import { initialProgress, completeRoute, freeGuardian, nodeState } from '../src/game/challengeRules';
it('starts with nothing earned and records progress without mutating earlier states', () => {
  const start = initialProgress();
  expect(start).toEqual({ route: false, guardian: false });
  const routed = completeRoute(start);
  expect(routed).toEqual({ route: true, guardian: false });
  expect(completeRoute(routed)).toEqual(routed);
  expect(freeGuardian(routed)).toEqual({ route: true, guardian: true });
  expect(start.route).toBe(false);
});
it('shows the Arequipa node corrupted until the guardian is freed', () => {
  expect(nodeState(initialProgress())).toBe('corrupted');
  expect(nodeState({ route: true, guardian: false })).toBe('corrupted');
  expect(nodeState({ route: false, guardian: true })).toBe('restored');
});
