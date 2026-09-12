import { describe, expect, it } from 'vitest';
import { scoreAnswer, scaledScore, shuffleOptions } from '../src/lib/quiz';

const single = [{ id: 'a', correct: true }, { id: 'b', correct: false }];
const multi = [{ id: 'a', correct: true }, { id: 'b', correct: true }, { id: 'c', correct: false }];

describe('quiz scoring', () => {
  it('scores a selected correct single option', () => expect(scoreAnswer(single, ['a'])).toBe(true));
  it('rejects partial multi selections', () => expect(scoreAnswer(multi, ['a'])).toBe(false));
  it('accepts an exact multi selection regardless of order', () => expect(scoreAnswer(multi, ['b', 'a'])).toBe(true));
  it('maps raw score to the documented 0-1000 practice frame', () => expect(scaledScore(38, 53)).toBe(717));
  it('shuffles without dropping option ids', () => expect(shuffleOptions(single, () => 0).map((x) => x.id).sort()).toEqual(['a', 'b']));
});
