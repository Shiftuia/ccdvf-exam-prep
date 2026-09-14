import type { Domain, Question } from './types';
import { scoreAnswer } from './quiz';

export type DomainOutcome = {
  id: string;
  name: string;
  weightPercent: number;
  total: number;
  got: number;
  missed: number;
  priority: number;
};

// Ranking rule: what a miss costs on the real exam, not how many misses there
// are. Four misses in a 33.1% domain outrank one in a 2.6% domain.
export function domainOutcomes(questions: Question[], answers: Record<string, string[]>, domains: Domain[]): DomainOutcome[] {
  return domains
    .map((domain) => {
      const items = questions.filter((question) => question.domainId === domain.id);
      const got = items.filter((question) => scoreAnswer(question.options, answers[question.id] || [])).length;
      const missed = items.length - got;
      return {
        id: domain.id,
        name: domain.name,
        weightPercent: domain.weightPercent,
        total: items.length,
        got,
        missed,
        priority: missed * domain.weightPercent,
      };
    })
    .filter((outcome) => outcome.total > 0)
    .sort((a, b) => b.priority - a.priority || b.weightPercent - a.weightPercent);
}

export function missedQuestions(questions: Question[], answers: Record<string, string[]>): Question[] {
  return questions.filter((question) => !scoreAnswer(question.options, answers[question.id] || []));
}

export function answeredQuestions(questions: Question[], answers: Record<string, string[]>): Question[] {
  return questions.filter((question) => (answers[question.id] || []).length > 0);
}

// One item per domain, medium first so the sampler leans on representative
// items rather than the easiest or the hardest in each domain.
export function sampleQuickCheck(
  questions: Question[],
  domains: Domain[],
  random: () => number = Math.random
): Question[] {
  const picked: Question[] = [];
  for (const domain of domains) {
    const pool = questions.filter((question) => question.domainId === domain.id);
    if (pool.length === 0) continue;
    const preferred = pool.filter((question) => question.difficulty === 'medium');
    const source = preferred.length > 0 ? preferred : pool;
    picked.push(source[Math.floor(random() * source.length) % source.length]);
  }
  return picked;
}
