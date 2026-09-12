import { defineConfig } from 'vite';
import { resolve } from 'node:path';
const pages = ['index', 'quiz/index', 'exam/index', 'framework/index', 'cheat-sheet/index', 'privacy/index'];
export default defineConfig({ base: '/', build: { rollupOptions: { input: Object.fromEntries(pages.map((page) => [page.replace('/', '-'), resolve(__dirname, `${page}.html`)])) } } });
