import type { AttemptPayload, SubscribePayload } from '../lib/types';
export interface AnalyticsAdapter { pageView(path: string): void; event(name: string, props?: Record<string, string | number | boolean>): void }
export interface ResultsAdapter { submitAttempt(payload: AttemptPayload): Promise<void> }
export interface EmailAdapter { subscribe(payload: SubscribePayload): Promise<{ ok: boolean; reason?: string }> }
const endpoint = import.meta.env.VITE_API_ENDPOINT as string | undefined;
const noopAnalytics: AnalyticsAdapter = { pageView: () => undefined, event: () => undefined };
const noopResults: ResultsAdapter = { submitAttempt: async () => undefined };
const noopEmail: EmailAdapter = { subscribe: async () => ({ ok: true }) };
const post = async (path: string, payload: unknown): Promise<Response> => { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 5000); try { return await fetch(`${endpoint}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal }); } finally { clearTimeout(timeout); } };
export const analytics: AnalyticsAdapter = noopAnalytics;
export const results: ResultsAdapter = import.meta.env.VITE_RESULTS_ADAPTER === 'http' && endpoint ? { submitAttempt: async (payload) => { try { await post('/attempt', payload); } catch { /* optional telemetry */ } } } : noopResults;
export const email: EmailAdapter = import.meta.env.VITE_EMAIL_ADAPTER === 'http' && endpoint ? { subscribe: async (payload) => { try { return (await post('/subscribe', payload)).ok ? { ok: true } : { ok: false, reason: 'request failed' }; } catch { return { ok: false, reason: 'network error' }; } } } : noopEmail;
