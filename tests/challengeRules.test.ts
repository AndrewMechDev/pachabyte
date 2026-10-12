import { expect, it } from 'vitest';
import { initialProgress, completeTraining, guardianAvailable } from '../src/game/challengeRules';
it('makes fresh demo access independent of earned achievements', () => {
  const start = initialProgress();
  expect(guardianAvailable(start)).toBe(true);
  expect(start).toEqual({ training: false, guardian: false });
  expect(completeTraining(start, 3)).toEqual(start);
  const done = completeTraining(start, 4);
  expect(done.training).toBe(true);
  expect(completeTraining(done, 0)).toEqual(done);
  expect(start.training).toBe(false);
});
