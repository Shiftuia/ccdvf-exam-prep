import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROUTE_DIRS = ['.', 'exam', 'framework', 'cheat-sheet', 'quiz', 'privacy'];

describe('support link in generated route HTML', () => {
  for (const dir of ROUTE_DIRS) {
    it(`${dir}/index.html has one tracked /support link above #app`, () => {
      const html = readFileSync(resolve(root, dir, 'index.html'), 'utf-8');
      const matches = html.match(/<a\s[^>]*href="https:\/\/shiftuia\.com\/support"[^>]*>/g) ?? [];
      expect(matches).toHaveLength(1);
      expect(matches[0]).toContain('rel="noopener"');
      expect(matches[0]).toContain('data-umami-event="support-click"');
      expect(matches[0]).toContain('data-umami-event-placement="quiz-topbar"');
      expect(html.indexOf('https://shiftuia.com/support')).toBeLessThan(html.indexOf('<div id="app">'));
    });
  }
});
