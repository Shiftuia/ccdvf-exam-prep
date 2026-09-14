import type { Domain, Question } from '../lib/types';
import domainsDoc from '../../content/domains.json';
import questionsDoc from '../../content/questions.json';

type SubSkill = { id: string; name: string; weightPercent: number; questionCount: number };
type DomainDoc = { id: string; name: string; weightPercent: number; questionCount: number; subSkills: SubSkill[] };

const parsedDomains = domainsDoc as { domains: DomainDoc[] };

export const examMeta = {
  examCode: domainsDoc.examCode,
  examName: domainsDoc.examName,
  itemCount: domainsDoc.itemCount,
  timeLimitMinutes: domainsDoc.timeLimitMinutes,
  passScaledScore: domainsDoc.passScaledScore,
  maxScaledScore: domainsDoc.maxScaledScore,
};

export const contentVersion = `${questionsDoc.schemaVersion}-${questionsDoc.generatedAt}`;
export const contentGeneratedAt = questionsDoc.generatedAt as string;

export const domains: Domain[] = parsedDomains.domains.map((domain) => ({
  id: domain.id,
  name: domain.name,
  weightPercent: domain.weightPercent,
  questionCount: domain.questionCount,
}));

export const questions: Question[] = (questionsDoc as { questions: Question[] }).questions;
