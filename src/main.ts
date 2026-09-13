import './style.css';
import { analytics, email, results } from './adapters';
import { certifications } from './data/certifications';
import { domains, examMeta, questions } from './data/questions';
import { scaledScore, scoreAnswer, shuffleOptions } from './lib/quiz';
import { cheatSheetPage, examOverviewPage, frameworkPage } from './content/pages';

const CREDLY_BADGE_URL = import.meta.env.VITE_CREDLY_BADGE_URL as string | undefined;
const EMAIL_LIVE = import.meta.env.VITE_EMAIL_ADAPTER === 'http';

const footerDisclaimer = `Blueprint is an independent study resource. It is not affiliated with, endorsed by, or sponsored by Anthropic. Claude and the Claude certification names are Anthropic's; they are used here only to say which exams these materials are for. Every practice question on this site is original material written against each exam's publicly published blueprint — none of it is real, leaked, or recalled exam content.`;

const authorBlock = `<p><strong>Who made this.</strong> I'm Dima — I build with Claude and write about it on YouTube as Holy Shifted. I sat the Claude Certified Developer – Foundations exam and passed above the 720 pass mark. The credential is verifiable${CREDLY_BADGE_URL ? ` here: <a href="${CREDLY_BADGE_URL}">Credly badge</a>` : ' via a Credly badge (link pending)'}. I wrote every question on this site myself.</p>`;

const BASE = (import.meta.env.VITE_NAV_BASE as string | undefined)?.replace(/\/$/, '') || '';
const footer = `<footer><p>${footerDisclaimer}</p></footer>`;
const shell = (content: string) =>
  `<header><a class="brand" href="${BASE}/">Blueprint <small>by Holy Shifted</small></a><nav><a href="${BASE}/exam/">Exam</a><a href="${BASE}/framework/">Framework</a><a href="${BASE}/cheat-sheet/">Cheat sheet</a><a href="${BASE}/quiz/">Practice exam</a></nav></header><main>${content}</main>${footer}`;

const tiles = certifications
  .map((item) =>
    item.state === 'available'
      ? `<article class="tile available"><span>${item.code}</span><h3>${item.displayName}</h3><p>${item.audience}</p><p>${item.meta}</p><a class="button" href="${BASE}${item.href}">Start the practice exam</a></article>`
      : `<article class="tile coming-soon" aria-disabled="true"><span>${item.code}</span><h3>${item.displayName}</h3><p>${item.audience}</p><b>Not written yet</b><p>I've only sat the Developer exam. A practice set for this one goes up when I've done the work properly — no date promised.</p></article>`
  )
  .join('');

const contentPage = (page: { h1: string; bodyHtml: string }, extraBanner?: string) =>
  shell(`<section class="prose"><h1>${page.h1}</h1>${extraBanner || ''}${page.bodyHtml}</section>`);

// M1 §4.3(c): verbatim, placed directly under the page title, --ink-muted.
const cheatSheetDisclaimer = `<p class="disclaimer">This sheet is my own compression of the CCDV-F blueprint: the eight domains, what each one actually asks you to know, and the distinctions that are easy to get wrong under time pressure. It is written from the published exam guide and from my own preparation and sitting of the exam. It is not an answer key and it is not affiliated with Anthropic.</p>`;

const privacyBodyHtml = `<p>Blueprint is a free, independent study resource by Holy Shifted.</p>
<h2>What I collect</h2>
<p>If you choose to subscribe after a practice exam, I collect your email address, the exact consent text you agreed to, and the date and time you submitted and confirmed it. I keep the subscription status needed to avoid sending mail to people who unsubscribed, bounced, or reported a message as spam.</p>
<p>The practice exam does not require an account. I do not connect your email address to your quiz answers, score, or anonymous visit measurements. I do not ask for a name, company, phone number, or payment information. I do not deliberately collect IP addresses or browser fingerprints for the list.</p>
<h2>Why I use it</h2>
<p>I use your address only to send an email when a new Blueprint practice exam is published. The free exam is never locked behind email. I do not sell, rent, or share the list for anyone else's marketing.</p>
<h2>How email is delivered</h2>
<p>I keep a provider-neutral subscription record in a Cloudflare-hosted database and use an email service provider to send and manage these emails. That provider processes the address only for that purpose. I can change delivery providers without changing why your address was collected.</p>
<h2>Your choices</h2>
<p>Every email has a one-click unsubscribe link. You can also ask me to delete your subscription record by emailing <code>privacy@holyshifted.com</code>. I will stop sending mail and delete the address from my active records. I retain only the minimum non-identifying deletion record needed to honour that request and prevent accidental re-subscription.</p>
<h2>Changes</h2>
<p>If this note changes in a way that affects how subscription data is used, I will update the date below and ask for fresh consent where that is required.</p>
<p class="muted">Last updated: 12 September 2026.</p>
<p class="disclaimer"><strong>Status for this launch:</strong> the email subscription backend is not live yet — the form on the results screen is disabled with a note until it is. Nothing described above is collected until that ships; the quiz itself has never required an account or personal data.</p>`;

const root = document.querySelector<HTMLDivElement>('#app')!;
const path = location.pathname;

type Saved = { index: number; answers: Record<string, string[]>; startedAt: string; order: Record<string, string[]> };
const storageKey = 'blueprint-ccdvf-attempt-v1';
const clientIdKey = 'blueprint-client';

function freshAttempt(): Saved {
  return {
    index: 0,
    answers: {},
    startedAt: new Date().toISOString(),
    order: Object.fromEntries(questions.map((q) => [q.id, shuffleOptions(q.options).map((o) => o.id)])),
  };
}

function mountQuiz() {
  const started = localStorage.getItem(storageKey) !== null;
  if (!started) {
    root.innerHTML = shell(
      `<section class="quiz start"><h1>Practice exam: ${examMeta.examName}</h1><p>${examMeta.itemCount} questions · roughly ${examMeta.timeLimitMinutes} minutes, matching the real exam's time limit (not enforced here).</p><p class="disclaimer">Before you start: these ${examMeta.itemCount} questions are original. I wrote them against the published ${examMeta.examCode} blueprint and weighted them across the eight domains the same way the real exam is weighted, so the shape of the paper feels right. They are not the real exam's questions — Anthropic does not publish those, and anything claiming to sell them is selling you something else. Treat a good score here as a sign your preparation is working, not as a prediction.</p><button id="start" class="button">Start the practice exam</button></section>`
    );
    document.querySelector('#start')!.addEventListener('click', () => {
      localStorage.setItem(storageKey, JSON.stringify(freshAttempt()));
      render();
    });
    return;
  }
  render();

  function loadState(): Saved {
    const saved: Saved | null = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return saved || freshAttempt();
  }

  function render() {
    const state = loadState();
    const question = questions[state.index];
    if (!question) {
      renderResults(state);
      return;
    }
    const revealed = Boolean(state.answers[question.id]);
    const selected = new Set(state.answers[question.id] || []);
    const domainName = domains.find((d) => d.id === question.domainId)?.name || question.domainId;
    const choices = state.order[question.id]
      .map((id) => question.options.find((o) => o.id === id)!)
      .map((option) => {
        const mark = revealed ? (option.correct ? ' correct' : ' incorrect') : '';
        const inputType = question.type === 'single' ? 'type="radio" name="answer"' : 'type="checkbox"';
        const reveal = revealed
          ? `<small><strong>${option.correct ? '✓ Correct' : '× Incorrect'}</strong> ${option.explanation}${selected.has(option.id) ? ' <em>Your selection</em>' : ''}</small>`
          : '';
        return `<label class="option${mark}"><input ${inputType} value="${option.id}" ${selected.has(option.id) ? 'checked' : ''} ${revealed ? 'disabled' : ''}><span>${option.text}</span>${reveal}</label>`;
      })
      .join('');
    root.innerHTML = shell(
      `<section class="quiz"><p class="eyebrow">Question ${state.index + 1} of ${examMeta.itemCount} · ${domainName}</p><progress value="${state.index + 1}" max="${examMeta.itemCount}"></progress><p id="timer" class="muted">Elapsed time: 0m</p><h1>${question.stem}</h1>${question.type === 'multi' ? '<p>Select all that apply.</p>' : ''}<form id="question-form">${choices}<div class="actions">${revealed ? `<p>${scoreAnswer(question.options, [...selected]) ? 'You got this one.' : 'Not this one.'}</p><button>${state.index === questions.length - 1 ? 'See your results' : 'Next question'}</button>` : '<button disabled>Check answer</button>'}</div></form><button class="link" id="reset">Reset and start over</button></section>`
    );
    const timer = document.querySelector('#timer')!;
    const tick = () => (timer.textContent = `Elapsed time: ${Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 60000)}m`);
    tick();
    document.querySelectorAll<HTMLInputElement>('input').forEach((input) =>
      input.addEventListener('change', () => {
        const values = [...document.querySelectorAll<HTMLInputElement>('input:checked')].map((item) => item.value);
        const current = loadState();
        current.answers[question.id] = values;
        localStorage.setItem(storageKey, JSON.stringify(current));
        const button = document.querySelector<HTMLButtonElement>('.actions button')!;
        button.disabled = values.length === 0;
      })
    );
    document.querySelector('#question-form')!.addEventListener('submit', (event) => {
      event.preventDefault();
      const current = loadState();
      if (!revealed) {
        render();
      } else {
        current.index += 1;
        localStorage.setItem(storageKey, JSON.stringify(current));
        render();
      }
    });
    document.querySelector('#reset')!.addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      mountQuiz();
    });
  }

  function renderReview(state: Saved) {
    const items = questions
      .map((question, idx) => {
        const selected = new Set(state.answers[question.id] || []);
        const domainName = domains.find((d) => d.id === question.domainId)?.name || question.domainId;
        const options = state.order[question.id]
          .map((id) => question.options.find((o) => o.id === id)!)
          .map(
            (option) =>
              `<li class="option ${option.correct ? 'correct' : 'incorrect'}"><strong>${option.correct ? '✓ Correct' : '× Incorrect'}</strong> ${option.text}${selected.has(option.id) ? ' <em>Your selection</em>' : ''}<br><small>${option.explanation}</small></li>`
          )
          .join('');
        return `<article class="review-item"><p class="eyebrow">Question ${idx + 1} of ${examMeta.itemCount} · ${domainName}</p><h3>${question.stem}</h3><ul>${options}</ul></article>`;
      })
      .join('');
    root.innerHTML = shell(
      `<section class="quiz review"><h1>Full review</h1><p class="muted">Every item, every option, with the reasoning behind each one.</p>${items}<button class="link" id="back-to-results">Back to results</button></section>`
    );
    document.querySelector('#back-to-results')!.addEventListener('click', () => renderResults(state));
  }

  function renderResults(state: Saved) {
    const correct = questions.filter((q) => scoreAnswer(q.options, state.answers[q.id] || [])).length;
    const score = scaledScore(correct, examMeta.itemCount);
    const passed = score >= examMeta.passScaledScore;
    const emailSection = EMAIL_LIVE
      ? `<h2>Want the next one?</h2><p>I'm writing practice sets for the other three Claude certifications. Leave an email and I'll send one message when the next one is live. Nothing else, ever.</p><form id="email-form"><label>Email <input type="email" required placeholder="you@example.com"></label><label><input type="checkbox" required> Email me when a new practice exam goes up. I can unsubscribe from any message.</label><button>Send it to me</button><p id="email-message" aria-live="polite"></p></form><p class="muted">Your email is stored for this one purpose and nothing else. No tracking, no sharing, no other mail.</p>`
      : `<h2>Want the next one?</h2><p class="muted">The mailing list isn't wired up yet for this launch — the practice exam itself is complete and free either way. Check back once the next certification set is ready.</p>`;
    root.innerHTML = shell(
      `<section class="quiz results"><h1>${passed ? "You'd have passed this one." : 'Not there yet.'}</h1><p>${score} out of ${examMeta.maxScaledScore} on this practice set. The real exam passes at ${examMeta.passScaledScore}${passed ? '.' : " — here's where the gaps are."}</p><p class="muted">This is a practice set, not a predictor. The real exam is scaled and equated; this number is just your percentage, weighted by domain.</p><h2>Where you lost points</h2>${domains
        .map((d) => {
          const qs = questions.filter((q) => q.domainId === d.id);
          const got = qs.filter((q) => scoreAnswer(q.options, state.answers[q.id] || [])).length;
          return `<p>${d.name} — ${got}/${qs.length || d.questionCount}</p>`;
        })
        .join('')}<p><button class="link" id="review-all">Review every question and explanation</button></p>${emailSection}<button class="link" id="retake">Retake the exam</button></section>`
    );
    document.querySelector('#review-all')!.addEventListener('click', () => renderReview(state));
    results.submitAttempt({
      schemaVersion: 1,
      attemptId: crypto.randomUUID(),
      clientId: localStorage.getItem(clientIdKey) || crypto.randomUUID(),
      startedAt: state.startedAt,
      completedAt: new Date().toISOString(),
      completed: true,
      scaledScore: score,
      rawCorrect: correct,
      itemCount: examMeta.itemCount,
      answers: questions.map((q) => ({
        questionId: q.id,
        correct: scoreAnswer(q.options, state.answers[q.id] || []),
        selectedOptionIds: state.answers[q.id] || [],
        elapsedMs: 0,
      })),
    });
    if (EMAIL_LIVE) {
      document.querySelector('#email-form')!.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const address = form.querySelector<HTMLInputElement>('input[type=email]')!.value;
        const consentText = 'Email me when a new practice exam goes up. I can unsubscribe from any message.';
        const response = await email.subscribe({
          schemaVersion: 1,
          email: address,
          consent: true,
          consentText,
          source: 'quiz-result-ccdvf',
          submittedAt: new Date().toISOString(),
        });
        document.querySelector('#email-message')!.textContent = response.ok
          ? "Done. You'll hear from me once, when the next set is live."
          : "That didn't go through. Try again in a moment.";
      });
    }
    document.querySelector('#retake')!.addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      location.reload();
    });
  }
}

const routePath = BASE && path.startsWith(BASE) ? path.slice(BASE.length) || '/' : path;

if (routePath === '/' || routePath === '/index.html')
  root.innerHTML = shell(
    `<section class="hero"><p class="eyebrow">Free and independent</p><h1>Practice the blueprint, not a dump.</h1><p>Free practice exams for the Claude certifications — original questions written to each exam's published blueprint, with every answer option explained.</p><a class="button" href="${BASE}/quiz/">Start the practice exam</a></section><section><h2>What this is</h2><p class="prose">Blueprint is a free, independent study resource for Anthropic's Claude certification exams. It is not affiliated with Anthropic, and it does not contain real exam questions. The practice material is written from scratch against the published blueprint.</p></section><section><h2>Practice exams</h2><div class="tiles">${tiles}</div></section><section class="author">${authorBlock}</section>`
  );
else if (routePath.startsWith('/exam')) root.innerHTML = contentPage(examOverviewPage);
else if (routePath.startsWith('/framework')) root.innerHTML = contentPage(frameworkPage);
else if (routePath.startsWith('/cheat-sheet')) root.innerHTML = contentPage(cheatSheetPage, cheatSheetDisclaimer);
else if (routePath.startsWith('/privacy'))
  root.innerHTML = shell(`<section class="prose"><h1>Privacy</h1>${privacyBodyHtml}</section>`);
else if (routePath.startsWith('/quiz')) mountQuiz();
else root.innerHTML = shell(`<section class="prose"><h1>There's nothing at this address.</h1><a class="button" href="${BASE}/">Back to the practice exams</a></section>`);

analytics.pageView(path);
