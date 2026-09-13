import examOverviewRaw from '../../content/pages/exam-overview.md?raw';
import frameworkRaw from '../../content/pages/framework.md?raw';
import cheatSheetRaw from '../../content/pages/cheat-sheet.md?raw';
import { renderMarkdown } from '../lib/markdown';

// The source markdown files each open with their own "# Title" line. The
// page shell already renders one <h1> (this file's `h1` field, matched to
// M2's SEO table), so strip the source's leading H1 here -- otherwise every
// content page ships two <h1> elements, which is both a duplicate-heading
// accessibility problem and confusing for on-page SEO signals.
function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^#\s+.*\n+/, '');
}


export type ContentPage = {
  title: string;
  description: string;
  h1: string;
  bodyHtml: string;
};

// M2 SEO table maps these to /ccdv-f, /ccdv-f/framework, /ccdv-f/cheat-sheet.
// This build ships the routes E1 already scaffolded and linked from nav:
// /exam/, /framework/, /cheat-sheet/. Renaming the URL taxonomy this late
// would touch nav links, the GH Pages base-path logic and canonical URLs for
// no functional gain before launch, so the M2 title/description/H1 copy is
// applied to the equivalent existing route instead of the literal M2 path.
// Flagged on the E3 kanban task for Dima/growth-stream awareness.
export const examOverviewPage: ContentPage = {
  title: 'CCDV-F Exam Guide: Format, Domains & Registration | Blueprint',
  description:
    "Independent guide to the Claude Certified Developer – Foundations exam: 53 items, eight domains, registration details and an original practice set.",
  h1: 'CCDV-F exam guide',
  bodyHtml: renderMarkdown(stripLeadingH1(examOverviewRaw)),
};

export const frameworkPage: ContentPage = {
  title: 'CCDV-F Study Framework: How to Prepare | Blueprint',
  description:
    'A practical CCDV-F study framework: map the eight published domains, practise the decisions behind them, then review every mistake.',
  h1: 'How to prepare for CCDV-F',
  bodyHtml: renderMarkdown(stripLeadingH1(frameworkRaw)),
};

export const cheatSheetPage: ContentPage = {
  title: 'CCDV-F Cheat Sheet: 8 Exam Domains | Blueprint',
  description:
    'A concise CCDV-F cheat sheet covering the eight published exam domains, key distinctions and the areas to review before test day.',
  h1: 'CCDV-F cheat sheet',
  bodyHtml: renderMarkdown(stripLeadingH1(cheatSheetRaw)),
};
