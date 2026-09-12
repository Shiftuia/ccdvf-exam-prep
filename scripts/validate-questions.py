#!/usr/bin/env python3
"""Validate the CCDV-F question bank against the frozen data contract.

Usage: python3 scripts/validate-questions.py [questions.json] [domains.json]
Defaults are content/questions.json and content/domains.json relative to this file.
"""
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_QUESTIONS = ROOT / "content/questions.json"
DEFAULT_DOMAINS = ROOT / "content/domains.json"
EXPECTED_DOMAIN_COUNTS = {
    "applications-integration": 17, "model-selection-optimization": 9,
    "agents-workflows": 8, "prompt-context-engineering": 6,
    "tools-mcps": 6, "security-safety": 4, "claude-code": 2,
    "eval-testing-debugging": 1,
}
EXPECTED_SUBSKILL_COUNTS = {
    "understanding-requirements": 2, "systems-life-cycle": 1,
    "claude-api-mechanics": 4, "sw-eng-foundations": 4,
    "claude-app-design": 4, "config-management": 2,
    "llm-fundamentals": 3, "tech-fundamentals": 3, "model-selection": 1,
    "cost-token-management": 2, "agent-architecture": 3,
    "agent-construction": 3, "agent-patterns": 2, "context-engineering": 2,
    "prompt-engineering": 3, "output-handling": 1, "tool-implementation": 3,
    "mcp-development": 3, "ai-app-security": 2, "guardrails": 1,
    "identity-secrets": 1, "claude-code-operation": 1,
    "agentic-customization": 0, "hooks": 1, "debugging": 1,
}
# Digests, rather than the private identifiers, keep the validator safe to publish.
PRIVATE_IDENTIFIER_DIGESTS = {
    (10, "94594510fb49ac4a0c44ba77ac39e5a8bb8c3340289dc321166e4c501c7514fa"),
    (9, "e34653b5562f715876fbefd2e397ca3f56587e90577eb1d4d6ece438e9d8f391"),
}


def normalise(value):
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def contains_private_identifier(raw):
    compact = re.sub(r"[^a-zA-Z0-9]+", "", raw).upper()
    for length, digest in PRIVATE_IDENTIFIER_DIGESTS:
        for start in range(len(compact) - length + 1):
            candidate = compact[start:start + length]
            if hashlib.sha256(candidate.encode()).hexdigest() == digest:
                return True
    return False


def is_nonempty_string(value):
    return isinstance(value, str) and bool(value.strip())


def validate(questions_doc, domains_doc, raw_questions):
    errors = []
    def error(message):
        errors.append(message)

    required_domain_fields = {
        "examCode", "examName", "examVersion", "itemCount", "timeLimitMinutes",
        "passScaledScore", "maxScaledScore", "domains",
    }
    missing = required_domain_fields - set(domains_doc) if isinstance(domains_doc, dict) else required_domain_fields
    if missing:
        error(f"domains: missing required top-level fields: {', '.join(sorted(missing))}")
        return errors
    if domains_doc["itemCount"] != 53:
        error("domains.itemCount must be 53")
    domains = domains_doc["domains"]
    if not isinstance(domains, list) or len(domains) != 8:
        error("domains.domains must contain exactly 8 domains")
        return errors

    domain_by_id, subskill_domain, declared_subskill_counts = {}, {}, {}
    for index, domain in enumerate(domains):
        label = f"domains.domains[{index}]"
        if not isinstance(domain, dict):
            error(f"{label}: must be an object")
            continue
        for field in ("id", "name", "weightPercent", "questionCount", "subSkills"):
            if field not in domain:
                error(f"{label}: missing {field}")
        domain_id = domain.get("id")
        if not is_nonempty_string(domain_id):
            error(f"{label}.id must be a non-empty string")
            continue
        if domain_id in domain_by_id:
            error(f"domains: duplicate domain id {domain_id!r}")
        domain_by_id[domain_id] = domain
        if domain.get("questionCount") != EXPECTED_DOMAIN_COUNTS.get(domain_id):
            error(f"domains.{domain_id}.questionCount must be {EXPECTED_DOMAIN_COUNTS.get(domain_id)!r}")
        subskills = domain.get("subSkills")
        if not isinstance(subskills, list):
            error(f"domains.{domain_id}.subSkills must be an array")
            continue
        if sum(s.get("questionCount", -1) for s in subskills if isinstance(s, dict)) != domain.get("questionCount"):
            error(f"domains.{domain_id}: sub-skill questionCount values must sum to its questionCount")
        for subskill in subskills:
            if not isinstance(subskill, dict):
                error(f"domains.{domain_id}: sub-skill must be an object")
                continue
            for field in ("id", "name", "weightPercent", "questionCount"):
                if field not in subskill:
                    error(f"domains.{domain_id}: sub-skill missing {field}")
            subskill_id = subskill.get("id")
            if not is_nonempty_string(subskill_id):
                error(f"domains.{domain_id}: sub-skill id must be a non-empty string")
                continue
            if subskill_id in subskill_domain:
                error(f"domains: duplicate sub-skill id {subskill_id!r}")
            subskill_domain[subskill_id] = domain_id
            declared_subskill_counts[subskill_id] = subskill.get("questionCount")

    if set(domain_by_id) != set(EXPECTED_DOMAIN_COUNTS):
        error("domains: ids must exactly match the frozen 8-domain allocation")
    if set(declared_subskill_counts) != set(EXPECTED_SUBSKILL_COUNTS):
        error("domains: ids must exactly match the frozen 25-sub-skill allocation")
    for subskill_id, expected in EXPECTED_SUBSKILL_COUNTS.items():
        if declared_subskill_counts.get(subskill_id) != expected:
            error(f"domains.{subskill_id}.questionCount must be {expected}")
    if sum(d.get("questionCount", -1) for d in domains if isinstance(d, dict)) != 53:
        error("domains: domain questionCount values must sum to 53")

    if not isinstance(questions_doc, dict):
        error("questions: top level must be an object")
        return errors
    for field in ("schemaVersion", "generatedAt", "questions"):
        if field not in questions_doc:
            error(f"questions: missing top-level {field}")
    if questions_doc.get("schemaVersion") != 1:
        error("questions.schemaVersion must be 1")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(questions_doc.get("generatedAt", ""))):
        error("questions.generatedAt must be an ISO date (YYYY-MM-DD)")
    questions = questions_doc.get("questions")
    if not isinstance(questions, list):
        error("questions.questions must be an array")
        return errors
    if len(questions) != 53:
        error(f"questions.questions must contain exactly 53 entries; found {len(questions)}")
    if contains_private_identifier(raw_questions):
        error("questions: contains a prohibited private candidate identifier")

    seen_ids, seen_stems, seen_option_texts = set(), set(), set()
    actual_domains, actual_subskills = Counter(), Counter()
    option_reference = re.compile(r"\b(?:same as|both|either|neither|option|options?|choice|choices?)\s+(?:option\s*)?[a-f](?:\s*(?:,|and|or)\s*(?:option\s*)?[a-f])*\b", re.I)
    all_none = re.compile(r"\b(?:all|none) of the above\b", re.I)
    id_pattern = re.compile(r"^q-[a-z0-9]+(?:-[a-z0-9]+)*$")

    for number, question in enumerate(questions, start=1):
        label = f"question #{number}"
        if not isinstance(question, dict):
            error(f"{label}: must be an object")
            continue
        for field in ("id", "domainId", "subSkillId", "type", "difficulty", "stem", "options", "rationale", "sourceNote"):
            if field not in question:
                error(f"{label}: missing {field}")
        question_id = question.get("id")
        if not is_nonempty_string(question_id) or not id_pattern.fullmatch(question_id):
            error(f"{label}: id must be unique kebab-case prefixed q-")
        elif question_id in seen_ids:
            error(f"{label}: duplicate id {question_id!r}")
        else:
            seen_ids.add(question_id)
        domain_id, subskill_id = question.get("domainId"), question.get("subSkillId")
        if domain_id not in domain_by_id:
            error(f"{label} ({question_id}): unknown domainId {domain_id!r}")
        if subskill_id not in subskill_domain:
            error(f"{label} ({question_id}): unknown subSkillId {subskill_id!r}")
        elif subskill_domain[subskill_id] != domain_id:
            error(f"{label} ({question_id}): subSkillId {subskill_id!r} does not belong to domainId {domain_id!r}")
        actual_domains[domain_id] += 1
        actual_subskills[subskill_id] += 1
        if question.get("type") not in {"single", "multi"}:
            error(f"{label} ({question_id}): type must be single or multi")
        if question.get("difficulty") not in {"easy", "medium", "hard"}:
            error(f"{label} ({question_id}): difficulty must be easy, medium, or hard")
        stem = question.get("stem")
        if not is_nonempty_string(stem):
            error(f"{label} ({question_id}): stem must be non-empty")
        else:
            normal_stem = normalise(stem)
            if normal_stem in seen_stems:
                error(f"{label} ({question_id}): duplicate normalised stem")
            seen_stems.add(normal_stem)
        if not is_nonempty_string(question.get("rationale")):
            error(f"{label} ({question_id}): rationale must be non-empty")
        if not is_nonempty_string(question.get("sourceNote")) or "original" not in question.get("sourceNote", "").lower():
            error(f"{label} ({question_id}): sourceNote must assert the item is original")
        options = question.get("options")
        if not isinstance(options, list):
            error(f"{label} ({question_id}): options must be an array")
            continue
        allowed_option_count = 4 if question.get("type") == "single" else range(4, 7)
        if len(options) not in (allowed_option_count if isinstance(allowed_option_count, range) else (allowed_option_count,)):
            error(f"{label} ({question_id}): {question.get('type')} questions require {'4' if question.get('type') == 'single' else '4–6'} options")
        correct_count, option_ids = 0, set()
        for option_index, option in enumerate(options, start=1):
            option_label = f"{label} ({question_id}) option #{option_index}"
            if not isinstance(option, dict):
                error(f"{option_label}: must be an object")
                continue
            for field in ("id", "text", "correct", "explanation"):
                if field not in option:
                    error(f"{option_label}: missing {field}")
            option_id = option.get("id")
            if not is_nonempty_string(option_id) or option_id in option_ids:
                error(f"{option_label}: option id must be non-empty and unique within its question")
            option_ids.add(option_id)
            if type(option.get("correct")) is not bool:
                error(f"{option_label}: correct must be a boolean")
            elif option["correct"]:
                correct_count += 1
            text = option.get("text")
            if not is_nonempty_string(text):
                error(f"{option_label}: text must be non-empty")
            else:
                normal_text = normalise(text)
                if normal_text in seen_option_texts:
                    error(f"{option_label}: duplicate normalised option text")
                seen_option_texts.add(normal_text)
                if all_none.search(text):
                    error(f"{option_label}: text may not use all/none of the above")
                if option_reference.search(text):
                    error(f"{option_label}: text may not reference another option by letter")
            explanation = option.get("explanation")
            if not is_nonempty_string(explanation):
                error(f"{option_label}: explanation must be non-empty")
            elif len(explanation) > 280:
                error(f"{option_label}: explanation exceeds 280 characters")
        if question.get("type") == "single" and correct_count != 1:
            error(f"{label} ({question_id}): single requires exactly one correct option; found {correct_count}")
        if question.get("type") == "multi" and (correct_count < 2 or correct_count == len(options)):
            error(f"{label} ({question_id}): multi requires at least two correct and at least one incorrect option; found {correct_count}")

    for domain_id, expected in EXPECTED_DOMAIN_COUNTS.items():
        if actual_domains[domain_id] != expected:
            error(f"questions: domain {domain_id!r} requires {expected} items; found {actual_domains[domain_id]}")
    for subskill_id, expected in EXPECTED_SUBSKILL_COUNTS.items():
        if actual_subskills[subskill_id] != expected:
            error(f"questions: sub-skill {subskill_id!r} requires {expected} items; found {actual_subskills[subskill_id]}")
    return errors


def main():
    if len(sys.argv) > 3:
        print("Usage: validate-questions.py [questions.json] [domains.json]")
        return 2
    questions_path = Path(sys.argv[1]) if len(sys.argv) >= 2 else DEFAULT_QUESTIONS
    domains_path = Path(sys.argv[2]) if len(sys.argv) == 3 else DEFAULT_DOMAINS
    try:
        raw_questions = questions_path.read_text(encoding="utf-8")
        questions_doc = json.loads(raw_questions)
        domains_doc = json.loads(domains_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: could not load input: {exc}")
        return 2
    errors = validate(questions_doc, domains_doc, raw_questions)
    if errors:
        print(f"VALIDATION=FAIL errors={len(errors)}")
        for message in errors:
            print(f"ERROR: {message}")
        return 1
    questions = questions_doc["questions"]
    print("VALIDATION=PASS")
    print(f"QUESTIONS={len(questions)}")
    print("DOMAINS=" + ", ".join(f"{key}:{count}" for key, count in sorted(Counter(q['domainId'] for q in questions).items())))
    print("SUBSKILLS=" + ", ".join(f"{key}:{count}" for key, count in sorted(Counter(q['subSkillId'] for q in questions).items())))
    print("TYPES=" + ", ".join(f"{key}:{count}" for key, count in sorted(Counter(q['type'] for q in questions).items())))
    print("DIFFICULTIES=" + ", ".join(f"{key}:{count}" for key, count in sorted(Counter(q['difficulty'] for q in questions).items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
