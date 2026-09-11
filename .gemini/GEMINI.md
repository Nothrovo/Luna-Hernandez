# ECC for Gemini CLI

This file provides Gemini CLI with the baseline ECC workflow, review standards, and security checks for repositories that install the Gemini target.

## Overview

Everything Claude Code (ECC) is a cross-harness coding system with 36 specialized agents, 142 skills, and 68 commands.

Gemini support is currently focused on a strong project-local instruction layer via `.gemini/GEMINI.md`, plus the shared MCP catalog and package-manager setup assets shipped by the installer.

## Core Workflow

1. Plan before editing large features.
2. Prefer test-first changes for bug fixes and new functionality.
3. Review for security before shipping.
4. Keep changes self-contained, readable, and easy to revert.

## Coding Standards

- Prefer immutable updates over in-place mutation.
- Keep functions small and files focused.
- Validate user input at boundaries.
- Never hardcode secrets.
- Fail loudly with clear error messages instead of silently swallowing problems.

## Security Checklist

Before any commit:

- No hardcoded API keys, passwords, or tokens
- All external input validated
- Parameterized queries for database writes
- Sanitized HTML output where applicable
- Authz/authn checked for sensitive paths
- Error messages scrubbed of sensitive internals

## Delivery Standards

- Use conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`
- Run targeted verification for touched areas before shipping
- Prefer contained local implementations over adding new third-party runtime dependencies

## ECC Areas To Reuse

- `AGENTS.md` for repo-wide operating rules
- `skills/` for deep workflow guidance
- `commands/` for slash-command patterns worth adapting into prompts/macros
- `mcp-configs/` for shared connector baselines

## Midas Project Profile

Midas generates the production n8n workflow from `build-bot.mjs`. Treat
`midas-bot.n8n.json` and `docker/n8n-data/midas-bot.n8n.json` as generated
artifacts: edit the builder and supporting modules first, run `npm test`, and
verify that both generated copies remain byte-identical.

For stock, futures, provider, persistence, prompt, or market-analysis changes,
read the applicable project-local skill completely before editing:

1. `skills/api-connector-builder/SKILL.md` for provider adapters and contracts.
2. `skills/eval-harness/SKILL.md` and `skills/tdd-workflow/SKILL.md` before implementation.
3. `skills/backend-patterns/SKILL.md`, `skills/error-handling/SKILL.md`, and
   `skills/database-migrations/SKILL.md` for module boundaries and SQLite changes.
4. `skills/cost-aware-llm-pipeline/SKILL.md` for Gemini calls, retries, and quota use.
5. `skills/ai-regression-testing/SKILL.md` for every bug fix or branch change.
6. `skills/verification-loop/SKILL.md` after implementation.
7. `skills/agent-architecture-audit/SKILL.md` for changes to prompts, memory,
   tool routing, or structured output.
8. `skills/loop-design-check/SKILL.md` only for scheduled scanners or monitors.

Project-specific invariants:

- Quantitative values and verdicts come from deterministic JavaScript, never
  from Gemini prose.
- External market data is normalized to one candle contract before analysis.
- Use only closed candles. Preserve provider timestamps and disclose stale or
  delayed data in user-visible output.
- Stock, crypto spot, and futures data must keep distinct `assetClass` values.
- Futures analysis is read-only. Do not add order execution without an explicit
  separate request and dedicated paper-trading tests.
- Every provider response uses a fixture-backed contract test. Every fixed bug
  gets a regression test named after the behavior it protects.
- Existing crypto commands and position accounting must remain behaviorally
  compatible.
- Do not make checkpoint commits automatically; commit only when the user asks.
