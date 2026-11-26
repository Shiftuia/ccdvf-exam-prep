import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROUTE_DIRS = ['.', 'exam', 'framework', 'cheat-sheet', 'quiz', 'privacy'];

describe('support link', () => {
  it('lives once, inside the header nav, with the shared label and tracking', () => {
    const main = readFileSync(resolve(root, 'src/main.ts'), 'utf-8');
    const matches = main.match(/<a\s[^>]*href="https:\/\/shiftuia\.com\/support"[^>]*>/g) ?? [];
    expect(matches).toHaveLength(1);
    expect(matches[0]).toContain('rel="noopener"');
    expect(matches[0]).toContain('data-umami-event="support-click"');
    expect(matches[0]).toContain('data-umami-event-placement="quiz-header"');
    const nav = main.match(/<nav>.*<\/nav>/)?.[0] ?? '';
    expect(nav).toContain('shiftuia.com/support');
    expect(nav).toContain('<span>Support my work</span>');
    expect(nav).toMatch(/<svg aria-hidden="true"/);
  });

  for (const dir of ROUTE_DIRS) {
    it(`${dir}/index.html has no separate support strip above #app`, () => {
      const html = readFileSync(resolve(root, dir, 'index.html'), 'utf-8');
      expect(html).toContain('<body><div id="app"></div>');
      expect(html).not.toContain('shiftuia.com/support');
    });
  }
});
