export type Option = { id: string; text: string; correct: boolean; explanation: string };
export type Question = { id: string; domainId: string; subSkillId: string; type: 'single' | 'multi'; difficulty: 'easy' | 'medium' | 'hard'; stem: string; options: Option[]; rationale: string; sourceNote: string };
export type Domain = { id: string; name: string; weightPercent: number; questionCount: number };
export type SubscribePayload = { schemaVersion: 1; email: string; consent: true; consentText: string; source: 'quiz-result-ccdvf'; submittedAt: string };
