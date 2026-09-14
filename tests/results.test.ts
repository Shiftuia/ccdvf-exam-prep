import { describe, expect, it } from 'vitest';
import { answeredQuestions, domainOutcomes, missedQuestions, sampleQuickCheck, scopedQuestions } from '../src/lib/results';
import { cheatSheetAnchor, cheatSheetHeadings } from '../src/lib/study-links';
import { renderMarkdown, slugify } from '../src/lib/markdown';
import { cheatSheetPage } from '../src/content/pages';
import { domains, questions } from '../src/data/questions';
import type { Domain, Question } from '../src/lib/types';

function item(id: string, domainId: string, difficulty: Question['difficulty'] = 'medium'): Question {
  return {
    id,
    domainId,
    subSkillId: `${domainId}-s`,
    type: 'single',
    difficulty,
    stem: `Stem ${id}`,
    options: [
      { id: 'a', text: 'A', correct: true, explanation: 'yes' },
      { id: 'b', text: 'B', correct: false, explanation: 'no' },
    ],
    rationale: 'r',
    sourceNote: 'original',
  };
}

const heavy: Domain = { id: 'heavy', name: 'Applications & Integration', weightPercent: 33.1, questionCount: 17 };
const light: Domain = { id: 'light', name: 'Eval / Testing / Debugging', weightPercent: 2.6, questionCount: 1 };
const testDomains = [light, heavy];

describe('weighted results ranking', () => {
  const bank = [...Array.from({ length: 17 }, (_, i) => item(`h-${i}`, 'heavy')), item('l-0', 'light')];

  it('ranks a heavy-weight domain above a light one that was also missed', () => {
    const answers: Record<string, string[]> = {};
    bank.forEach((q) => (answers[q.id] = ['a']));
    for (let i = 0; i < 4; i += 1) answers[`h-${i}`] = ['b'];
    answers['l-0'] = ['b'];
    const ranked = domainOutcomes(bank, answers, testDomains);
    expect(ranked[0].id).toBe('heavy');
    expect(ranked[0].got).toBe(13);
    expect(ranked[0].total).toBe(17);
    expect(ranked[1].id).toBe('light');
  });

  it('never ranks a clean heavy domain above a missed light one', () => {
    const answers: Record<string, string[]> = {};
    bank.forEach((q) => (answers[q.id] = ['a']));
    answers['l-0'] = ['b'];
    const ranked = domainOutcomes(bank, answers, testDomains);
    expect(ranked[0].id).toBe('light');
    expect(ranked[0].priority).toBeCloseTo(2.6);
    expect(ranked[1].missed).toBe(0);
  });

  it('omits domains with no questions in this attempt', () => {
    const ranked = domainOutcomes([item('l-0', 'light')], {}, testDomains);
    expect(ranked.map((o) => o.id)).toEqual(['light']);
  });

  it('treats an unanswered question as missed', () => {
    const ranked = domainOutcomes([item('l-0', 'light')], {}, testDomains);
    expect(ranked[0].missed).toBe(1);
  });
});

describe('review filtering', () => {
  const bank = [item('a', 'heavy'), item('b', 'heavy'), item('c', 'light')];
  const answers = { a: ['a'], b: ['b'], c: [] as string[] };

  it('returns only questions that were not answered correctly', () => {
    expect(missedQuestions(bank, answers).map((q) => q.id)).toEqual(['b', 'c']);
  });

  it('reports which questions the user actually answered', () => {
    expect(answeredQuestions(bank, answers).map((q) => q.id)).toEqual(['a', 'b']);
  });
});

describe('partial quick check', () => {
  const bank = [item('h-0', 'heavy'), item('h-1', 'heavy'), item('l-0', 'light')];

  it('ranks only the domains the user actually answered', () => {
    const answers = { 'h-0': ['b'] };
    const scoped = scopedQuestions(bank, answers, 'answered');
    expect(scoped.map((q) => q.id)).toEqual(['h-0']);
    const ranked = domainOutcomes(scoped, answers, testDomains);
    expect(ranked.map((o) => o.id)).toEqual(['heavy']);
    expect(ranked[0].total).toBe(1);
    expect(ranked[0].missed).toBe(1);
  });

  it('never reports an untouched domain as a weakness', () => {
    const answers = { 'h-0': ['a'] };
    const ranked = domainOutcomes(scopedQuestions(bank, answers, 'answered'), answers, testDomains);
    expect(ranked.some((o) => o.id === 'light')).toBe(false);
  });

  it('leaves the full set untouched when scope is all', () => {
    expect(scopedQuestions(bank, { 'h-0': ['a'] }, 'all')).toHaveLength(3);
  });
});

describe('partial quick check on the real bank', () => {
  it('ranks only answered domains for a 3-of-8 attempt', () => {
    const sample = sampleQuickCheck(questions, domains, () => 0);
    expect(sample).toHaveLength(8);
    const answers: Record<string, string[]> = {};
    for (const picked of sample.slice(0, 3)) answers[picked.id] = [picked.options[0].id];
    const scoped = scopedQuestions(sample, answers, 'answered');
    expect(scoped).toHaveLength(3);
    const ranked = domainOutcomes(scoped, answers, domains);
    expect(ranked).toHaveLength(3);
    expect(new Set(ranked.map((o) => o.id))).toEqual(new Set(sample.slice(0, 3).map((q) => q.domainId)));
    for (const outcome of ranked) expect(outcome.total).toBe(1);
  });
});

describe('quick check sampler', () => {
  it('draws exactly one question per domain from the real bank', () => {
    const sample = sampleQuickCheck(questions, domains, () => 0);
    expect(sample).toHaveLength(domains.length);
    expect(new Set(sample.map((q) => q.domainId)).size).toBe(domains.length);
  });

  it('samples only from the existing bank, adding no new content', () => {
    const ids = new Set(questions.map((q) => q.id));
    for (const picked of sampleQuickCheck(questions, domains, () => 0.99)) expect(ids.has(picked.id)).toBe(true);
  });

  it('prefers medium difficulty when a domain has one', () => {
    const bank = [item('easy-1', 'heavy', 'easy'), item('med-1', 'heavy', 'medium'), item('hard-1', 'heavy', 'hard')];
    expect(sampleQuickCheck(bank, [heavy], () => 0)[0].id).toBe('med-1');
  });

  it('falls back to any difficulty when a domain has no medium item', () => {
    const bank = [item('hard-1', 'heavy', 'hard')];
    expect(sampleQuickCheck(bank, [heavy], () => 0)[0].id).toBe('hard-1');
  });

  it('skips a domain with no questions rather than emitting a hole', () => {
    expect(sampleQuickCheck([item('h', 'heavy')], testDomains)).toHaveLength(1);
  });
});

describe('study links', () => {
  it('gives every real domain a cheat-sheet anchor', () => {
    for (const domain of domains) expect(cheatSheetAnchor(domain.id)).toBeTruthy();
  });

  it('resolves each anchor to a heading that exists in the rendered cheat sheet', () => {
    for (const domain of domains) expect(cheatSheetPage.bodyHtml).toContain(`id="${cheatSheetAnchor(domain.id)}"`);
  });

  it('keeps the anchor table in sync with the cheat sheet headings', () => {
    for (const heading of cheatSheetHeadings()) expect(cheatSheetPage.bodyHtml).toContain(`id="${slugify(heading)}"`);
  });

  it('returns null for an unknown domain instead of a broken link', () => {
    expect(cheatSheetAnchor('nope')).toBeNull();
  });
});

describe('markdown heading anchors', () => {
  it('adds slug ids to h2 and h3 headings', () => {
    expect(renderMarkdown('## Tools & MCPs — 10.6%')).toContain('<h2 id="tools-mcps-10-6">');
    expect(renderMarkdown('### Deep dive')).toContain('<h3 id="deep-dive">');
  });

  it('leaves h4 and below without ids', () => {
    expect(renderMarkdown('#### Minor')).toBe('<h4>Minor</h4>');
  });
});
