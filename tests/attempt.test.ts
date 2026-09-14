import { describe, expect, it } from 'vitest';
import { attemptQuestions, createAttempt, loadAttempt, type Attempt } from '../src/lib/attempt';
import type { Question } from '../src/lib/types';

const VERSION = '1-2026-09-14';

function question(id: string, domainId = 'd1'): Question {
  return {
    id,
    domainId,
    subSkillId: `${domainId}-s`,
    type: 'single',
    difficulty: 'medium',
    stem: `Stem ${id}`,
    options: [
      { id: 'a', text: 'A', correct: true, explanation: 'because' },
      { id: 'b', text: 'B', correct: false, explanation: 'no' },
    ],
    rationale: 'r',
    sourceNote: 'original',
  };
}

const bank = [question('q-1'), question('q-2'), question('q-3')];
const identity = <T,>(values: T[]) => values;

function valid(): Attempt {
  return createAttempt(VERSION, 'full', bank, identity);
}

describe('attempt persistence', () => {
  it('reports no saved attempt for empty storage', () => {
    expect(loadAttempt(null, VERSION, bank).status).toBe('none');
  });

  it('resumes a valid in-progress attempt at its index with answers intact', () => {
    const attempt = valid();
    attempt.index = 2;
    attempt.answers['q-1'] = ['a'];
    const result = loadAttempt(JSON.stringify(attempt), VERSION, bank);
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.attempt.index).toBe(2);
    expect(result.attempt.answers['q-1']).toEqual(['a']);
  });

  it('accepts an attempt sitting one past the last question (results screen)', () => {
    const attempt = valid();
    attempt.index = bank.length;
    expect(loadAttempt(JSON.stringify(attempt), VERSION, bank).status).toBe('ok');
  });

  // The pre-fix defect: a saved attempt from an older question set rendered a
  // blank #app because order[question.id] was undefined.
  it('resets an attempt whose order is missing the current question', () => {
    const attempt = valid();
    delete attempt.order['q-2'];
    const result = loadAttempt(JSON.stringify(attempt), VERSION, bank);
    expect(result.status).toBe('reset');
  });

  it('resets an attempt referencing a question id that no longer exists', () => {
    const attempt = valid();
    attempt.questionIds = ['q-1', 'q-removed'];
    attempt.order['q-removed'] = ['a', 'b'];
    expect(loadAttempt(JSON.stringify(attempt), VERSION, bank).status).toBe('reset');
  });

  it('resets an attempt saved against a different content version', () => {
    const attempt = { ...valid(), version: '1-2026-01-01' };
    const result = loadAttempt(JSON.stringify(attempt), VERSION, bank);
    expect(result.status).toBe('reset');
    if (result.status === 'reset') expect(result.reason).toMatch(/question set was updated/i);
  });

  it('resets when the stored order no longer matches the question options', () => {
    const attempt = valid();
    attempt.order['q-1'] = ['a', 'z'];
    expect(loadAttempt(JSON.stringify(attempt), VERSION, bank).status).toBe('reset');
  });

  it('resets unparseable and non-object storage rather than throwing', () => {
    expect(loadAttempt('{not json', VERSION, bank).status).toBe('reset');
    expect(loadAttempt('"a string"', VERSION, bank).status).toBe('reset');
    expect(loadAttempt('null', VERSION, bank).status).toBe('reset');
  });

  it('resets an out-of-range or non-integer index', () => {
    const low = { ...valid(), index: -1 };
    const high = { ...valid(), index: 99 };
    const fractional = { ...valid(), index: 1.5 };
    expect(loadAttempt(JSON.stringify(low), VERSION, bank).status).toBe('reset');
    expect(loadAttempt(JSON.stringify(high), VERSION, bank).status).toBe('reset');
    expect(loadAttempt(JSON.stringify(fractional), VERSION, bank).status).toBe('reset');
  });

  it('resets an unknown mode', () => {
    const attempt = { ...valid(), mode: 'exam' };
    expect(loadAttempt(JSON.stringify(attempt), VERSION, bank).status).toBe('reset');
  });

  it('resets answers keyed to a question outside the attempt', () => {
    const attempt = valid();
    attempt.answers['q-other'] = ['a'];
    expect(loadAttempt(JSON.stringify(attempt), VERSION, bank).status).toBe('reset');
  });

  it('keeps a quick check confined to its own sampled questions', () => {
    const quick = createAttempt(VERSION, 'quick', [bank[1]], identity);
    const result = loadAttempt(JSON.stringify(quick), VERSION, bank);
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.attempt.mode).toBe('quick');
    expect(attemptQuestions(result.attempt, bank).map((q) => q.id)).toEqual(['q-2']);
  });

  it('stores one order entry per question, covering every option', () => {
    const attempt = valid();
    expect(Object.keys(attempt.order)).toEqual(['q-1', 'q-2', 'q-3']);
    expect(attempt.order['q-1']).toEqual(['a', 'b']);
  });
});
