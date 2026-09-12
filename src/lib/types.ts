export type Option = { id: string; text: string; correct: boolean; explanation: string };
export type Question = { id: string; domainId: string; subSkillId: string; type: 'single' | 'multi'; difficulty: 'easy' | 'medium' | 'hard'; stem: string; options: Option[]; rationale: string; sourceNote: string };
export type Domain = { id: string; name: string; questionCount: number };
export type AttemptPayload = { schemaVersion: 1; attemptId: string; clientId: string; startedAt: string; completedAt: string; completed: true; scaledScore: number; rawCorrect: number; itemCount: number; answers: { questionId: string; correct: boolean; selectedOptionIds: string[]; elapsedMs: number }[] };
export type SubscribePayload = { schemaVersion: 1; email: string; consent: true; consentText: string; source: 'quiz-result-ccdvf'; submittedAt: string };
