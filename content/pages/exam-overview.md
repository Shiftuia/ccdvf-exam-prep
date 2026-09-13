# CCDV-F exam overview

CCDV-F is the exam code for Claude Certified Developer Foundations. Version 1.0 took effect in July 2026. It is a certification exam for developers who need to reason about building, operating, and evaluating applications that use Claude.

This is an independent study resource. It is not affiliated with, endorsed by, or sponsored by Anthropic or Pearson VUE. It does not contain real exam questions or an answer key.

## At a glance

| Item | What to expect |
|---|---|
| Exam | Claude Certified Developer Foundations (CCDV-F) |
| Version | 1.0, effective July 2026 |
| Delivery | Pearson VUE, proctored |
| Format | Multiple-choice and multiple-response |
| Length | 53 items; 120 minutes |
| Score | Scaled 0–1000; 720 is the passing score |

The item count and time limit make pacing a practical part of preparation. A useful baseline is a little over two minutes per item, with time reserved to revisit uncertain multiple-response items.

## Official blueprint

The blueprint below is the planning tool most candidates need. Study time should follow the domain weights rather than treating every topic as equal. Individual weights are published for the sub-skills shown with percentages; for the remaining domains, the guide names the sub-skills but does not state a separate percentage for each one.

| Domain | Weight | Sub-skills |
|---|---:|---|
| Applications & Integration | 33.1% | Understanding Requirements (3.4%); Systems Life Cycle (2.8%); Claude API Mechanics (6.8%); Software Engineering Foundations (7.4%); Claude Application Design (8.6%); Configuration Management (4.1%) |
| Model Selection & Optimization | 16.8% | LLM Fundamentals (5.2%); Technical Fundamentals (6.1%); Model Selection (2.7%); Cost/Token Management (2.8%) |
| Agents & Workflows | 14.7% | Agent Architecture; Agent Construction; Agent Patterns |
| Prompt & Context Engineering | 11.0% | Context Engineering (3.8%); Prompt Engineering (4.6%); Output Handling (2.6%) |
| Tools & MCPs | 10.6% | Tool Implementation; MCP Development |
| Security & Safety | 8.1% | AI Application Security; Guardrails; Identity and Secrets |
| Claude Code | 3.1% | Claude Code Operation; Agentic Customization; Hooks |
| Evaluation, Testing & Debugging | 2.6% | Debugging and Error Handling |

### Applications & Integration — 33.1%

This is the largest domain. It rewards sound engineering judgment as much as API recall.

| Sub-skill | Weight | Study focus |
|---|---:|---|
| Understanding Requirements | 3.4% | Turn business goals into testable functional and non-functional requirements before selecting technology. |
| Systems Life Cycle | 2.8% | Design, build, deploy, operate, monitor, and improve an AI application as a system. |
| Claude API Mechanics | 6.8% | Messages, content blocks, tools, streaming, vision, thinking, caching, batches, and API response behavior. |
| Software Engineering Foundations | 7.4% | HTTP/JSON, retries, concurrency, idempotency, version control, state ownership, testing, and observability. |
| Claude Application Design | 8.6% | Select the simplest architecture and platform capability that meets a stated requirement. |
| Configuration Management | 4.1% | Pin and version models, prompts, schemas, settings, credentials, and environment-specific configuration. |

### Model Selection & Optimization — 16.8%

| Sub-skill | Weight | Study focus |
|---|---:|---|
| LLM Fundamentals | 5.2% | Tokens, context windows, sampling limits, non-determinism, examples, thinking, and output limits. |
| Technical Fundamentals | 6.1% | How model, application, and infrastructure constraints interact in a production system. |
| Model Selection | 2.7% | Match capability, latency, quality, and task complexity; avoid both over- and under-provisioning. |
| Cost/Token Management | 2.8% | Token accounting, caching, batching, routing, and budgets. |

### Agents & Workflows — 14.7%

| Sub-skill | Study focus |
|---|---|
| Agent Architecture | Decide whether a single call, workflow, or agent is warranted; manage delegation, tools, state, and oversight. |
| Agent Construction | Build reliable loops around tools, state, validation, recovery, and permissions. |
| Agent Patterns | Recognize routing, chaining, parallelisation, orchestrator-workers, evaluator-optimizer, subagents, and memory patterns. |

### Prompt & Context Engineering — 11.0%

| Sub-skill | Weight | Study focus |
|---|---:|---|
| Context Engineering | 3.8% | Keep a small, high-signal context through retrieval, pruning, compaction, and isolation. |
| Prompt Engineering | 4.6% | Clear instructions, roles, structured prompts, examples, empirical iteration, and current model constraints. |
| Output Handling | 2.6% | Read stop reasons, validate outputs, handle streaming, use structured outputs, and recover safely. |

### Tools & MCPs — 10.6%

| Sub-skill | Study focus |
|---|---|
| Tool Implementation | Define useful tools, run the tool loop correctly, validate input, design concise results, and distinguish client from server tools. |
| MCP Development | Understand hosts, clients, servers, transports, tools/resources/prompts, security, and Claude integration paths. |

### Security & Safety — 8.1%

| Sub-skill | Study focus |
|---|---|
| AI Application Security | Model prompt injection, untrusted content, tool abuse, data exposure, and layered defenses. |
| Guardrails | Put deterministic constraints at the lowest appropriate layer; validate actions and outputs. |
| Identity and Secrets | Least privilege, scoped credentials, rotation, environment separation, and safe authorization boundaries. |

### Claude Code — 3.1%

| Sub-skill | Study focus |
|---|---|
| Claude Code Operation | Sessions, context, permissions, commands, diagnostics, settings, and MCP use. |
| Agentic Customization | Project instructions, rules, skills, subagents, settings scope, and configuration precedence. |
| Hooks | Deterministic lifecycle automation and policy enforcement; hooks are not just another kind of prompt. |

### Evaluation, Testing & Debugging — 2.6%

| Sub-skill | Study focus |
|---|---|
| Debugging and Error Handling | Separate transport, integration, and model-output failures; choose bounded recovery and evaluate behavior empirically. |

## What the score report tells you

After an attempt, the score report gives a scaled score and percentage-correct results by objective. That is useful for directing a retake or targeted study plan: it shows where your performance was weaker relative to the blueprint.

It does not identify the particular items you missed, reveal the answer you selected, or provide item-level explanations. Treat it as an objective-level diagnostic, not a post-exam answer key.

## Where to verify the details

The authoritative source for eligibility, registration, policies, current objectives, and changes to the exam is Anthropic’s Partner Academy exam guide for CCDV-F. Check it before booking: certification programs can change their delivery policies, objectives, or versioning.

Use this site as a study companion, not as a substitute for the official guide. Its practice material is original and designed around the documented blueprint; it is not copied from, based on, or claimed to reproduce real exam items.
