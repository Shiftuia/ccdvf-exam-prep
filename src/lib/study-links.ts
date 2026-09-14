import { slugify } from './markdown';

// Cheat-sheet headings are numbered and carry the weight, so the anchor cannot
// be derived from the domain name alone. A test asserts each of these still
// resolves to a heading in the rendered page.
const CHEAT_SHEET_HEADINGS: Record<string, string> = {
  'applications-integration': '1. Applications & Integration — 33.1%',
  'model-selection-optimization': '2. Model Selection & Optimization — 16.8%',
  'agents-workflows': '3. Agents & Workflows — 14.7%',
  'prompt-context-engineering': '4. Prompt & Context Engineering — 11.0%',
  'tools-mcps': '5. Tools & MCPs — 10.6%',
  'security-safety': '6. Security & Safety — 8.1%',
  'claude-code': '7. Claude Code — 3.1%',
  'eval-testing-debugging': '8. Evaluation, Testing & Debugging — 2.6%',
};

export function cheatSheetAnchor(domainId: string): string | null {
  const heading = CHEAT_SHEET_HEADINGS[domainId];
  return heading ? slugify(heading) : null;
}

export function cheatSheetHeadings(): string[] {
  return Object.values(CHEAT_SHEET_HEADINGS);
}
