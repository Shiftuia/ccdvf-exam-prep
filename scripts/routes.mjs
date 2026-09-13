// Route metadata shared between the build-time HTML generator
// (scripts/generate-html.mjs) and any place in the app that needs the same
// facts (e.g. future client-side confirmation of what shipped). Titles,
// descriptions and H1s come verbatim from M2's SEO table.
export const routes = [
  {
    key: 'home',
    path: '/',
    title: 'Blueprint — Claude certification practice exams',
    description:
      "Free practice exams for the Claude certifications — original questions written to each exam's published blueprint, with every answer option explained.",
  },
  {
    key: 'exam',
    path: '/exam/',
    title: 'CCDV-F Exam Guide: Format, Domains & Registration | Blueprint',
    description:
      'Independent guide to the Claude Certified Developer – Foundations exam: 53 items, eight domains, registration details and an original practice set.',
  },
  {
    key: 'framework',
    path: '/framework/',
    title: 'CCDV-F Study Framework: How to Prepare | Blueprint',
    description:
      'A practical CCDV-F study framework: map the eight published domains, practise the decisions behind them, then review every mistake.',
  },
  {
    key: 'cheat-sheet',
    path: '/cheat-sheet/',
    title: 'CCDV-F Cheat Sheet: 8 Exam Domains | Blueprint',
    description:
      'A concise CCDV-F cheat sheet covering the eight published exam domains, key distinctions and the areas to review before test day.',
  },
  {
    key: 'quiz',
    path: '/quiz/',
    title: 'CCDV-F Practice Exam: 53 Original Questions | Blueprint',
    description:
      'Take a free 53-question CCDV-F practice exam. Original questions matched to the published blueprint, with every answer option explained.',
  },
  {
    key: 'privacy',
    path: '/privacy/',
    title: 'Privacy | Blueprint',
    description: 'What Blueprint collects, why, and how to have your data removed.',
  },
];
