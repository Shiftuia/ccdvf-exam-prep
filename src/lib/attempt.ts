import type { Question } from './types';

export type AttemptMode = 'full' | 'quick';

export type Attempt = {
  version: string;
  mode: AttemptMode;
  index: number;
  answers: Record<string, string[]>;
  startedAt: string;
  questionIds: string[];
  order: Record<string, string[]>;
};

export type LoadResult =
  | { status: 'none' }
  | { status: 'ok'; attempt: Attempt }
  | { status: 'reset'; reason: string };

export function createAttempt(
  version: string,
  mode: AttemptMode,
  items: Question[],
  shuffle: <T>(values: T[]) => T[]
): Attempt {
  return {
    version,
    mode,
    index: 0,
    answers: {},
    startedAt: new Date().toISOString(),
    questionIds: items.map((question) => question.id),
    order: Object.fromEntries(items.map((question) => [question.id, shuffle(question.options).map((o) => o.id)])),
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

// Every rejection path here must end at the start screen, never at a render
// against a question the saved attempt knows nothing about: that produced a
// blank page for anyone holding an attempt from a previous question set.
export function loadAttempt(raw: string | null, version: string, bank: Question[]): LoadResult {
  if (raw === null) return { status: 'none' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'reset', reason: 'Your saved attempt could not be read, so it was cleared.' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { status: 'reset', reason: 'Your saved attempt could not be read, so it was cleared.' };
  }

  const candidate = parsed as Partial<Attempt>;
  const outdated = { status: 'reset', reason: 'The question set was updated, so this attempt was reset.' } as const;
  if (candidate.version !== version) return outdated;
  if (candidate.mode !== 'full' && candidate.mode !== 'quick') return outdated;
  if (typeof candidate.startedAt !== 'string' || Number.isNaN(Date.parse(candidate.startedAt))) return outdated;
  if (!isStringArray(candidate.questionIds) || candidate.questionIds.length === 0) return outdated;
  if (typeof candidate.index !== 'number' || !Number.isInteger(candidate.index)) return outdated;
  if (candidate.index < 0 || candidate.index > candidate.questionIds.length) return outdated;
  if (typeof candidate.order !== 'object' || candidate.order === null) return outdated;
  if (typeof candidate.answers !== 'object' || candidate.answers === null) return outdated;

  const byId = new Map(bank.map((question) => [question.id, question]));
  const order = candidate.order as Record<string, unknown>;
  for (const id of candidate.questionIds) {
    const question = byId.get(id);
    if (!question) return outdated;
    const ids = order[id];
    if (!isStringArray(ids) || ids.length !== question.options.length) return outdated;
    const optionIds = new Set(question.options.map((option) => option.id));
    if (ids.some((optionId) => !optionIds.has(optionId))) return outdated;
  }

  const answers = candidate.answers as Record<string, unknown>;
  for (const [id, selected] of Object.entries(answers)) {
    if (!candidate.questionIds.includes(id) || !isStringArray(selected)) return outdated;
  }

  return { status: 'ok', attempt: candidate as Attempt };
}

export function attemptQuestions(attempt: Attempt, bank: Question[]): Question[] {
  const byId = new Map(bank.map((question) => [question.id, question]));
  return attempt.questionIds.map((id) => byId.get(id)!).filter(Boolean);
}
