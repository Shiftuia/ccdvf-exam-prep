# CCDV-F study cheat sheet

A compact reference for the documented CCDV-F blueprint. This is independent, unofficial study material, not affiliated with or endorsed by Anthropic. It contains no real exam questions, leaked content, or answer key.

## 1. Applications & Integration — 33.1%

| Sub-skill | High-value distinctions |
|---|---|
| Understanding Requirements (3.4%) | Business goal → testable functional behavior → measurable non-functional constraint. “Use Sonnet” or “use Batch API” is an architecture decision, not a requirement. Clarify vague success criteria before selecting technology; resolve cost/latency/quality conflicts against an explicit business priority. |
| Systems Life Cycle (2.8%) | Build for the full lifecycle: requirements, design, implementation, test/eval, deploy, observe, improve. Keep a feedback path from production failures into regression evals. Operational requirements—availability, auditability, cost limits, incident recovery—belong in the design, not after launch. |
| Claude API Mechanics (6.8%) | Messages are stateless: application sends the relevant conversation history every request. A response’s `content` is typed blocks, not just text. `stop_reason` controls the next action: `tool_use` needs results, `max_tokens` is truncation, `refusal` is a 200 with unusable content. Stream SSE for progressive delivery; use Batches for non-interactive bulk work at lower cost. |
| Software Engineering Foundations (7.4%) | Retry capacity failures with bounded exponential backoff + jitter; do not retry malformed requests or bad credentials unchanged. A rate-limit 429 with `retry-after` differs from spend-cap 429 with `enforced_spend_limit_reached`. SDK retries can already exist—avoid stacked retry loops. Messages calls are retry-safe; side-effecting tool execution needs idempotency/deduplication. Bound async concurrency. Test free text by structure/rubric, not byte-for-byte. Model context is not transactional state. |
| Claude Application Design (8.6%) | Choose: single call → workflow with fixed code paths → agent with model-directed control flow. Streaming improves perceived latency; batching improves offline throughput/cost. RAG retrieves a relevant subset; caching reduces repeated-prefix cost but does not expand context. Structured JSON constrains a response; strict tool use constrains tool inputs. Citations and JSON output are incompatible in one request. |
| Configuration Management (4.1%) | Version prompts, schemas, model IDs, eval sets, SDKs, and settings like code. A pinned model ID stays the same model; an alias may move. Deprecated still works until retirement; retired fails. Separate environment keys/workspaces and use least privilege. `CLAUDE.md` supplies context; settings and hooks are the enforcement surfaces. |

## 2. Model Selection & Optimization — 16.8%

| Sub-skill | High-value distinctions |
|---|---|
| LLM Fundamentals (5.2%) | Tokens are not words or characters; count tokens for cost and limits. Context includes system prompt, history, tools, tool results, documents, and generated output. Temperature 0 never guaranteed identical output, and newer models can reject non-default sampling parameters. Use diverse canonical examples, not exhaustive edge-case stuffing. Thinking/effort is a task-quality lever, not an automatic correctness switch. |
| Technical Fundamentals (6.1%) | Balance quality, latency, throughput, context capacity, and operating cost. Rate limits are token-bucket constraints (requests/input/output tokens), so a burst can fail despite a high per-minute headline number. Streaming changes delivery behavior, not the intrinsic compute needed. Log model, request ID, usage, latency, cache use, and stop reason. |
| Model Selection (2.7%) | Pick the least costly configuration that meets the measured quality bar. Use an efficiency-first path (start smaller, upgrade on gaps) or capability-first path (start strong, optimize down), then verify with representative evals. Do not choose a model by prestige; do not under-size tasks needing reasoning. |
| Cost/Token Management (2.8%) | Cache stable repeated prefixes; a cache changes price/rate-limit impact, not what fits in context. Batch independent offline requests; stream interactive long responses. Trim tool schemas/results and retrieve only relevant material. Put output caps and bounded agent loops around expensive work; optimize based on token telemetry rather than word-count guesses. |

## 3. Agents & Workflows — 14.7%

| Sub-skill | High-value distinctions |
|---|---|
| Agent Architecture | A workflow follows predefined code paths; an agent selects steps/tools dynamically. Use a workflow when the graph is known; pay the agent cost only for genuine uncertainty. Separate orchestrator authority, worker scope, durable state, permissions, and escalation. More agents add calls, latency, coordination, and failure modes. |
| Agent Construction | Build an explicit loop: call model → inspect stop reason → execute approved tools → return exact results → validate → stop/escalate within a budget. Keep side effects idempotent and authorization outside the model. Persist durable state outside the context window. Use timeouts, retry limits, observability, and recovery paths. |
| Agent Patterns | Prompt chaining: known sequential stages. Routing: classify then send down a known path. Parallelisation: independent predefined work or voting. Orchestrator-workers: subtasks emerge dynamically. Evaluator-optimizer: generate/critique where criteria are clear. Subagents isolate bulky work; retrieval solves corpus scale; compaction solves an already-long conversation. |

## 4. Prompt & Context Engineering — 11.0%

| Sub-skill | High-value distinctions |
|---|---|
| Context Engineering (3.8%) | Treat context as scarce attention. Prefer smallest high-signal context: retrieval for big corpora, concise tool outputs, identifiers instead of full objects, and subagent summaries. Clearing removes selected old blocks; compaction summarizes history and is lossy. Context editing manages a current conversation; memory persists under application control across conversations. |
| Prompt Engineering (4.6%) | Define success criteria and an empirical test before tuning. Write direct instructions a colleague without background could follow. Use `system` for role/standing instructions and user messages for task data. Use 3–5 relevant, diverse examples and clear sections. For long documents: documents first, query last; ask for supporting quotes before synthesis. Prefill is unavailable on current model generations—use structured outputs or clear instructions instead. |
| Output Handling (2.6%) | Branch on `stop_reason`, not HTTP status alone. `end_turn`: natural completion; `tool_use`: return matching tool results; `pause_turn`: continue a server-tool loop; `max_tokens`: truncated; `model_context_window_exceeded`: shrink/compact; `refusal`: inspect details. Structured outputs constrain final JSON; strict tool use constrains tool arguments. Validate semantics even when syntax is guaranteed. Streaming `input_json_delta` is incomplete until block end. |

## 5. Tools & MCPs — 10.6%

| Sub-skill | High-value distinctions |
|---|---|
| Tool Implementation | Tool descriptions determine selection; schemas determine valid shape. Prefer a small set of high-level tools with clear names, parameters, limits, and actionable errors. Every client `tool_use` needs a matching `tool_result` immediately in the next user message; return parallel results together. Put result blocks first and do not append instructions to the same message. `is_error: true` gives the model a chance to correct a call. Client tools run in your app; server tools run for you and return their result inside the assistant turn. |
| MCP Development | Host manages security/consent; one client connects to one server; server exposes tools, resources, prompts. stdio is a local subprocess protocol: JSON-RPC on stdin/stdout, logs only on stderr. Streamable HTTP is the current remote transport; legacy HTTP+SSE is deprecated. Protocol errors are JSON-RPC errors; tool-execution failures are normal results with `isError: true`. MCP annotations are hints, not security enforcement. The Messages API MCP connector is remote HTTPS tools-only; local stdio/resources/prompts need your own MCP client. |

## 6. Security & Safety — 8.1%

| Sub-skill | High-value distinctions |
|---|---|
| AI Application Security | Direct injection comes from an adversarial user; indirect injection rides in third-party pages, email, documents, or tool results. Treat external content as untrusted data, not instructions. Keep it out of system prompts; isolate it in tool-result/data boundaries. Validate tool inputs, constrain permissions, verify sensitive outputs, and limit data exposure. |
| Guardrails | Use defense in depth: prompt guidance, input/output validation, tool allowlists, authorization, confirmation, rate limits, monitoring, and incident paths. Do not rely on a model to enforce a deterministic rule. A refusal or moderation result is a signal to handle, not a substitute for access control. |
| Identity and Secrets | Use scoped, short-lived credentials where possible; keep secrets out of prompts, logs, repositories, and client code. Separate dev/staging/prod identities and budgets. Verify a caller’s authorization at the resource/action boundary; an LLM’s assertion about identity is not proof. Rotate/revoke credentials and audit privileged actions. |

## 7. Claude Code — 3.1%

| Sub-skill | High-value distinctions |
|---|---|
| Claude Code Operation | Know session control, context inspection, permissions, diagnostics, settings, MCP, and safe modes. `/context` confirms what actually loaded; `/doctor` finds configuration issues; debug logging traces failures. A session can resume/fork, but context still has a finite budget. |
| Agentic Customization | Shared project settings are versioned for a team; local settings are personal and higher precedence. `CLAUDE.md` files provide layered context and load by directory; scoped rules reduce irrelevant prompt load. Skills provide progressive disclosure. Model aliases may change; pin a model when reproducibility matters. |
| Hooks | Hooks execute deterministic lifecycle actions; use them for enforceable policy, validation, and automation. Instructions in `CLAUDE.md` can be ignored; a correctly configured hook is a control point. Keep hooks narrow, observable, and fail safely—an overly broad hook can block legitimate work. |

## 8. Evaluation, Testing & Debugging — 2.6%

| Sub-skill | High-value distinctions |
|---|---|
| Debugging and Error Handling | First classify the layer: HTTP/error type (transport/auth/quota/request), tool-loop plumbing, or model output. 400/401/403/404/413 need a change; 429 with retry-after, 500, 504, and 529 can justify bounded retry. A 200 can still be refusal or truncation. Log `request_id`, model, usage, stop reason, tools, and latency. Evals need specific measurable criteria and representative positive/negative cases. Prefer code grading where possible, model grading for nuanced quality, and human review for calibration. Capability suites measure improvement; near-perfect regression suites catch backsliding. |

## Fast recall: recurring traps

- Requirements first; architecture follows.
- HTTP 200 does not guarantee usable output—read `stop_reason`.
- Retry transient capacity errors, not terminal client errors; add jitter and a cap.
- A safe API retry does not make a side-effecting tool retry safe.
- More context is not inherently better; retrieve and prune.
- A workflow has fixed control flow; an agent chooses it at runtime.
- JSON output and strict tool use solve different contracts.
- Prompts guide; code, permissions, schemas, and hooks enforce.
- Model context is not the system of record.
- Measure quality and cost; choose the smallest solution that passes the real bar.
