import './style.css';
import { analytics, email } from './adapters';
import { certifications } from './data/certifications';
import { contentGeneratedAt, contentVersion, domains, examMeta, questions } from './data/questions';
import { scaledScore, scoreAnswer, shuffleOptions } from './lib/quiz';
import { attemptQuestions, createAttempt, loadAttempt, type Attempt, type AttemptMode } from './lib/attempt';
import { answeredQuestions, domainOutcomes, missedQuestions, sampleQuickCheck, scopedQuestions, type DomainOutcome } from './lib/results';
import { cheatSheetAnchor } from './lib/study-links';
import { cheatSheetPage, examOverviewPage, frameworkPage } from './content/pages';

const CREDLY_BADGE_URL = import.meta.env.VITE_CREDLY_BADGE_URL as string | undefined;
const EMAIL_LIVE = import.meta.env.VITE_EMAIL_ADAPTER === 'http';

const footerDisclaimer = `Blueprint is an independent study resource. It is not affiliated with, endorsed by, or sponsored by Anthropic. Claude and the Claude certification names are Anthropic's; they are used here only to say which exams these materials are for. Every practice question on this site is original material written against each exam's publicly published blueprint — none of it is real, leaked, or recalled exam content.`;

const authorBlock = `<p><strong>Who made this.</strong> I'm Dima — I build with Claude and write about it on YouTube as Holy Shifted. I sat the Claude Certified Developer – Foundations exam and passed above the 720 pass mark. The credential is verifiable${CREDLY_BADGE_URL ? ` here: <a href="${CREDLY_BADGE_URL}">Credly badge</a>` : ' via a Credly badge (link pending)'}. I wrote every question on this site myself.</p>`;

const BASE = (import.meta.env.VITE_NAV_BASE as string | undefined)?.replace(/\/$/, '') || '';
const footer = `<footer><p>${footerDisclaimer}</p><p class="muted">Question set: ${contentGeneratedAt} · ${examMeta.itemCount} items</p></footer>`;
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

const privacyBodyHtml = `<p>Blueprint is a free, independent study resource by Holy Shifted. This page describes what the site you are reading actually does.</p>
<h2>What this site collects: nothing</h2>
<p>There is no account, no sign-in, no cookie, no analytics, and no tracker of any kind. The practice exam runs entirely in your browser. Your answers, your progress and your results are never sent anywhere — the site has no server-side application, no database, and no API to send them to. Its content security policy blocks outbound connections from the page outright.</p>
<p>The site is served as static files. Like any web server, the host that serves them processes the ordinary request data needed to deliver a page. Nothing is joined to you, stored as a profile, or used for measurement.</p>
<h2>Where your attempt is stored</h2>
<p>Your in-progress attempt and your answers are kept in this browser's <code>localStorage</code>, on your own device, so you can close the tab and come back. Nobody else can read it. Use <strong>Reset and start over</strong> on the quiz screen, or clear this site's data in your browser, and it is gone. When the question set is updated, a saved attempt from the older set is discarded automatically.</p>
<h2>If a mailing list ships later</h2>
<p class="muted">Not live. Nothing below is collected today; there is no form on this site that submits anywhere.</p>
<p>If I add an email list for new practice exams, it would work like this: I would collect your email address, the exact consent text you agreed to, and the date and time you submitted it — used only to send an email when a new Blueprint practice exam is published. Never sold, rented, or shared for anyone else's marketing, never joined to your quiz answers, and the free exam would stay unlocked either way. Every email would carry a one-click unsubscribe. This page would be updated before any of that starts, and consent would be asked for fresh.</p>
<h2>Questions or deletion requests</h2>
<p>Email <code>privacy@holyshifted.com</code>. Since nothing about you is collected today, there is normally nothing to delete beyond the data in your own browser, which you control.</p>
<h2>Changes</h2>
<p>If this note changes in a way that affects how any data is used, I will update the date below.</p>
<p class="muted">Last updated: 14 September 2026.</p>`;

const root = document.querySelector<HTMLDivElement>('#app')!;
const path = location.pathname;

const storageKey = 'blueprint-ccdvf-attempt';
const QUICK_CHECK_SIZE = domains.length;
const PACING_SECONDS_PER_ITEM = 135;

const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function elapsedLabel(startedAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `Elapsed ${minutes}m ${String(seconds % 60).padStart(2, '0')}s (not enforced)`;
}

function mountQuiz() {
  let ticker: ReturnType<typeof setInterval> | undefined;

  function stopTicker() {
    if (ticker !== undefined) {
      clearInterval(ticker);
      ticker = undefined;
    }
  }

  function save(attempt: Attempt) {
    localStorage.setItem(storageKey, JSON.stringify(attempt));
  }

  function begin(mode: AttemptMode) {
    const items =
      mode === 'quick' ? sampleQuickCheck(questions, domains) : questions;
    const attempt = createAttempt(contentVersion, mode, items, (values) => shuffleOptions(values));
    save(attempt);
    renderQuestion(attempt);
  }

  function start(notice?: string) {
    stopTicker();
    const noticeHtml = notice ? `<p class="notice" role="status">${notice}</p>` : '';
    root.innerHTML = shell(
      `<section class="quiz start"><h1>Practice exam: ${examMeta.examName}</h1>${noticeHtml}<p>${examMeta.itemCount} questions · roughly ${examMeta.timeLimitMinutes} minutes, matching the real exam's time limit (not enforced here).</p><p class="disclaimer">Before you start: these ${examMeta.itemCount} questions are original. I wrote them against the published ${examMeta.examCode} blueprint and weighted them across the eight domains the same way the real exam is weighted, so the shape of the paper feels right. They are not the real exam's questions — Anthropic does not publish those, and anything claiming to sell them is selling you something else. Treat a good score here as a sign your preparation is working, not as a prediction.</p><div class="actions"><button id="start-full">Start the practice exam (${examMeta.itemCount} questions)</button><button id="start-quick" class="secondary">Quick check (${QUICK_CHECK_SIZE} questions)</button></div><p class="disclaimer">Quick check: ${QUICK_CHECK_SIZE} questions, one per domain, drawn from the same ${examMeta.itemCount} — you'll meet them again in the full exam. It points you at what to read first. It is not a score and it does not predict the real exam. The full exam stays one click away.</p></section>`
    );
    document.querySelector('#start-full')!.addEventListener('click', () => begin('full'));
    document.querySelector('#start-quick')!.addEventListener('click', () => begin('quick'));
  }

  function resume() {
    const loaded = loadAttempt(localStorage.getItem(storageKey), contentVersion, questions);
    if (loaded.status === 'none') {
      start();
      return;
    }
    if (loaded.status === 'reset') {
      localStorage.removeItem(storageKey);
      start(loaded.reason);
      return;
    }
    renderQuestion(loaded.attempt);
  }

  function focusHeading() {
    document.querySelector<HTMLElement>('#question-heading')?.focus();
  }

  function renderQuestion(attempt: Attempt) {
    stopTicker();
    const items = attemptQuestions(attempt, questions);
    const question = items[attempt.index];
    if (!question) {
      renderResults(attempt);
      return;
    }
    const total = items.length;
    const quick = attempt.mode === 'quick';
    const revealed = Boolean(attempt.answers[question.id]);
    const selected = new Set(attempt.answers[question.id] || []);
    const domainName = domains.find((d) => d.id === question.domainId)?.name || question.domainId;
    const correctCount = question.options.filter((option) => option.correct).length;
    const choices = attempt.order[question.id]
      .map((id) => question.options.find((o) => o.id === id)!)
      .map((option) => {
        const mark = revealed ? (option.correct ? ' correct' : ' incorrect') : '';
        const inputType = question.type === 'single' ? 'type="radio" name="answer"' : 'type="checkbox"';
        const reveal = revealed
          ? `<small><strong>${option.correct ? '✓ Correct' : '× Incorrect'}</strong> ${option.explanation}${selected.has(option.id) ? ' <em>Your selection</em>' : ''}</small>`
          : '';
        return `<label class="option${mark}"><input ${inputType} value="${escapeAttribute(option.id)}" ${selected.has(option.id) ? 'checked' : ''} ${revealed ? 'disabled' : ''}><span>${option.text}</span>${reveal}</label>`;
      })
      .join('');
    const verdict = revealed
      ? `<div class="verdict">${scoreAnswer(question.options, [...selected]) ? '<strong>✓ Correct.</strong> You got this one.' : '<strong>× Incorrect.</strong> Not this one — the explanations under each option say why.'}</div>`
      : '';
    const pacingMinutes = Math.round((total * PACING_SECONDS_PER_ITEM) / 60);
    const answered = answeredQuestions(items, attempt.answers).length;
    const partialExit =
      quick && answered > 0 && answered < total
        ? `<button class="link" id="finish-quick">See where to start now (${answered} of ${total} answered)</button>`
        : '';
    root.innerHTML = shell(
      `<section class="quiz"><p class="eyebrow">${quick ? 'Quick check' : 'Practice exam'} · Question ${attempt.index + 1} of ${total} · ${domainName}</p><progress value="${attempt.index + 1}" max="${total}"></progress><p id="timer" class="muted">${elapsedLabel(attempt.startedAt)}</p><p class="muted">Pacing guide: about ${pacingMinutes} minutes for these ${total} questions.</p><h1 id="question-heading" tabindex="-1">${question.stem}</h1><form id="question-form"><fieldset><legend class="visually-hidden">${question.stem}${question.type === 'multi' ? ` Select ${correctCount} options.` : ''}</legend>${question.type === 'multi' ? `<p>Select ${correctCount}.</p>` : ''}${choices}</fieldset><div id="reveal" aria-live="polite">${verdict}</div><div class="actions">${revealed ? `<button>${attempt.index === total - 1 ? 'See your results' : 'Next question'}</button>` : '<button disabled>Check answer</button>'}</div></form><div class="actions secondary-actions">${partialExit}${quick ? `<button class="link" id="switch-full">Take the full ${examMeta.itemCount}-question exam instead</button>` : ''}<button class="link" id="reset">Reset and start over</button></div></section>`
    );
    const timer = document.querySelector('#timer')!;
    ticker = setInterval(() => (timer.textContent = elapsedLabel(attempt.startedAt)), 1000);
    document.querySelectorAll<HTMLInputElement>('.option input').forEach((input) =>
      input.addEventListener('change', () => {
        const values = [...document.querySelectorAll<HTMLInputElement>('.option input:checked')].map((item) => item.value);
        attempt.answers[question.id] = values;
        save(attempt);
        document.querySelector<HTMLButtonElement>('.actions button')!.disabled = values.length === 0;
      })
    );
    document.querySelector('#question-form')!.addEventListener('submit', (event) => {
      event.preventDefault();
      if (revealed) attempt.index += 1;
      save(attempt);
      renderQuestion(attempt);
      focusHeading();
    });
    document.querySelector('#switch-full')?.addEventListener('click', () => begin('full'));
    document.querySelector('#finish-quick')?.addEventListener('click', () => renderResults(attempt, 'answered'));
    document.querySelector('#reset')!.addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      start();
    });
  }

  function studyPlan(outcomes: DomainOutcome[]): string {
    const missed = outcomes.filter((outcome) => outcome.missed > 0);
    const clean = outcomes.filter((outcome) => outcome.missed === 0);
    const lines = missed
      .map((outcome, position) => {
        const anchor = cheatSheetAnchor(outcome.id);
        const link = anchor
          ? ` <a href="${BASE}/cheat-sheet/#${anchor}">Cheat sheet</a> · <a href="${BASE}/framework/">Framework</a>`
          : '';
        return `<li><strong>${outcome.name}</strong> — ${outcome.got}/${outcome.total} correct · ${outcome.weightPercent}% of the exam${position === 0 ? ' · start here' : ''}.${link}</li>`;
      })
      .join('');
    const cleanLine = clean.length
      ? `<p>You're solid on: ${clean.map((outcome) => outcome.name).join(', ')}. Leave these alone for now.</p>`
      : '';
    return `${missed.length ? `<h2>Review these first</h2><p class="muted">Ordered by what a miss costs you on the real exam — questions missed times that domain's published weight.</p><ol class="study-plan">${lines}</ol>` : '<h2>Nothing to review</h2><p>You answered every question in this set correctly.</p>'}${cleanLine}`;
  }

  function renderResults(attempt: Attempt, scope: 'all' | 'answered' = 'all') {
    stopTicker();
    const all = attemptQuestions(attempt, questions);
    const items = scopedQuestions(all, attempt.answers, scope);
    const partial = scope === 'answered' && items.length < all.length;
    const outcomes = domainOutcomes(items, attempt.answers, domains);
    const quick = attempt.mode === 'quick';
    const correct = items.filter((q) => scoreAnswer(q.options, attempt.answers[q.id] || [])).length;
    const score = scaledScore(correct, items.length);
    const passed = score >= examMeta.passScaledScore;
    const header = quick
      ? `<h1>Where to start</h1><p class="disclaimer">A quick check is not a score. ${partial ? `This is based only on the ${items.length} of ${all.length} questions you answered — the domains you haven't reached yet aren't judged here.` : `These ${items.length} questions — one per domain, drawn from the same ${examMeta.itemCount} — only point you at what to read first.`} It does not predict the real exam.</p>`
      : `<h1>${passed ? "You'd have passed this one." : 'Not there yet.'}</h1><p>${score} out of ${examMeta.maxScaledScore} on this practice set. The real exam passes at ${examMeta.passScaledScore}${passed ? '.' : " — here's where the gaps are."}</p><p class="muted">This is a practice set, not a predictor. The real exam is scaled and equated; this number is just your percentage, weighted by domain.</p>`;
    const emailSection = quick
      ? ''
      : EMAIL_LIVE
        ? `<h2>Want the next one?</h2><p>I'm writing practice sets for the other three Claude certifications. Leave an email and I'll send one message when the next one is live. Nothing else, ever.</p><form id="email-form"><label>Email <input type="email" required placeholder="you@example.com"></label><label><input type="checkbox" required> Email me when a new practice exam goes up. I can unsubscribe from any message.</label><button>Send it to me</button><p id="email-message" aria-live="polite"></p></form><p class="muted">Your email is stored for this one purpose and nothing else. No tracking, no sharing, no other mail.</p>`
        : `<h2>Want the next one?</h2><p class="muted">The mailing list isn't wired up yet for this launch — the practice exam itself is complete and free either way. Check back once the next certification set is ready.</p>`;
    const nextStep = quick
      ? `<div class="actions">${partial ? `<button id="resume-quick">Finish the remaining ${all.length - items.length} quick-check questions</button>` : ''}<button id="go-full"${partial ? ' class="secondary"' : ''}>Take the full ${examMeta.itemCount}-question exam</button></div>`
      : '';
    root.innerHTML = shell(
      `<section class="quiz results">${header}${studyPlan(outcomes)}${nextStep}<p><button class="link" id="review-missed">Review the questions you missed</button></p>${emailSection}<button class="link" id="retake">${quick ? 'Clear this quick check' : 'Retake the exam'}</button></section>`
    );
    document.querySelector('#review-missed')!.addEventListener('click', () => renderReview(attempt, 'missed', scope));
    document.querySelector('#go-full')?.addEventListener('click', () => begin('full'));
    document.querySelector('#resume-quick')?.addEventListener('click', () => {
      renderQuestion(attempt);
      focusHeading();
    });
    if (EMAIL_LIVE && !quick) {
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
      start();
    });
  }

  function renderReview(attempt: Attempt, scope: 'missed' | 'all', itemScope: 'all' | 'answered' = 'all') {
    stopTicker();
    const all = scopedQuestions(attemptQuestions(attempt, questions), attempt.answers, itemScope);
    const missed = missedQuestions(all, attempt.answers);
    const shown = scope === 'missed' ? missed : all;
    const byDomain = domains
      .map((domain) => {
        const group = shown.filter((question) => question.domainId === domain.id);
        if (group.length === 0) return '';
        const articles = group
          .map((question) => {
            const selected = new Set(attempt.answers[question.id] || []);
            const options = attempt.order[question.id]
              .map((id) => question.options.find((o) => o.id === id)!)
              .map(
                (option) =>
                  `<li class="option ${option.correct ? 'correct' : 'incorrect'}"><strong>${option.correct ? '✓ Correct' : '× Incorrect'}</strong> ${option.text}${selected.has(option.id) ? ' <em>Your selection</em>' : ''}<br><small>${option.explanation}</small></li>`
              )
              .join('');
            return `<article class="review-item"><h3>${question.stem}</h3><ul>${options}</ul></article>`;
          })
          .join('');
        return `<section><h2>${domain.name} — ${domain.weightPercent}% of the exam</h2>${articles}</section>`;
      })
      .join('');
    const empty =
      shown.length === 0
        ? '<p>Nothing to show here — you answered every question in this set correctly.</p>'
        : '';
    const noun = itemScope === 'answered' ? 'answered questions' : 'questions';
    root.innerHTML = shell(
      `<section class="quiz review"><h1 id="review-heading" tabindex="-1">${scope === 'missed' ? 'What you missed' : 'Full review'}</h1><p class="muted">${scope === 'missed' ? `${missed.length} of ${all.length} ${noun}, grouped by domain, with the reasoning behind every option.` : `All ${all.length} ${noun}, grouped by domain.`}</p><div class="actions"><button class="link" id="toggle-scope">${scope === 'missed' ? `Show all ${all.length} ${noun}` : 'Show only what I missed'}</button></div>${empty}${byDomain}<button class="link" id="back-to-results">Back to results</button></section>`
    );
    document.querySelector<HTMLElement>('#review-heading')?.focus();
    document
      .querySelector('#toggle-scope')!
      .addEventListener('click', () => renderReview(attempt, scope === 'missed' ? 'all' : 'missed', itemScope));
    document.querySelector('#back-to-results')!.addEventListener('click', () => renderResults(attempt, itemScope));
  }

  resume();
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
